# TechService OS

Demonstração pública desenvolvida por Marcos Solutions em Next.js App Router, TypeScript e Tailwind CSS. Estado compartilhado pelo Context e registros versionados no localStorage.

- Vitrine: https://techservice-os-marcos.marcosmiguel-emily.chatgpt.site
- Código: https://github.com/Santoszoi/marcos-repositorio/tree/main/techservice-os
- Domínio preparado: https://os.marcossolutions.com.br (depende da configuração e validação do DNS).

## Executar

```bash
npm ci
npm run dev
```

Abra http://localhost:3000. Para validar:

```bash
npm test
npm run build
npm run typecheck
node scripts/check-export.mjs
```

## Docker de produção

```bash
docker compose up --build -d
```

O build exporta o Next.js para `out/`; Nginx serve páginas e assets na porta 3000 local, com healthcheck. Node 24 participa somente do build. Não é um servidor de desenvolvimento. Não requer credenciais, banco ou tokens. Para encerrar: `docker compose down`. Os dois projetos usam porta 3000 individualmente; para rodar juntos, altere uma porta no Compose.

## Comportamento e limites

Cadastro de O.S. com até 20 itens, quantidades inteiras de 1 a 100, preços não negativos de até R$ 100.000,00 e duas casas decimais. Totais calculados em centavos. Protocolo baseado na data em Brasília e UUID. Pendente → Em andamento → Concluído; cancelamento permitido nos estados ativos e estados finais não reabrem. Valor concluído não significa pagamento recebido. Não emite documentos fiscais. Clientes iniciais fictícios com e-mails example.com. Utilize dados de exemplo. Não há autenticação, backend ou compartilhamento entre dispositivos. Os registros pertencem somente a este navegador e ficam acessíveis a quem usa o mesmo perfil. Leitura validada impede sobrescrever JSON corrompido; falha ao salvar preserva o estado anterior. Eventos storage atualizam outras abas; gravações releem o último conjunto. Gravações exatamente simultâneas entre abas ainda podem seguir a política última gravação vence. Limite de 500 ordens. Restaurar exemplos exige confirmação e substitui os registros locais.

Interface responsiva, navegação por teclado, rótulos nos formulários, estados de carregamento/erro/vazio e aviso de simulação. Testes de regras de negócio e integridade dos arquivos publicados. GitHub Actions também constrói e executa o contêiner.

WebMCP: ferramenta de consulta dos indicadores com schema vazio, somente leitura e detecção de suporte do navegador. Validação em navegador compatível indisponível neste ambiente; o recurso opcional não interfere nos fluxos comuns. Inspeção visual e interação em navegador não foram executadas neste ambiente.

## Estrutura

O código segue `src/app`, `src/components`, `src/types`, `src/lib` e `src/context`. Configuração de hospedagem contém somente parâmetros públicos e não inclui segredos. Consulte [DNS-PROJETOS.md](https://github.com/Santoszoi/marcos-repositorio/blob/main/DNS-PROJETOS.md) para os apontamentos oficiais dos projetos.
