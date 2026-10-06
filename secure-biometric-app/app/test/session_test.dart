import 'dart:async';
import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:secure_biometric_app/api.dart';
import 'package:secure_biometric_app/session.dart';

class MemoryStore implements SecretStore {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }

  @override
  Future<void> delete(String key) async {
    values.remove(key);
  }
}

class FakeAuth implements DeviceAuth {
  bool accepted = true;
  Completer<bool>? pending;
  @override
  Future<bool> available() async => true;
  @override
  Future<bool> authenticate() async =>
      pending == null ? accepted : pending!.future;
  @override
  Future<void> cancel() async {
    if (pending != null && !pending!.isCompleted) pending!.complete(false);
  }
}

Map<String, dynamic> user = {
  'name': 'Marcos',
  'email': 'marcos@example.com',
  'role': 'user',
};
Session create(
  MemoryStore store,
  FakeAuth auth, {
  Future<http.Response> Function(http.Request)? handler,
}) => Session(
  Api(
    'https://api.example.com/',
    client: MockClient(
      handler ??
          (request) async => http.Response(
            jsonEncode(
              request.url.path == '/v1/me'
                  ? {'user': user}
                  : {'token': 'test-token', 'user': user},
            ),
            200,
          ),
    ),
  ),
  store,
  auth,
);
void main() {
  test('iniciar nunca libera dados sem autenticação', () async {
    final store = MemoryStore()
      ..values.addAll({'session': 'token', 'biometric': 'true'});
    final session = create(store, FakeAuth());
    await session.init();
    expect(session.signedIn, true);
    expect(session.unlocked, false);
    expect(session.user, null);
  });
  test('biometria cancelada não desbloqueia', () async {
    final store = MemoryStore()
      ..values.addAll({'session': 'token', 'biometric': 'true'});
    final session = create(store, FakeAuth()..accepted = false);
    await session.init();
    await session.unlock();
    expect(session.unlocked, false);
  });
  test('biometria exige validação da sessão pelo servidor', () async {
    final store = MemoryStore()
      ..values.addAll({'session': 'token', 'biometric': 'true'});
    final session = create(store, FakeAuth());
    await session.init();
    await session.unlock();
    expect(session.unlocked, true);
    expect(session.user?['name'], 'Marcos');
    session.lifecycle(AppLifecycleState.inactive);
    expect(session.unlocked, false);
  });
  test('sair em segundo plano durante o prompt invalida a tentativa', () async {
    final store = MemoryStore()
      ..values.addAll({'session': 'token', 'biometric': 'true'});
    final auth = FakeAuth()..pending = Completer<bool>();
    final session = create(store, auth);
    await session.init();
    final operation = session.unlock();
    session.lifecycle(AppLifecycleState.paused);
    session.lifecycle(AppLifecycleState.resumed);
    await operation;
    expect(session.unlocked, false);
  });
  test('resposta atrasada do servidor não desbloqueia após bloqueio', () async {
    final store = MemoryStore()
      ..values.addAll({'session': 'token', 'biometric': 'true'});
    final response = Completer<http.Response>();
    final session = create(store, FakeAuth(), handler: (_) => response.future);
    await session.init();
    final operation = session.unlock();
    await Future<void>.delayed(Duration.zero);
    session.lock();
    response.complete(http.Response(jsonEncode({'user': user}), 200));
    await operation;
    expect(session.unlocked, false);
  });
  test('sessão expirada apaga as credenciais locais', () async {
    final store = MemoryStore()
      ..values.addAll({'session': 'token', 'biometric': 'true'});
    final session = create(
      store,
      FakeAuth(),
      handler: (_) async => http.Response('{"message":"Sessão expirada"}', 401),
    );
    await session.init();
    await expectLater(session.unlock(), throwsA(isA<ApiException>()));
    expect(session.signedIn, false);
    expect(store.values, isEmpty);
  });
  test('login redefinirá a biometria para a conta autenticada', () async {
    final store = MemoryStore()..values['biometric'] = 'true';
    final session = create(store, FakeAuth());
    await session.init();
    await session.authenticate('marcos@example.com', 'SenhaTeste123!');
    expect(session.unlocked, true);
    expect(session.biometric, false);
    expect(store.values['session'], 'test-token');
    session.lock();
    expect(session.unlocked, false);
  });
}
