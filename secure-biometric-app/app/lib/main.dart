import 'package:flutter/material.dart';
import 'api.dart';
import 'session.dart';
import 'screens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  const url = String.fromEnvironment('API_URL');
  if (url.isEmpty) {
    runApp(const SetupApp());
    return;
  }
  try {
    final session = Session(Api(url), DeviceStore(), NativeAuth());
    runApp(SecureApp(session: session));
  } catch (_) {
    runApp(const SetupApp());
  }
}

ThemeData appTheme() => ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xff00bcd4),
    brightness: Brightness.dark,
  ),
  scaffoldBackgroundColor: const Color(0xff0d111b),
  useMaterial3: true,
  inputDecorationTheme: const InputDecorationTheme(
    border: OutlineInputBorder(),
    filled: true,
  ),
);

class SetupApp extends StatelessWidget {
  const SetupApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    theme: appTheme(),
    home: const Scaffold(
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(28),
          child: Text(
            'O aplicativo ainda precisa ser conectado ao servidor. Consulte o responsável pela instalação.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    ),
  );
}

class SecureApp extends StatefulWidget {
  final Session session;
  const SecureApp({super.key, required this.session});
  @override
  State<SecureApp> createState() => _SecureAppState();
}

class _SecureAppState extends State<SecureApp> with WidgetsBindingObserver {
  String? startupError;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    widget.session.init().catchError((Object error) {
      if (mounted)
        {setState(
          () => startupError =
              'Não foi possível acessar o armazenamento seguro. Reinicie o aplicativo.',
        );}
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) =>
      widget.session.lifecycle(state);
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    widget.session.dispose();
    widget.session.api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Marcos Secure',
    debugShowCheckedModeBanner: false,
    theme: appTheme(),
    home: AnimatedBuilder(
      animation: widget.session,
      builder: (context, _) {
        final session = widget.session;
        if (startupError != null)
          {return Scaffold(body: Center(child: Text(startupError!)));}
        if (!session.ready)
          {return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );}
        if (!session.foreground)
          {return const Scaffold(
            body: Center(child: Icon(Icons.shield_outlined, size: 72)),
          );}
        if (session.signedIn && !session.unlocked)
          {return LockScreen(session: session);}
        if (!session.signedIn) {return AuthScreen(session: session);}
        return HomeScreen(session: session);
      },
    ),
  );
}
