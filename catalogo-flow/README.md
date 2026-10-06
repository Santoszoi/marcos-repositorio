# Catálogo Flow

Catálogo digital interativo e painel de pedidos desenvolvidos por **Marcos Neves**, com Next.js App Router, TypeScript, Tailwind CSS e Docker. O servidor é adaptado para Cloudflare Workers pelo OpenNext, com persistência D1/SQLite.

## O que funciona

- Vitrine pública do projeto e catálogo com quatro produtos e categorias.
- Sacola com inclusão, remoção, limite de quantidade e rascunho separado por loja.
- Cadastro e login por usuário e senha, logout e painel privado.
- Demonstração individual: cada visitante recebe uma loja e sessão próprias.
- Checkout com validação no servidor, preços em centavos e chave de idempotência.
- Pedidos persistidos no banco, com etapas de preparo, conclusão e cancelamento.
- Controle de disponibilidade dos produtos e configuração do nome/WhatsApp da loja.
- Consulta de CEP via ViaCEP, com validação de resposta, timeout, tentativa adicional e cache limitado.
- Mensagem de pedido codificada em um link `https://wa.me/...`, quando o lojista configura um número.

**O projeto é demonstrativo.** Não processa pagamentos, emite documentos fiscais, envia mensagens automaticamente ou realiza entregas. Use dados fictícios para testar os pedidos. As fotografias são ilustrativas.

## Executar localmente

Requer Node.js 24 ou superior.

```bash
npm ci
npm run db:migrate:local
npm run dev
```

Abra `http://localhost:3000`. Crie uma conta ou use o botão de demonstração. Não existe senha administrativa compartilhada ou credencial real embutida no projeto.

Para testar o mesmo Worker usado na publicação:

```bash
npm run build
npm run db:migrate:local
npx wrangler dev --config wrangler.runtime.json --local --persist-to .wrangler/state --port 3000
```

## Docker

```bash
docker compose up --build
```

O contêiner executa o Worker local com SQLite/D1, aplica as migrações antes de iniciar e mantém os dados no volume `catalogo_data`. A porta fica em `127.0.0.1:3000`. O processo usa o usuário `node` e possui healthcheck. O Docker é uma alternativa para execução local; a demonstração hospedada usa o Worker e o banco gerenciados.

## Validação

```bash
npm test
npm run typecheck
npm run build
npm run test:integration
```

O teste de integração cria um banco temporário e contas de teste com senhas aleatórias em memória. Verifica sessão, cadastro/login/logout, origem das requisições, preços adulterados, indisponibilidade, repetição do checkout, transições de status e isolamento entre duas lojas. Nenhum dado de teste é publicado no banco da demonstração.

## Segurança e estado

- Senhas são armazenadas com bcrypt, custo 12 e salt individual; limite de 72 bytes evita truncamento silencioso.
- Sessões usam tokens aleatórios de 256 bits. O banco guarda somente seu hash SHA-256, com expiração de oito horas.
- O cookie é `HttpOnly`, `SameSite=Lax` e `Secure` em HTTPS. Logout revoga o token no banco.
- APIs privadas conferem a sessão e a propriedade da loja no servidor em cada operação.
- Operações de escrita exigem mesma origem. Os corpos JSON são limitados a 16 KiB e validados com Zod.
- Limites de tentativas são persistidos no banco; requisições SQL usam parâmetros preparados.
- Checkout aceita apenas IDs e quantidades. Produtos, disponibilidade, preços e taxa de entrega são definidos no servidor.
- Uma chave de idempotência identifica cada tentativa por loja, impedindo pedidos duplicados e alterações do mesmo pedido por repetição.
- O carrinho usa reducer com atualizações imutáveis. O navegador conserva apenas IDs e quantidades do rascunho, nunca senhas ou tokens de sessão.
- Pedidos, contas e disponibilidade usam o banco como fonte de verdade. Mudanças de status e disponibilidade têm atualização visual imediata e reversão em caso de falha.

Cadastro não verifica identidade civil ou e-mail. Esta versão usa nome de usuário, não oferece recuperação de senha, MFA, administração global, cobrança ou gestão de estoque físico. A consulta de CEP não substitui a confirmação do endereço pelo cliente.

## Estrutura principal

```text
src/
  app/
    page.tsx
    login/page.tsx
    dashboard/page.tsx
    loja/[slug]/page.tsx
    api/
      auth/{register,login,demo,logout}/route.ts
      checkout/route.ts
      cep/[cep]/route.ts
      orders/route.ts
      orders/[id]/route.ts
      products/[id]/route.ts
      store/route.ts
  components/
    CartModal.tsx
    ProductCard.tsx
    MerchantDashboard.tsx
  context/CartContext.tsx
  types/store.ts
  lib/
db/schema.ts
drizzle/
Dockerfile
docker-compose.yml
```

As migrações geradas em `drizzle/` contêm somente o esquema. Produtos iniciais são inseridos de forma separada na criação de cada loja. O identificador nulo no arquivo Wrangler é reservado ao banco local; não é uma credencial de produção. `.env`, `.dev.vars`, bancos locais e artefatos compilados são ignorados pelo Git.

## Integração opcional do navegador

Em navegadores compatíveis, `get_catalog_cart` permite ler a sacola atual pela API WebMCP, sem criar ou enviar um pedido. A experiência normal funciona sem essa API. A validação em um contexto WebMCP compatível não estava disponível no ambiente de publicação.

## Créditos

Fotos do Unsplash, conforme licença de uso: [hambúrguer, Stanley Kustamin](https://unsplash.com/photos/a-juicy-cheeseburger-with-lettuce-and-tomato-egC8A3EWFms), [batatas, Nils B](https://unsplash.com/photos/a-bowl-of-french-fries-and-sauce-on-a-wooden-table-x-lXO1C1NCA), [pizza, Aurélien Lemasson-Théobald](https://unsplash.com/photos/round-cooked-pizza-x00CzBt4Dfk) e [brownie, Luis Valdez](https://unsplash.com/es/fotos/un-primer-plano-de-una-bandeja-de-brownies-sobre-una-mesa-3Vck3vppPwk). [Licença Unsplash](https://unsplash.com/license).

API de endereços: [documentação oficial ViaCEP](https://viacep.com.br/). A aplicação só envia o CEP à consulta externa.
