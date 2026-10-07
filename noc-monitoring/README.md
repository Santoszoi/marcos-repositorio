# NOC Telemetry Center

Vitrine e painel de monitoramento de rede desenvolvidos por Marcos Neves com **Next.js (App Router), TypeScript, Tailwind CSS e Recharts**.

## Experiência

- `/`: apresentação do projeto, recursos e acesso à demonstração.
- `/dashboard/`: cinco ativos, tráfego de download/upload, ping, jitter e perda de pacotes.
- Atualização simulada a cada três segundos, com pausa, retomada e reinício.
- Falhas críticas são dispositivos indisponíveis; avisos de degradação aparecem separadamente.
- Latência média calculada somente sobre os equipamentos disponíveis.
- Layout responsivo, navegação por teclado e tabela com rolagem horizontal.

**Todos os dados são simulados.** Esta versão não usa SNMP, ICMP ou agentes reais e não coleta dados de rede. O gateway permanece indisponível para demonstrar o cenário de falha. As métricas não são persistidas; recarregar a página reinicia a demonstração.

## Executar localmente

Requer Node.js 24 ou superior.

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. A biblioteca `recharts` já está incluída nas dependências.

```bash
npm test
npm run typecheck
npm run build
```

A configuração `output: 'export'` gera a versão estática em `out/`, incluindo as duas páginas. Sirva essa pasta com um servidor estático; não abra os arquivos diretamente por `file://`.

## Estrutura

```text
src/
  types/network.ts
  lib/mockData.ts
  components/Brand.tsx
  app/
    globals.css
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
      LatencyChart.tsx
      DeviceStatus.tsx
tests/metrics.test.ts
```

Um dispositivo disponível recebe atenção quando o ping supera 40 ms, o jitter supera 5 ms ou a perda supera 1%. O histórico conserva 24 amostras em intervalos de três segundos.

## Evolução para monitoramento real

Uma integração futura precisa de um backend autenticado, coleta autorizada dos equipamentos e armazenamento das séries temporais. Credenciais e sondas devem permanecer no servidor. A camada tipada em `src/types/network.ts` pode ser usada como contrato para substituir a simulação.

