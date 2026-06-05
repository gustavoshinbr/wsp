# WSP Racing

SaaS oficial para gerenciamento de oficina de motos com Next.js 14 App Router, Prisma ORM, Neon PostgreSQL, autenticação real, trial de 7 dias e assinatura recorrente Asaas.

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
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `ASAAS_BASE_URL`

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

Na Vercel, configure as variáveis de ambiente, use Neon em produção e troque:

```text
ASAAS_BASE_URL="https://api.asaas.com/v3"
```

Uploads de produtos usam Vercel Blob. Ao conectar o Blob ao projeto, a Vercel cria `BLOB_READ_WRITE_TOKEN` automaticamente.

## Emissão fiscal

A tela `/fiscal` gera recibos não fiscais e integra a emissão de NFC-e com a Focus NFe.

Configure na Vercel:

```text
FOCUS_NFE_TOKEN="token_de_homologacao_ou_producao"
```

Antes de emitir, cadastre a empresa, certificado A1, CSC e habilitação de NFC-e na Focus NFe/SEFAZ. Comece em homologação e confirme NCM, CFOP, CSOSN, PIS e COFINS com a contabilidade. Serviços não são enviados na NFC-e; eles exigem NFS-e própria.
