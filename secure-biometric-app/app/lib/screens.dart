import 'package:flutter/material.dart';
import 'api.dart';
import 'session.dart';

String? emailValidator(String? value) =>
    RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value?.trim() ?? '')
    ? null
    : 'Informe um e-mail válido.';
String? passwordValidator(String? value) =>
    (value?.length ?? 0) >= 10 && (value?.length ?? 0) <= 128
    ? null
    : 'Use de 10 a 128 caracteres.';

class PageFrame extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> children;
  final List<Widget>? actions;
  const PageFrame({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.actions,
  });
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Marcos Secure'), actions: actions),
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 620),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const Icon(
                Icons.shield_outlined,
                size: 58,
                color: Color(0xff00bcd4),
              ),
              const SizedBox(height: 20),
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(subtitle, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 24),
              ...children,
            ],
          ),
        ),
      ),
    ),
  );
}

Widget gap() => const SizedBox(height: 16);
Widget notice(String? message, {bool error = false}) => message == null
    ? const SizedBox.shrink()
    : Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Semantics(
          liveRegion: true,
          child: Text(
            message,
            style: TextStyle(
              color: error ? Colors.red.shade200 : Colors.cyan.shade200,
            ),
          ),
        ),
      );

class AuthScreen extends StatefulWidget {
  final Session session;
  const AuthScreen({super.key, required this.session});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final form = GlobalKey<FormState>();
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController();
  final code = TextEditingController();
  final confirm = TextEditingController();
  String mode = 'login';
  bool busy = false;
  bool show = false;
  bool error = false;
  String? message;
  void change(String next) {
    setState(() {
      mode = next;
      message = null;
      password.clear();
      confirm.clear();
      code.clear();
    });
  }

