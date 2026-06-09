# WSP Racing

SaaS oficial para gerenciamento de oficina de motos com Next.js 16 App Router, Prisma ORM, Neon PostgreSQL, Neon Auth, trial de 7 dias e assinatura recorrente Asaas.

## Recursos principais

- Cada oficina possui um workspace isolado; todas as consultas usam `workspaceId` da sessão.
- Dono/administrador pode cadastrar funcionários em `/funcionarios`.
- Funcionários podem ter acesso próprio e podem ser marcados como mecânicos.
- Vendas e agendamentos permitem escolher o mecânico responsável.
- A venda possui botão "Adicionar mão de obra" para lançar descrição e valor da mão de obra.
- Área de Produção em `/producao` com fila por mecânico.
- Área Financeira em `/financeiro` com faturamento, lucro bruto, mão de obra e comissão estimada.
- Estoque com seletor `Simples`/`Completo`.
- Estoque simples mostra ID curto, produto, código de barras, quantidade e valor.
- Estoque completo mostra cards com fotos principais.
- Fotos leves pré-carregadas em `public/product-presets`.
- Upload de fotos comprime a imagem no navegador antes do envio.
- PDV e estoque possuem campo para leitor de código de barras; no estoque também há leitura por câmera quando o navegador suporta `BarcodeDetector`.
- Vendas a prazo ficam em `/vendas-a-prazo` e podem ser finalizadas quando o cliente pagar.

## Instalação

```bash
npm install
cp .env.example .env
```

Configure no `.env`:

- `DATABASE_URL` do Neon PostgreSQL
- `SESSION_SECRET` com uma chave grande
- `NEXT_PUBLIC_APP_URL` com a URL pública do sistema
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `ASAAS_BASE_URL`
- `BLOB_READ_WRITE_TOKEN` para uploads em produção
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL` e `NEON_AUTH_COOKIE_SECRET`

Banco:

```bash
npx prisma generate
npx prisma db push
```

Rodar local:

```bash
npm run dev
```

Abra `http://localhost:3000` e crie uma conta real em `/register`.

## Recuperação de senha

O fluxo usa o Neon Auth e envia um link de uso único com validade de 15 minutos. O SMTP compartilhado do Neon atende desenvolvimento e testes. Para produção, configure um provedor SMTP próprio em **Neon → Auth → Email provider** para melhorar entrega e limites.

## Neon Auth

O sistema usa `@neondatabase/auth` e `@neondatabase/auth-ui`. Contas novas são sincronizadas no cadastro. Contas antigas migram de forma progressiva no próximo login ou ao solicitar recuperação de senha, sem exigir troca antecipada da senha. O WSP mantém sua sessão de workspace para papéis e isolamento da oficina.

## Trial e assinatura

- Toda conta inicia com 7 dias grátis.
- Após o trial, dashboard e módulos internos são bloqueados se a assinatura não estiver ativa.
- O plano WSP Racing Pro custa R$ 50,00/mês.
- O checkout/assinatura usa Asaas. O sistema não possui login ADM/admin fixo.

## Webhook Asaas

Configure no Asaas:

```text
https://SEU-DOMINIO.com/api/asaas/webhook
```

O token do webhook deve ser igual ao `ASAAS_WEBHOOK_TOKEN`.

Eventos tratados:

- `PAYMENT_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_OVERDUE`
- `PAYMENT_DELETED`
- `PAYMENT_REFUNDED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_DELETED`
- `SUBSCRIPTION_UPDATED`

## Produção

Na Vercel, configure as variáveis de ambiente para a URL pública do app, o banco Neon e o Asaas.

Variáveis obrigatórias:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL` com a URL pública da sua implantação Vercel
- `ASAAS_API_KEY` com a chave de produção do Asaas
- `ASAAS_WEBHOOK_TOKEN` com o token do webhook do Asaas
- `ASAAS_BASE_URL="https://api.asaas.com/v3"`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_JWKS_URL`
- `NEON_AUTH_COOKIE_SECRET`

Uploads de produtos usam Vercel Blob. Ao conectar o Blob ao projeto, a Vercel cria `BLOB_READ_WRITE_TOKEN` automaticamente.

O webhook Asaas deve apontar para:

```text
https://SEU-DOMINIO.vercel.app/api/asaas/webhook
```

## Emissão fiscal

A tela `/fiscal` gera recibos não fiscais e prepara NF-e de mercadorias para emissão gratuita no Emissor Sebrae.

Fluxo:

1. Complete os dados fiscais da oficina e dos produtos.
2. Selecione uma venda e gere a ficha de preparação.
3. Confira, assine e transmita no portal `https://emissornfe.sebrae.com.br`.
4. Baixe o XML autorizado no Sebrae e importe no WSP para arquivamento.

O Sebrae não oferece API pública para transmissão automática. O uso do emissor não tem cobrança por nota, mas o certificado digital pode ter custo externo. A assinatura fiscal permanece no portal oficial e exige Conta Sebrae, credenciamento na SEFAZ e certificado digital A1 ou A3. Comece em homologação e confirme NCM, CFOP, CSOSN, PIS e COFINS com a contabilidade. Serviços não fazem parte da NF-e de mercadorias e devem ser emitidos por NFS-e.
