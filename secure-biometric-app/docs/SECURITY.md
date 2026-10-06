# Segurança e limites da versão 1

- Senhas: scrypt com sal aleatório de 16 bytes, N=32768, r=8, p=1, derivação de 64 bytes.
- Sessões: tokens opacos de 256 bits; somente SHA-256 dos tokens no banco.
- Armazenamento mobile: Keychain restrito ao aparelho no iOS e armazenamento criptografado no Android. Backup automático Android desabilitado.
- Biometria: local_auth; identificação feita pelo sistema operacional. O app não coleta fotos, moldes faciais ou impressões digitais.
- Biometria libera uma sessão previamente criada por senha. Não substitui autenticação no backend. A sessão é validada pela API ao desbloquear e em toda operação protegida.
- A ativação exige confirmação biométrica. Cancelamento, falha, pausa ou resposta atrasada mantêm o app bloqueado.
- O app oculta o conteúdo quando está inativo e bloqueia quando sai para segundo plano. As telas protegidas são removidas, incluindo formulários e administração.
- A autenticação biométrica é uma barreira na aplicação; o token desta versão não é vinculado a uma chave de hardware que exija biometria a cada leitura. Não se destina a operações bancárias. Dispositivos comprometidos, instrumentação e alterações na biometria cadastrada exigem um modelo mais forte.
- Fallback: senha da conta. Não existe PIN fixo, senha padrão ou administrador público.
- SQL parametrizado, validação de JSON/tamanho, respostas sem segredos, controle de acesso no servidor.
- Limites: 20 tentativas de autenticação por IP/15 min, 10 logins por conta/15 min, 3 solicitações de recuperação por conta/15 min e 300 requisições gerais por IP/15 min. Limites em memória, reiniciados com o processo; a implantação prevista usa uma instância de API. Para múltiplas instâncias, centralize em Redis/proxy.
- TRUST_PROXY aceita X-Forwarded-For apenas quando habilitado. Só habilite quando o proxy sobrescrever esse cabeçalho e a API não estiver exposta diretamente.
- Recuperação por SMTP em produção. No modo local, códigos ficam em data/outbox com permissão restrita. Nunca publique esta pasta.
- SQLite persiste no disco/volume. Faça backup consistente com SQLite, retenção restrita e teste de restauração. Auditoria preserva identificadores técnicos de eventos após exclusão; ajuste retenção à política do serviço antes de disponibilizar a clientes.
- Contas não exigem confirmação de e-mail nesta versão. Recuperação exige acesso ao e-mail. Não use o e-mail não verificado como prova de identidade para processos comerciais.
- HTTPS é obrigatório no app distribuído. HTTP está liberado apenas no manifest de debug para testes locais, mediante ALLOW_HTTP=true.

## Publicação

Antes de disponibilizar publicamente: hospede a API com HTTPS, configure SMTP,
faça backup, defina a política de privacidade/retencão e use suas chaves de
assinatura Android e conta Apple Developer. Certificados e segredos não pertencem ao Git.