  Future<void> submit() async {
    if (busy || !form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      busy = true;
      message = null;
    });
    try {
      if (mode == 'login' || mode == 'register') {
        await widget.session.authenticate(
          email.text.trim(),
          password.text,
          name: mode == 'register' ? name.text.trim() : null,
        );
      } else if (mode == 'forgot') {
        final data = await widget.session.api.call(
          'v1/auth/forgot-password',
          method: 'POST',
          body: {'email': email.text.trim()},
        );
        if (mounted)
          setState(() {
            message = data['message'] as String;
            error = false;
          });
      } else {
        await widget.session.api.call(
          'v1/auth/reset-password',
          method: 'POST',
          body: {'code': code.text.trim(), 'password': password.text},
        );
        if (mounted) {
          change('login');
          setState(() {
            message = 'Senha alterada. Entre com a nova senha.';
            error = false;
          });
        }
      }
    } catch (e) {
      if (mounted)
        setState(() {
          message = e is ApiException
              ? e.message
              : 'Não foi possível concluir. Tente novamente.';
          error = true;
        });
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
    for (final c in [email, password, name, code, confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reset = mode == 'reset';
    final register = mode == 'register';
    final forgot = mode == 'forgot';
    final title = register
        ? 'Crie sua conta'
        : forgot || reset
        ? 'Recupere seu acesso'
        : 'Bem-vindo';
    return PageFrame(
      title: title,
      subtitle: forgot
          ? 'Receba um código no e-mail da sua conta.'
          : reset
          ? 'Cole o código recebido e escolha uma nova senha.'
          : 'Sua conta protegida, em qualquer aparelho.',
      children: [
        Form(
          key: form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (register) ...[
                TextFormField(
                  controller: name,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(labelText: 'Nome'),
                  validator: (v) =>
                      (v?.trim().length ?? 0) >= 2 &&
                          (v?.trim().length ?? 0) <= 80
                      ? null
                      : 'Use de 2 a 80 caracteres.',
                ),
                gap(),
              ],
              if (!reset) ...[
                TextFormField(
                  controller: email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'E-mail'),
                  validator: emailValidator,
                ),
                gap(),
              ],
              if (reset) ...[
                TextFormField(
                  controller: code,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'Código de recuperação',
                  ),
                  validator: (v) =>
                      RegExp(r'^[a-f0-9]{64}$').hasMatch(v?.trim() ?? '')
                      ? null
                      : 'Cole o código completo do e-mail.',
                ),
                gap(),
              ],
              if (!forgot) ...[
                TextFormField(
                  controller: password,
                  obscureText: !show,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: InputDecoration(
                    labelText: reset ? 'Nova senha' : 'Senha',
                    suffixIcon: IconButton(
                      tooltip: show ? 'Ocultar senha' : 'Mostrar senha',
                      onPressed: () => setState(() => show = !show),
                      icon: Icon(
                        show ? Icons.visibility_off : Icons.visibility,
                      ),
                    ),
                  ),
                  validator: mode == 'login'
                      ? (v) => (v?.isNotEmpty ?? false)
                            ? null
                            : 'Informe sua senha.'
                      : passwordValidator,
                ),
                gap(),
              ],
              if (register || reset) ...[
                TextFormField(
                  controller: confirm,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(
                    labelText: 'Confirme a senha',
                  ),
                  validator: (v) =>
                      v == password.text ? null : 'As senhas não conferem.',
                ),
                gap(),
              ],
              notice(message, error: error),
              FilledButton(
                onPressed: busy ? null : submit,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: busy
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          register
                              ? 'Criar conta'
                              : forgot
                              ? 'Enviar código'
                              : reset
                              ? 'Salvar nova senha'
                              : 'Entrar',
                        ),
                ),
              ),
              if (mode == 'login') ...[
                TextButton(
                  onPressed: busy ? null : () => change('register'),
                  child: const Text('Ainda não tenho conta'),
                ),
                TextButton(
                  onPressed: busy ? null : () => change('forgot'),
                  child: const Text('Esqueci minha senha'),
                ),
              ],
              if (forgot)
                TextButton(
                  onPressed: busy ? null : () => change('reset'),
                  child: const Text('Já tenho um código'),
                ),
              if (mode != 'login')
                TextButton(
                  onPressed: busy ? null : () => change('login'),
                  child: const Text('Voltar para entrar'),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class LockScreen extends StatefulWidget {
  final Session session;
  const LockScreen({super.key, required this.session});
  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  String? message;
  Future<void> unlock() async {
    try {
      await widget.session.unlock();
    } catch (_) {
      if (mounted)
        setState(
          () => message =
              'Não foi possível desbloquear. Tente novamente ou entre com sua senha.',
        );
    }
  }

  Future<void> usePassword() async {
    try {
      await widget.session.logout();
    } catch (_) {
      /* Local credentials are cleared even if the network is unavailable. */
    }
  }

  @override
  Widget build(BuildContext context) => PageFrame(
    title: 'Acesso bloqueado',
    subtitle: widget.session.biometric
        ? 'Confirme sua identidade para continuar.'
        : 'Entre novamente com a senha da sua conta.',
    children: [
      if (widget.session.biometric)
        FilledButton.icon(
          onPressed: widget.session.busy ? null : unlock,
          icon: const Icon(Icons.fingerprint),
          label: Text(
            widget.session.busy ? 'Verificando…' : 'Usar Face ID / biometria',
          ),
        ),
      notice(message, error: true),
      TextButton(
        onPressed: widget.session.busy ? null : usePassword,
        child: const Text('Entrar com senha'),
      ),
    ],
  );
}

class HomeScreen extends StatefulWidget {
  final Session session;
  const HomeScreen({super.key, required this.session});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController();
  final current = TextEditingController();
  final password = TextEditingController();
  final confirm = TextEditingController();
  String view = 'home';
  bool busy = false;
  bool error = false;
  String? message;
  List<Map<String, dynamic>> users = [];
  List<Map<String, dynamic>> events = [];
  int offset = 0;
  int total = 0;
  Session get session => widget.session;
  @override
  void initState() {
    super.initState();
    name.text = session.user?['name'] as String? ?? '';
  }

  void change(String next) {
    setState(() {
      view = next;
      message = null;
      current.clear();
      password.clear();
      confirm.clear();
    });
  }

  Future<void> action(Future<void> Function() work, {String? success}) async {
    if (busy) return;
    FocusScope.of(context).unfocus();
    setState(() {
      busy = true;
      message = null;
    });
    try {
      await work();
      if (mounted)
        setState(() {
          message = success;
          error = false;
        });
    } catch (e) {
      if (e is ApiException && e.status == 401) await session.clear();
      if (mounted)
        setState(() {
          message = e is ApiException
              ? e.message
              : 'Não foi possível concluir. Tente novamente.';
          error = true;
        });
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> loadUsers() async {
    final data = await session.api.call('v1/admin/users?offset=$offset');
    if (mounted)
      setState(() {
        users = (data['users'] as List)
            .map((v) => Map<String, dynamic>.from(v as Map))
            .toList();
        total = data['total'] as int;
      });
  }

  Future<void> loadAudit() async {
    final data = await session.api.call('v1/admin/audit');
    if (mounted)
      setState(
        () => events = (data['events'] as List)
            .map((v) => Map<String, dynamic>.from(v as Map))
            .toList(),
      );
  }

  @override
  void dispose() {
    for (final c in [name, current, password, confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    String title = 'Olá, ${session.user?['name'] ?? 'Marcos'}';
    String subtitle = 'Seu espaço protegido.';
    if (view == 'home') {
      children.addAll([
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.verified_user_outlined,
                  color: Colors.cyanAccent,
                ),
                gap(),
                const Text('Conta conectada'),
                Text(session.user?['email'] as String? ?? ''),
                gap(),
                Text(
                  session.biometric
                      ? 'Biometria ativada neste aparelho'
                      : 'Desbloqueio pela senha da conta',
                ),
              ],
            ),
          ),
        ),
        gap(),
        SwitchListTile(
          title: const Text('Desbloquear com biometria'),
          subtitle: const Text(
            'Face ID ou impressão digital cadastrada no aparelho.',
          ),
          value: session.biometric,
          onChanged: busy
              ? null
              : (value) => action(() => session.setBiometric(value)),
        ),
        ListTile(
          leading: const Icon(Icons.person_outline),
          title: const Text('Editar meu nome'),
          onTap: busy ? null : () => change('profile'),
        ),
        ListTile(
          leading: const Icon(Icons.password),
          title: const Text('Alterar senha'),
          onTap: busy ? null : () => change('password'),
        ),
        if (session.admin) ...[
          ListTile(
            leading: const Icon(Icons.manage_accounts_outlined),
            title: const Text('Administrar usuários'),
            onTap: busy
                ? null
                : () {
                    change('users');
                    action(loadUsers);
                  },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Histórico de segurança'),
            onTap: busy
                ? null
                : () {
                    change('audit');
                    action(loadAudit);
                  },
          ),
        ],
        ListTile(
          leading: const Icon(Icons.delete_outline),
          title: const Text('Excluir minha conta'),
          onTap: busy ? null : () => change('delete'),
        ),
        gap(),
        OutlinedButton.icon(
          onPressed: busy ? null : session.lock,
          icon: const Icon(Icons.lock_outline),
          label: const Text('Bloquear agora'),
        ),
        TextButton(
          onPressed: busy ? null : () => action(session.logout),
          child: const Text('Sair da conta'),
        ),
      ]);
    } else if (view == 'users') {
      title = 'Usuários';
      subtitle = '$total conta(s) cadastrada(s).';
      children.add(
        OutlinedButton.icon(
          onPressed: busy ? null : () => action(loadUsers),
          icon: const Icon(Icons.refresh),
          label: const Text('Atualizar'),
        ),
      );
      for (final user in users) {
        children.add(
          Card(
            child: ListTile(
              title: Text(user['name'] as String),
              subtitle: Text(
                '${user['email']}\n${user['role'] == 'admin'
                    ? 'Administrador'
                    : user['active'] == true
                    ? 'Ativo'
                    : 'Suspenso'}',
              ),
              isThreeLine: true,
              trailing: user['role'] == 'admin'
                  ? const Icon(Icons.admin_panel_settings)
                  : Switch(
                      value: user['active'] == true,
                      onChanged: busy
                          ? null
                          : (value) => action(() async {
                              await session.api.call(
                                'v1/admin/users/${user['id']}',
                                method: 'PATCH',
                                body: {'active': value},
                              );
                              await loadUsers();
                            }),
                    ),
            ),
          ),
        );
      }
      children.add(
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: busy || offset == 0
                  ? null
                  : () {
                      offset -= 50;
                      action(loadUsers);
                    },
              child: const Text('Anterior'),
            ),
            TextButton(
              onPressed: busy || offset + 50 >= total
                  ? null
                  : () {
                      offset += 50;
                      action(loadUsers);
                    },
              child: const Text('Próxima'),
            ),
          ],
        ),
      );
    } else if (view == 'audit') {
      title = 'Histórico de segurança';
      subtitle = 'Os últimos 100 eventos registrados pelo servidor.';
      const labels = {
        'account.created': 'Conta criada',
        'account.login': 'Entrada na conta',
        'account.disabled': 'Conta suspensa',
        'account.enabled': 'Conta reativada',
        'password.reset': 'Senha recuperada',
        'password.changed': 'Senha alterada',
        'profile.updated': 'Perfil atualizado',
        'account.deleted': 'Conta excluída',
        'admin.created': 'Administrador criado',
      };
      children.add(
        OutlinedButton(
          onPressed: busy ? null : () => action(loadAudit),
          child: const Text('Atualizar'),
        ),
      );
      for (final event in events) {
        children.add(
          ListTile(
            leading: const Icon(Icons.shield_outlined),
            title: Text(labels[event['action']] ?? event['action'] as String),
            subtitle: Text(
              DateTime.fromMillisecondsSinceEpoch(
                event['created_at'] as int,
              ).toLocal().toString().split('.').first,
            ),
          ),
        );
      }
    } else {
      title = view == 'profile'
          ? 'Editar meu nome'
          : view == 'password'
          ? 'Alterar senha'
          : 'Excluir minha conta';
      subtitle = view == 'delete'
          ? 'Esta ação remove sua conta e encerra todas as sessões. Confirme com sua senha.'
          : 'Atualize os dados da sua conta.';
      children.add(
        Form(
          key: form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (view == 'profile')
                TextFormField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Nome'),
                  validator: (v) =>
                      (v?.trim().length ?? 0) >= 2 &&
                          (v?.trim().length ?? 0) <= 80
                      ? null
                      : 'Use de 2 a 80 caracteres.',
                ),
              if (view != 'profile')
                TextFormField(
                  controller: current,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(labelText: 'Senha atual'),
                  validator: (v) =>
                      (v?.isNotEmpty ?? false) ? null : 'Informe sua senha.',
                ),
              if (view == 'password') ...[
                gap(),
                TextFormField(
                  controller: password,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(labelText: 'Nova senha'),
                  validator: passwordValidator,
                ),
                gap(),
                TextFormField(
                  controller: confirm,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(
                    labelText: 'Confirme a nova senha',
                  ),
                  validator: (v) =>
                      v == password.text ? null : 'As senhas não conferem.',
                ),
              ],
              gap(),
              FilledButton(
                onPressed: busy
                    ? null
                    : () {
                        if (!form.currentState!.validate()) return;
                        action(
                          () async {
                            if (view == 'profile') {
                              await session.api.call(
                                'v1/me',
                                method: 'PATCH',
                                body: {'name': name.text.trim()},
                              );
                              await session.reloadUser();
                            } else if (view == 'password') {
                              await session.api.call(
                                'v1/me/password',
                                method: 'POST',
                                body: {
                                  'currentPassword': current.text,
                                  'password': password.text,
                                },
                              );
                              await session.clear();
                            } else {
                              await session.api.call(
                                'v1/me',
                                method: 'DELETE',
                                body: {'password': current.text},
                              );
                              await session.clear();
                            }
                          },
                          success: view == 'profile'
                              ? 'Nome atualizado.'
                              : null,
                        );
                      },
                child: Text(
                  view == 'delete' ? 'Confirmar exclusão da conta' : 'Salvar',
                ),
              ),
            ],
          ),
        ),
      );
    }
    children.addAll([
      if (busy) const LinearProgressIndicator(),
      notice(message, error: error),
      if (view != 'home')
        TextButton(
          onPressed: busy ? null : () => change('home'),
          child: const Text('Voltar'),
        ),
    ]);
    return PageFrame(
      title: title,
      subtitle: subtitle,
      children: children,
      actions: [
        IconButton(
          tooltip: 'Bloquear',
          onPressed: session.lock,
          icon: const Icon(Icons.lock_outline),
        ),
      ],
    );
  }
}
