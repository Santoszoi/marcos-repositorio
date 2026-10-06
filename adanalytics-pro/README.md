# AdAnalytics Pro

Demonstração pública desenvolvida por Marcos Solutions em Next.js App Router, TypeScript e Tailwind CSS. Recharts é carregado sob demanda.

- Vitrine: https://adanalytics-pro-marcos.marcosmiguel-emily.chatgpt.site
- Código: https://github.com/Santoszoi/marcos-repositorio/tree/main/adanalytics-pro
- Domínio preparado: https://analytics.marcossolutions.com.br (depende da configuração e validação do DNS).

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

Todas as métricas e campanhas são fictícias. Nenhuma API de anúncios é conectada e os botões não alteram Google, Meta ou TikTok Ads. Filtros por plataforma, status e nome, ordenação e ativação/pausa local. CTR consolidado = cliques / impressões × 100; CPC = gasto / cliques; CPA = gasto / conversões. Receita é simulada em reais e ROAS é receita / investimento, nunca uma moeda. A série de seis dias conserva os totais do conjunto filtrado. Requisições simuladas têm atraso e AbortSignal para impedir respostas obsoletas. Estados locais aceitam somente IDs e valores permitidos; campanhas concluídas não reabrem.

Interface responsiva, navegação por teclado, rótulos nos formulários, estados de carregamento/erro/vazio e aviso de simulação. Testes de regras de negócio e integridade dos arquivos publicados. GitHub Actions também constrói e executa o contêiner.

WebMCP: ferramenta de consulta dos indicadores com schema vazio, somente leitura e detecção de suporte do navegador. Validação em navegador compatível indisponível neste ambiente; o recurso opcional não interfere nos fluxos comuns. Inspeção visual e interação em navegador não foram executadas neste ambiente.

## Estrutura

O código segue `src/app`, `src/components`, `src/types`, `src/lib` e `src/context`. Configuração de hospedagem contém somente parâmetros públicos e não inclui segredos. Consulte [DNS-PROJETOS.md](https://github.com/Santoszoi/marcos-repositorio/blob/main/DNS-PROJETOS.md) para os apontamentos oficiais dos projetos.
