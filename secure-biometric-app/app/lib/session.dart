import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'api.dart';

abstract class SecretStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class DeviceStore implements SecretStore {
  final FlutterSecureStorage storage = const FlutterSecureStorage(
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.unlocked_this_device,
    ),
  );
  @override
  Future<String?> read(String key) => storage.read(key: key);
  @override
  Future<void> write(String key, String value) =>
      storage.write(key: key, value: value);
  @override
  Future<void> delete(String key) => storage.delete(key: key);
}

abstract class DeviceAuth {
  Future<bool> available();
  Future<bool> authenticate();
  Future<void> cancel();
}

class NativeAuth implements DeviceAuth {
  final LocalAuthentication auth = LocalAuthentication();
  @override
  Future<bool> available() async =>
      (await auth.getAvailableBiometrics()).isNotEmpty;
  @override
  Future<bool> authenticate() => auth.authenticate(
    localizedReason: 'Confirme sua identidade para abrir o aplicativo.',
    biometricOnly: true,
    persistAcrossBackgrounding: false,
  );
  @override
  Future<void> cancel() async {
    await auth.stopAuthentication();
  }
}

class Session extends ChangeNotifier {
  final Api api;
  final SecretStore store;
  final DeviceAuth device;
  Map<String, dynamic>? user;
  bool ready = false;
  bool unlocked = false;
  bool biometric = false;
  bool busy = false;
  bool foreground = true;
  bool _prompt = false;
  int _epoch = 0;
  Session(this.api, this.store, this.device);
  bool get signedIn => api.token != null;
  bool get admin => user?['role'] == 'admin';
  Future<void> init() async {
    try {
      api.token = await store.read('session');
      biometric = await store.read('biometric') == 'true';
      // The server profile is fetched only after password/biometric authentication.
    } finally {
      ready = true;
      notifyListeners();
    }
  }

  void lifecycle(AppLifecycleState state) {
    foreground = state == AppLifecycleState.resumed;
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached ||
        state == AppLifecycleState.hidden) {
      ++_epoch;
      unlocked = false;
      if (_prompt) {
        device.cancel();
      }
    } else if (state == AppLifecycleState.inactive && !_prompt) {
      ++_epoch;
      unlocked = false;
    }
    notifyListeners();
  }

  void lock() {
    ++_epoch;
    unlocked = false;
    notifyListeners();
  }

  Future<void> authenticate(
    String email,
    String password, {
    String? name,
  }) async {
    final epoch = _epoch;
    final data = await api.call(
      name == null ? 'v1/auth/login' : 'v1/auth/register',
      method: 'POST',
      body: {
        'email': email,
        'password': password,
        'name': ?name,
      },
    );
    // Logging in as a different account resets device enrollment.
    await store.delete('biometric');
    biometric = false;
    api.token = data['token'] as String;
    try {
      await store.write('session', api.token!);
    } catch (_) {
      api.token = null;
      rethrow;
    }
    user = Map<String, dynamic>.from(data['user'] as Map);
    unlocked = epoch == _epoch && foreground;
    notifyListeners();
  }

  Future<void> unlock() async {
    if (busy || !biometric || !signedIn) {return;}
    busy = true;
    notifyListeners();
    final epoch = _epoch;
    try {
      _prompt = true;
      final accepted = await device.authenticate();
      _prompt = false;
      // An actual pause invalidates the attempt, including an outstanding API request.
      if (!accepted || epoch != _epoch || !foreground) {return;}
      final data = await api.call('v1/me');
      if (epoch != _epoch || !foreground) {return;}
      user = Map<String, dynamic>.from(data['user'] as Map);
      unlocked = true;
    } on ApiException catch (error) {
      if (error.status == 401) {await clear();}
      rethrow;
    } finally {
      _prompt = false;
      busy = false;
      notifyListeners();
    }
  }

  Future<void> setBiometric(bool enabled) async {
    if (!unlocked) {throw const ApiException(403, 'Desbloqueie o aplicativo.');}
    if (enabled) {
      if (!await device.available())
        {throw const ApiException(
          0,
          'Cadastre Face ID ou impressão digital nas configurações do aparelho.',
        );}
      final epoch = _epoch;
      _prompt = true;
      bool accepted;
      try {
        accepted = await device.authenticate();
      } finally {
        _prompt = false;
      }
      if (!accepted || epoch != _epoch || !foreground) {return;}
    }
    await store.write('biometric', enabled.toString());
    biometric = enabled;
    notifyListeners();
  }

  Future<void> reloadUser() async {
    final data = await api.call('v1/me');
    user = Map<String, dynamic>.from(data['user'] as Map);
    notifyListeners();
  }

  Future<void> clear() async {
    ++_epoch;
    api.token = null;
    user = null;
    unlocked = false;
    biometric = false;
    notifyListeners();
    await store.delete('session');
    await store.delete('biometric');
  }

  Future<void> logout() async {
    try {
      if (signedIn) {await api.call('v1/auth/logout', method: 'POST', body: {});}
    } finally {
      await clear();
    }
  }
}
