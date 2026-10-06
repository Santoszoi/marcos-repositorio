# Marcos Secure • Android e iPhone

Aplicativo Flutter de contas protegidas por senha e biometria nativa, com API
Node.js e banco SQLite. Face ID/Touch ID no iPhone; impressão digital ou
reconhecimento facial compatível no Android. Interface em português.

## O que está implementado

- Cadastro/login por e-mail e senha no backend, dados compartilhados entre aparelhos.
- Sessão no armazenamento seguro do aparelho; bloqueio ao sair do app.
- Ativação/desativação da biometria; senha da conta como alternativa.
- Perfil, troca de senha, recuperação por código de e-mail e exclusão da conta.
- Área administrativa dentro do app: usuários paginados, suspensão/reativação e histórico.
- Administrador criado no servidor, nome inicial Marcos, sem senha padrão.
- API com validação, limites de tentativas e revogação de sessões.
- Testes da API, testes Flutter de sessão e formulários, pipeline de análise/build Android e iOS.

## 1. Instale as ferramentas

No Windows: Git, Node.js 24+, Flutter stable 3.38+ e Android Studio com Android
SDK, emulador e Java 17+. Extraia Flutter em `C:\src\flutter`, adicione
`C:\src\flutter\bin` ao PATH e reabra o terminal.

```powershell
flutter --version
flutter doctor -v
flutter doctor --android-licenses
```

O iPhone exige macOS e Xcode. Flutter e Android podem ser usados em Windows,
Linux ou macOS. Documentação: https://docs.flutter.dev/install

## 2. Execute a API

Abra o terminal na raiz deste projeto:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm test
npm start
```

No Linux/macOS, use `cp .env.example .env`. A API inicia na porta 8080 e cria
`backend/data/app.sqlite`. No modo local, e-mails de recuperação são gravados
em `backend/data/outbox/*.json`; copie o campo `code` para o app. Este modo não
manda e-mails para a internet.

Alternativa local, se tiver Docker: `docker compose up --build` na raiz.
O compose liga a API apenas em localhost e conserva o banco em volume.

## 3. Prepare Android e iOS

Em outro terminal, na raiz do projeto:

```powershell
node scripts/prepare.mjs
cd app
flutter analyze
flutter test
flutter devices
```

O comando gera os projetos nativos oficiais com o Flutter instalado e configura
FragmentActivity, permissões, temas AppCompat, Android mínimo 24, Face ID,
iOS mínimo 13 e Keychain. Ele preserva os arquivos Dart. Execute uma vez após
clonar, tanto no Windows quanto no macOS. A primeira execução baixa dependências.

No emulador Android:

```powershell
flutter run --dart-define=API_URL=http://10.0.2.2:8080/ --dart-define=ALLOW_HTTP=true
```

No aparelho Android conectado por USB:

```powershell
adb reverse tcp:8080 tcp:8080
flutter run --dart-define=API_URL=http://127.0.0.1:8080/ --dart-define=ALLOW_HTTP=true
```

No simulador iOS, com API local no mesmo Mac:

```bash
flutter run --dart-define=API_URL=http://127.0.0.1:8080/ --dart-define=ALLOW_HTTP=true
```

Para iPhone físico, use uma API HTTPS acessível pelo aparelho. O localhost do
aparelho não é o computador. Configure assinatura/Team no Xcode se necessário.

No primeiro acesso, crie a conta, entre com senha e ative a biometria.
O aparelho precisa ter biometria cadastrada nas configurações do sistema.
Não há funcionamento offline das contas: desbloqueio confirma a sessão na API.

## 4. Crie seu administrador

Pare a API e, no terminal do backend, defina suas credenciais privadas:

```powershell
$env:ADMIN_NAME="Marcos"
$env:ADMIN_EMAIL="seu-email@exemplo.com"
$env:ADMIN_PASSWORD="escolha-uma-senha-longa-e-exclusiva"
npm run admin
Remove-Item Env:ADMIN_PASSWORD
npm start
```

Use um e-mail ainda não cadastrado. O comando cria uma conta administrativa;
não promove ou sobrescreve contas existentes. Entre no app com essas credenciais
para abrir **Administrar usuários** e **Histórico de segurança**.

No macOS/Linux: `ADMIN_NAME=Marcos ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin`.
Não salve a senha no repositório nem use a frase do exemplo como senha.

## 5. Implantação e distribuição

Configure a API em servidor Node 24 com disco/volume persistente. Use proxy
HTTPS na frente da porta 8080. No `.env` configure `NODE_ENV=production`,
SMTP_HOST/SMTP_PORT/SMTP_TLS/SMTP_USER/SMTP_PASS/SMTP_FROM. A API se recusa a iniciar
em produção sem SMTP e verifica a conexão antes de abrir a porta.

Use porta 465 com SMTP_TLS=true ou 587 com SMTP_TLS=false e STARTTLS obrigatório.
O projeto inclui Dockerfile com usuário sem privilégios e healthcheck.
Para produção, altere o ambiente do compose e injete seus segredos; o compose
incluído é apenas para desenvolvimento.

```bash
cd app
flutter build apk --release --dart-define=API_URL=https://sua-api.exemplo.com/
flutter build appbundle --release --dart-define=API_URL=https://sua-api.exemplo.com/
# No Mac:
flutter build ipa --dart-define=API_URL=https://sua-api.exemplo.com/
```

Antes de distribuir, configure sua chave Android de release, assinatura e
provisionamento Apple, ícones finais e a política de privacidade do serviço.
O APK padrão do template usa chave de desenvolvimento até você configurar
assinatura de release. Nunca publique essa build como versão de loja.

## Validação desta entrega

Os 6 testes automatizados da API foram executados e passaram neste ambiente.
Também foi testada a configuração nativa com um modelo de projeto simulado,
sem substituir a validação com os SDKs reais.
O SDK Flutter e os SDKs Android/Xcode não estão disponíveis neste ambiente;
portanto os testes Flutter e os builds nativos ainda precisam rodar na sua
máquina ou no GitHub Actions. Não há APK/IPA validado nesta entrega.
O pipeline gera um APK de teste com URL de exemplo, sem backend conectado;
para usá-lo de verdade, compile com o endereço da sua API.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| app/lib | Telas, cliente API, armazenamento e bloqueio |
| app/test | Casos Flutter de sessão e interface |
| backend/src | API, SQLite, senhas, e-mail e administrador |
| backend/test | Testes de contas, permissões e recuperação |
| scripts/prepare.mjs | Geração/configuração dos projetos nativos |
| docs/API.md | Endpoints e contratos |
| docs/SECURITY.md | Segurança, implantação e limites |
| .github/workflows/ci.yml | Análise, testes e builds |

Referências dos plugins: https://pub.dev/packages/local_auth e
https://pub.dev/packages/flutter_secure_storage. Código proprietário de Marcos
Solutions; uso e redistribuição sujeitos à autorização do proprietário.
