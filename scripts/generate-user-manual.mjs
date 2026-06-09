import { createHmac } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { loadEnvConfig } = nextEnv;
loadEnvConfig(root);

const prisma = new PrismaClient();
const baseUrl = "http://127.0.0.1:3100";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const workDir = path.join(root, ".manual-work");
const outputDir = path.join(root, "public", "docs");
const outputPdf = path.join(outputDir, "manual-wsp-racing.pdf");
const logoPath = path.join(root, "public", "icons", "wsp-app-icon-192.png");

function money(value) {
  return Number(value).toFixed(2);
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function sessionToken(payload) {
  const body = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function atToday(hour, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function daysAgo(days, hour = 10) {
  const date = atToday(hour);
  date.setDate(date.getDate() - days);
  return date;
}

async function seedDemo() {
  const suffix = Date.now().toString().slice(-9);
  const workspace = await prisma.workspace.create({
    data: {
      workshopName: "WSP Racing Demonstração",
      ownerName: "Marcos Oliveira",
      document: `99${suffix}000`,
      phone: "11999990000",
      email: `manual-${suffix}@wsp.demo`,
      trialStartAt: daysAgo(2),
      trialEndsAt: new Date(Date.now() + 365 * 86_400_000),
      subscriptionStatus: "ACTIVE",
      paymentStatus: "CONFIRMED",
      stockViewMode: "completo",
    },
  });

  const owner = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      name: "Marcos Oliveira",
      email: `manual-owner-${suffix}@wsp.demo`,
      phone: "11999990000",
      passwordHash: "manual-only-no-login",
      role: "OWNER",
      isActive: true,
    },
  });
  const mechanic = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      name: "Rafael Mecânico",
      email: `manual-mechanic-${suffix}@wsp.demo`,
      phone: "11988887777",
      passwordHash: "manual-only-no-login",
      role: "STAFF",
      isActive: true,
      isMechanic: true,
      specialty: "Revisão e motor",
      commissionPercent: 8,
    },
  });

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: "Carlos Mendes",
        phone: "11977776666",
        document: "12345678901",
        email: "carlos@exemplo.com",
        address: "Rua das Oficinas, 120",
      },
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: "Fernanda Souza",
        phone: "11966665555",
        document: "98765432100",
        email: "fernanda@exemplo.com",
        address: "Avenida Central, 450",
      },
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: "João Pereira",
        phone: "11955554444",
        document: "45678912300",
        email: "joao@exemplo.com",
        address: "Rua do Motociclista, 88",
      },
    }),
  ]);

  const motorcycles = await Promise.all([
    prisma.motorcycle.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[0].id,
        plate: "ABC1D23",
        brand: "Honda",
        model: "CB 500F",
        year: "2023",
        color: "Vermelha",
      },
    }),
    prisma.motorcycle.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[1].id,
        plate: "MOT2E34",
        brand: "Yamaha",
        model: "Fazer 250",
        year: "2022",
        color: "Azul",
      },
    }),
    prisma.motorcycle.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[2].id,
        plate: "WSP3F45",
        brand: "BMW",
        model: "G 310 GS",
        year: "2024",
        color: "Branca",
      },
    }),
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Revisão completa",
        price: 280,
        description: "Inspeção geral, regulagens e checklist de segurança.",
      },
    }),
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Troca de óleo e filtro",
        price: 90,
        description: "Mão de obra para troca de óleo e filtro.",
      },
    }),
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Manutenção do freio dianteiro",
        price: 160,
        description: "Limpeza, inspeção e substituição das pastilhas.",
      },
    }),
  ]);

  const productDefinitions = [
    ["Óleo 10W40 Premium", 34.9, 59.9, 24, "789100000001", "oleo-10w40.svg", "27101932"],
    ["Filtro de óleo", 18.5, 36.9, 12, "789100000002", "filtro-oleo.svg", "84212300"],
    ["Pastilha de freio dianteira", 58, 109.9, 7, "789100000003", "pastilha-freio.svg", "68138190"],
    ["Vela de ignição", 22, 44.9, 3, "789100000004", "vela-ignicao.svg", "85111000"],
    ["Bateria 7Ah", 145, 239.9, 5, "789100000005", "bateria-moto.svg", "85071090"],
    ["Pneu esportivo traseiro", 310, 489.9, 2, "789100000006", "pneu-esportivo.svg", "40114000"],
  ];
  const products = [];
  for (const [name, buyPrice, sellPrice, quantity, barcode, image, ncm] of productDefinitions) {
    const imageUrl = `/product-presets/${image}`;
    products.push(await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name,
        buyPrice,
        sellPrice,
        quantity,
        barcode,
        ncm,
        cfop: "5102",
        csosn: "102",
        mainImageUrl: imageUrl,
        images: {
          create: {
            url: imageUrl,
            filename: image,
            isMain: true,
          },
        },
      },
    }));
  }

  const salesData = [
    {
      client: clients[0],
      motorcycle: motorcycles[0],
      createdAt: atToday(9, 20),
      paymentMethod: "Pix",
      product: products[0],
      service: services[1],
      productQuantity: 2,
    },
    {
      client: clients[1],
      motorcycle: motorcycles[1],
      createdAt: daysAgo(2, 14),
      paymentMethod: "Cartão de crédito",
      product: products[2],
      service: services[2],
      productQuantity: 1,
    },
    {
      client: clients[2],
      motorcycle: motorcycles[2],
      createdAt: daysAgo(5, 11),
      paymentMethod: "A prazo",
      paymentStatus: "CREDIT_OPEN",
      product: products[4],
      service: services[0],
      productQuantity: 1,
    },
  ];
  const sales = [];
  for (const entry of salesData) {
    const productTotal = Number(entry.product.sellPrice) * entry.productQuantity;
    const serviceTotal = Number(entry.service.price);
    sales.push(await prisma.sale.create({
      data: {
        workspaceId: workspace.id,
        clientId: entry.client.id,
        motorcycleId: entry.motorcycle.id,
        mechanicId: mechanic.id,
        total: productTotal + serviceTotal,
        paymentMethod: entry.paymentMethod,
        paymentStatus: entry.paymentStatus || "PAID",
        paidAt: entry.paymentStatus === "CREDIT_OPEN" ? null : entry.createdAt,
        dueDate: entry.paymentStatus === "CREDIT_OPEN" ? new Date(Date.now() + 7 * 86_400_000) : null,
        createdAt: entry.createdAt,
        items: {
          create: [
            {
              productId: entry.product.id,
              type: "PRODUCT",
              description: entry.product.name,
              quantity: entry.productQuantity,
              unitPrice: entry.product.sellPrice,
              total: productTotal,
            },
            {
              serviceId: entry.service.id,
              type: "SERVICE",
              description: entry.service.name,
              quantity: 1,
              unitPrice: entry.service.price,
              total: serviceTotal,
            },
          ],
        },
      },
    }));
  }

  await prisma.quote.create({
    data: {
      workspaceId: workspace.id,
      clientId: clients[1].id,
      motorcycleId: motorcycles[1].id,
      status: "SENT",
      total: Number(products[5].sellPrice) + Number(services[0].price),
      notes: "Orçamento válido por 7 dias. Peças sujeitas à disponibilidade.",
      items: {
        create: [
          {
            productId: products[5].id,
            type: "PRODUCT",
            description: products[5].name,
            quantity: 1,
            unitPrice: products[5].sellPrice,
            total: products[5].sellPrice,
          },
          {
            serviceId: services[0].id,
            type: "SERVICE",
            description: services[0].name,
            quantity: 1,
            unitPrice: services[0].price,
            total: services[0].price,
          },
        ],
      },
    },
  });

  await Promise.all([
    prisma.appointment.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[0].id,
        motorcycleId: motorcycles[0].id,
        mechanicId: mechanic.id,
        date: atToday(Math.min(18, new Date().getHours() + 1), 30),
        status: "SCHEDULED",
        notes: "Cliente pediu revisão antes de uma viagem.",
        total: Number(services[0].price),
        items: {
          create: {
            serviceId: services[0].id,
            type: "SERVICE",
            description: services[0].name,
            quantity: 1,
            unitPrice: services[0].price,
            total: services[0].price,
          },
        },
      },
    }),
    prisma.appointment.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[1].id,
        motorcycleId: motorcycles[1].id,
        mechanicId: mechanic.id,
        date: atToday(Math.min(19, new Date().getHours() + 2), 15),
        status: "SCHEDULED",
        notes: "Verificar ruído no freio dianteiro.",
        total: Number(products[2].sellPrice) + Number(services[2].price),
        items: {
          create: [
            {
              productId: products[2].id,
              type: "PRODUCT",
              description: products[2].name,
              quantity: 1,
              unitPrice: products[2].sellPrice,
              total: products[2].sellPrice,
            },
            {
              serviceId: services[2].id,
              type: "SERVICE",
              description: services[2].name,
              quantity: 1,
              unitPrice: services[2].price,
              total: services[2].price,
            },
          ],
        },
      },
    }),
  ]);

  await prisma.fiscalConfig.create({
    data: {
      workspaceId: workspace.id,
      companyName: "WSP Racing Demonstração Ltda.",
      cnpj: "12345678000195",
      stateRegistration: "110042490114",
      address: "Rua das Oficinas, 500 - São Paulo/SP",
      phone: "11999990000",
      email: "fiscal@wsp.demo",
      environment: "homologacao",
      defaultNcm: "27101932",
    },
  });
  await prisma.fiscalDocument.create({
    data: {
      workspaceId: workspace.id,
      saleId: sales[0].id,
      type: "NFE",
      status: "DRAFT",
      provider: "SEBRAE",
      environment: "homologacao",
      reference: `manual-${suffix}`,
      message: "Rascunho preparado para preenchimento no Emissor Sebrae.",
    },
  });

  return { workspace, owner };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("O servidor local não iniciou a tempo.");
}

async function capture(page, name, route, options = {}) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(options.delay || 900);
  if (options.action) await options.action(page);
  const file = path.join(workDir, `${name}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: false });
  return file;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function imageDataUrl(file) {
  const bytes = await readFile(file);
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

function chapter({ number, title, intro, image, steps, tip }) {
  return `
    <section class="chapter">
      <div class="chapter-heading">
        <span class="chapter-number">${number}</span>
        <div>
          <p class="eyebrow">MANUAL WSP RACING</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
      </div>
      <p class="intro">${escapeHtml(intro)}</p>
      <img class="screen" src="${image}" alt="${escapeHtml(title)}" />
      <ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      ${tip ? `<div class="tip"><strong>Dica:</strong> ${escapeHtml(tip)}</div>` : ""}
    </section>
  `;
}

async function buildPdf(browser, screenshots) {
  const logo = `data:image/png;base64,${(await readFile(logoPath)).toString("base64")}`;
  const images = {};
  for (const [key, file] of Object.entries(screenshots)) images[key] = await imageDataUrl(file);

  const chapters = [
    {
      title: "Entrar e recuperar a senha",
      intro: "A tela de acesso reúne login, criação de conta e recuperação de senha por email.",
      image: images.login,
      steps: [
        "Informe o email cadastrado e a senha da oficina.",
        "Marque Manter conectado somente em aparelhos de confiança.",
        "Use Esqueci minha senha para receber um link de redefinição por email.",
        "Uma oficina nova pode usar Começar agora para iniciar o cadastro.",
      ],
      tip: "Nunca compartilhe a senha do dono. Cadastre cada funcionário com seu próprio acesso.",
    },
    {
      title: "Painel inicial",
      intro: "O dashboard mostra os números do dia, atalhos rápidos no celular, últimas vendas, agenda e alertas de estoque.",
      image: images.dashboard,
      steps: [
        "Confira serviços, vendas, agendamentos e produtos em baixo estoque.",
        "Use Nova venda para abrir o PDV diretamente.",
        "Clique nos links das listas para abrir o histórico completo.",
        "No celular, use os atalhos de Clientes, Vendas, Estoque, Orçamentos e Serviços.",
      ],
      tip: "O selo no topo informa a situação da assinatura da oficina.",
    },
    {
      title: "Clientes e motocicletas",
      intro: "Cadastre os dados de contato e mantenha todas as motos vinculadas ao proprietário correto.",
      image: images.clients,
      steps: [
        "Preencha nome e telefone; CPF/CNPJ, email e endereço ajudam no fluxo fiscal.",
        "A primeira moto pode ser cadastrada junto com o cliente.",
        "Use a busca por nome, telefone, documento ou placa.",
        "Os botões da lista permitem adicionar moto, editar ou excluir.",
      ],
      tip: "Confirme a placa antes de salvar para manter o histórico de serviços correto.",
    },
    {
      title: "Adicionar moto a um cliente existente",
      intro: "A janela personalizada permite vincular outra moto sem sair da tela de clientes.",
      image: images.motorcycleModal,
      steps: [
        "Clique em Adicionar moto no topo da tela.",
        "Selecione o cliente existente.",
        "Informe placa, modelo, marca, ano e cor.",
        "Clique em Adicionar moto; a lista será atualizada sem recarregar a página inteira.",
      ],
    },
    {
      title: "Agendamentos",
      intro: "Organize data, cliente, moto, mecânico e itens previstos para o atendimento.",
      image: images.appointments,
      steps: [
        "Selecione cliente, moto e mecânico responsável.",
        "Defina data e hora e adicione produtos ou serviços previstos.",
        "Use Editar para corrigir os dados ou Excluir quando necessário.",
        "Em Finalizar e pagar, o sistema gera a venda e baixa o estoque.",
      ],
      tip: "O agendamento finalizado continua no histórico e sua venda fica preservada.",
    },
    {
      title: "PDV e vendas",
      intro: "O PDV registra produtos, serviços, mão de obra, cliente, moto, mecânico e forma de pagamento.",
      image: images.sales,
      steps: [
        "Escolha cliente e moto quando quiser manter histórico ou vender a prazo.",
        "Adicione produtos por seleção, código de barras ou câmera.",
        "Inclua serviços cadastrados e a quantidade necessária.",
        "Defina a forma de pagamento e conclua a venda.",
        "Dono e administrador podem editar ou excluir vendas; o estoque é recalculado no servidor.",
      ],
      tip: "Preços de itens cadastrados são conferidos no servidor e não podem ser alterados pelo navegador.",
    },
    {
      title: "Orçamentos",
      intro: "Monte uma proposta com produtos e serviços, gere PDF, compartilhe e converta o orçamento em venda.",
      image: images.quotes,
      steps: [
        "Selecione cliente e moto.",
        "Adicione itens do estoque e serviços, depois inclua observações.",
        "Use Baixar PDF ou Compartilhar para enviar ao cliente.",
        "Ao aprovar, escolha o pagamento e clique em Aprovar e finalizar.",
        "Orçamentos finalizados também podem ser excluídos sem apagar a venda.",
      ],
    },
    {
      title: "Estoque com fotos e scanner",
      intro: "Cadastre peças, preços, quantidade, códigos fiscais, fotos e código de barras.",
      image: images.stock,
      steps: [
        "Informe preço de compra, venda e quantidade disponível.",
        "Bipe, digite ou use a câmera para ler o código de barras.",
        "No modo Completo, escolha uma imagem pronta ou carregue fotos.",
        "Alterne entre a lista Simples e os cards do modo Completo.",
        "Use os botões de lápis e excluir para manter o catálogo atualizado.",
      ],
      tip: "No celular, permita o uso da câmera no navegador e mantenha o código bem iluminado.",
    },
    {
      title: "Serviços",
      intro: "Cadastre a mão de obra padronizada para reutilizar o mesmo nome e valor em vendas e orçamentos.",
      image: images.services,
      steps: [
        "Informe nome, valor fixo e uma descrição clara.",
        "Use a busca para localizar rapidamente um serviço.",
        "Edite o preço para os próximos lançamentos.",
        "Ao excluir, o histórico antigo mantém a descrição original.",
      ],
    },
    {
      title: "Produção da oficina",
      intro: "A tela de produção organiza a fila do dia por mecânico e destaca serviços abertos e finalizados.",
      image: images.production,
      steps: [
        "Confira a quantidade de serviços do dia.",
        "Veja cada atendimento agrupado pelo mecânico responsável.",
        "Use Abrir agenda para ajustar horários ou finalizar o atendimento.",
        "Itens sem responsável aparecem em uma área separada.",
      ],
    },
    {
      title: "Financeiro",
      intro: "Acompanhe faturamento, lucro bruto estimado, mão de obra e produção por mecânico.",
      image: images.finance,
      steps: [
        "Os indicadores consideram as vendas do mês atual.",
        "Confira o recebimento separado por forma de pagamento.",
        "Veja o total produzido e a comissão estimada de cada mecânico.",
        "Abra Relatórios completos para filtros e impressão.",
      ],
      tip: "Cadastre o preço de compra dos produtos para melhorar a estimativa de lucro.",
    },
    {
      title: "Relatórios",
      intro: "Filtre períodos, analise ticket médio, lucro e produtos mais vendidos e exporte em PDF.",
      image: images.reports,
      steps: [
        "Escolha hoje, últimos 7 dias, mês atual ou um período personalizado.",
        "Clique em Aplicar filtros.",
        "Use Exportar HTML/PDF para imprimir ou salvar o relatório.",
        "O botão Enviar resumo abre uma mensagem pronta no WhatsApp.",
      ],
    },
    {
      title: "Fiscal, recibos e NF-e",
      intro: "Gere comprovantes e prepare mercadorias para emissão de NF-e no Emissor Sebrae.",
      image: images.fiscal,
      steps: [
        "Preencha a configuração fiscal com apoio da contabilidade.",
        "Selecione uma venda e confira a prévia do recibo.",
        "Use Preparar NF-e grátis para gerar a ficha interna.",
        "Conclua assinatura e transmissão no portal oficial do Sebrae.",
        "Importe o XML autorizado para arquivar o documento no WSP.",
      ],
      tip: "Serviços não entram na NF-e de mercadorias e devem seguir o fluxo de NFS-e.",
    },
    {
      title: "Funcionários e permissões",
      intro: "Cada integrante da equipe deve possuir seu próprio acesso e apenas as permissões necessárias.",
      image: images.employees,
      steps: [
        "Cadastre nome, email e senha inicial.",
        "Escolha Funcionário ou Administrador.",
        "Marque quem pode ser selecionado como mecânico responsável.",
        "Informe especialidade e comissão quando aplicável.",
        "Desative o acesso quando alguém sair da equipe.",
      ],
    },
    {
      title: "Configurações e aplicativo",
      intro: "Gerencie assinatura, modo do estoque, senha, tema, dados fiscais e instalação como aplicativo.",
      image: images.settings,
      steps: [
        "Escolha o modo padrão de visualização do estoque.",
        "Altere sua senha periodicamente.",
        "Use o botão de tema para alternar entre claro e escuro.",
        "No Android, instale pelo Chrome ou Edge; no iPhone, use Compartilhar e Adicionar à Tela de Início.",
        "O manual completo também fica disponível nesta tela e no cabeçalho.",
      ],
    },
    {
      title: "Uso no celular",
      intro: "A versão mobile mantém atalhos, menu inferior e acesso rápido aos módulos mais usados no balcão.",
      image: images.mobile,
      steps: [
        "Use os atalhos do dashboard para tarefas frequentes.",
        "A barra inferior abre Início, Clientes, Vendas, Fiscal, Agenda e Mais.",
        "O botão de menu no cabeçalho mostra todos os módulos.",
        "Para escanear códigos, abra o sistema em HTTPS e permita o acesso à câmera.",
      ],
      tip: "Instalar o PWA deixa o WSP com ícone próprio e abertura semelhante a um aplicativo.",
    },
  ];

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A4; margin: 14mm 13mm 15mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; background: white; }
        .cover { height: 267mm; display: flex; flex-direction: column; justify-content: space-between; padding: 22mm 13mm; color: white; background: linear-gradient(145deg, #08090c 0%, #15171d 68%, #450a0a 100%); }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand img { width: 58px; height: 58px; border-radius: 16px; }
        .brand strong { font-size: 25px; font-style: italic; }
        .brand strong span { color: #ef4444; }
        .cover h1 { margin: 0; max-width: 150mm; font-size: 38px; line-height: 1.04; }
        .cover h1 span { display: block; color: #ef4444; }
        .cover p { max-width: 130mm; color: #c7c9d1; font-size: 15px; line-height: 1.7; }
        .cover-footer { border-top: 1px solid #3f3f46; padding-top: 12px; color: #a1a1aa; font-size: 11px; }
        .contents { min-height: 267mm; padding: 10mm 4mm; page-break-before: always; }
        .contents h2 { margin: 0 0 8mm; font-size: 28px; }
        .contents-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
        .contents-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #d5dce5; border-radius: 10px; }
        .contents-item b { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 8px; color: white; background: #dc2626; }
        .contents-item span { font-size: 11px; font-weight: 700; }
        .chapter { page-break-before: always; }
        .chapter-heading { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #dc2626; padding-bottom: 8px; }
        .chapter-number { display: grid; place-items: center; width: 39px; height: 39px; border-radius: 11px; color: white; background: #dc2626; font-size: 19px; font-weight: 900; }
        .eyebrow { margin: 0; color: #dc2626; font-size: 8px; font-weight: 900; letter-spacing: 1.5px; }
        h2 { margin: 2px 0 0; font-size: 23px; color: #111827; }
        .intro { margin: 12px 0; color: #566176; font-size: 11px; line-height: 1.55; }
        .screen { display: block; width: 100%; max-height: 130mm; object-fit: contain; object-position: top center; border: 1px solid #cbd5e1; border-radius: 11px; box-shadow: 0 8px 24px rgba(15, 23, 42, .13); }
        ol { margin: 12px 0 0; padding-left: 22px; columns: 2; column-gap: 10mm; }
        li { break-inside: avoid; margin: 0 0 7px; padding-left: 3px; color: #334155; font-size: 10px; line-height: 1.45; }
        li::marker { color: #dc2626; font-weight: 900; }
        .tip { margin-top: 10px; padding: 9px 11px; border-left: 4px solid #f59e0b; border-radius: 7px; background: #fffbeb; color: #78350f; font-size: 9.5px; line-height: 1.45; }
        .final { min-height: 267mm; page-break-before: always; display: flex; flex-direction: column; justify-content: center; padding: 16mm; border: 1px solid #d5dce5; border-radius: 16px; }
        .final h2 { font-size: 30px; }
        .final-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px; }
        .final-card { padding: 12px; border: 1px solid #d5dce5; border-radius: 10px; background: #f8fafc; }
        .final-card strong { display: block; margin-bottom: 5px; color: #dc2626; font-size: 11px; }
        .final-card p { margin: 0; color: #566176; font-size: 9.5px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <section class="cover">
        <div class="brand">
          <img src="${logo}" alt="" />
          <strong>WSP <span>Racing</span></strong>
        </div>
        <div>
          <p style="color:#ef4444;font-weight:900;letter-spacing:2px">GUIA OFICIAL DO USUÁRIO</p>
          <h1>Manual completo do <span>sistema WSP Racing</span></h1>
          <p>Aprenda a operar clientes, motos, agenda, PDV, estoque, serviços, orçamentos, financeiro, fiscal e equipe no computador e no celular.</p>
        </div>
        <div class="cover-footer">Versão 2.0 · Atualizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date())}</div>
      </section>
      <section class="contents">
        <p class="eyebrow">GUIA RÁPIDO</p>
        <h2>Conteúdo do manual</h2>
        <div class="contents-grid">
          ${chapters.map((item, index) => `<div class="contents-item"><b>${index + 1}</b><span>${escapeHtml(item.title)}</span></div>`).join("")}
        </div>
      </section>
      ${chapters.map((item, index) => chapter({ number: index + 1, ...item })).join("")}
      <section class="final">
        <p class="eyebrow">BOAS PRÁTICAS</p>
        <h2>Checklist para trabalhar com segurança</h2>
        <div class="final-grid">
          <div class="final-card"><strong>Acessos individuais</strong><p>Não compartilhe a conta do dono. Crie um usuário para cada pessoa da equipe.</p></div>
          <div class="final-card"><strong>Dados corretos</strong><p>Revise cliente, moto, preços, quantidades e pagamento antes de finalizar.</p></div>
          <div class="final-card"><strong>Permissões</strong><p>Deixe alterações financeiras e exclusões somente com quem realmente precisa.</p></div>
          <div class="final-card"><strong>Estoque</strong><p>Cadastre compra, venda, código de barras e quantidade para relatórios confiáveis.</p></div>
          <div class="final-card"><strong>Fiscal</strong><p>Confirme NCM, CFOP e impostos com a contabilidade antes de emitir documentos.</p></div>
          <div class="final-card"><strong>Celular</strong><p>Use HTTPS, mantenha o navegador atualizado e permita a câmera apenas no WSP.</p></div>
          <div class="final-card"><strong>Senhas</strong><p>Use senhas longas, não reutilize credenciais e desative funcionários desligados.</p></div>
          <div class="final-card"><strong>Suporte interno</strong><p>O botão Manual no cabeçalho abre sempre esta versão do guia.</p></div>
        </div>
      </section>
    </body>
  </html>`;

  const htmlFile = path.join(workDir, "manual.html");
  await writeFile(htmlFile, html, "utf8");
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPdf,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  await page.close();
}

async function main() {
  if (!existsSync(edgePath)) throw new Error("Microsoft Edge não encontrado.");
  if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
    throw new Error("DATABASE_URL e SESSION_SECRET são obrigatórios.");
  }

  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  let demo;
  let server;
  let browser;
  try {
    demo = await seedDemo();
    server = spawn(
      "cmd.exe",
      ["/d", "/s", "/c", "npm.cmd run dev -- --hostname 127.0.0.1 --port 3100"],
      {
        cwd: root,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (chunk) => process.stdout.write(chunk));
    server.stderr.on("data", (chunk) => process.stderr.write(chunk));
    await waitForServer();

    browser = await chromium.launch({
      executablePath: edgePath,
      headless: true,
      args: ["--disable-gpu", "--hide-scrollbars"],
    });

    const publicContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
      serviceWorkers: "block",
    });
    const publicPage = await publicContext.newPage();
    await publicPage.addInitScript(() => localStorage.setItem("wsp-theme", "dark"));
    const screenshots = {
      login: await capture(publicPage, "01-login", "/login"),
    };
    await publicContext.close();

    const authContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
      serviceWorkers: "block",
    });
    await authContext.addInitScript(() => localStorage.setItem("wsp-theme", "light"));
    await authContext.addCookies([{
      name: "wsp_session",
      value: sessionToken({
        userId: demo.owner.id,
        workspaceId: demo.workspace.id,
        email: demo.owner.email,
        subscriptionStatus: "ACTIVE",
        exp: Date.now() + 2 * 60 * 60_000,
      }),
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1_000) + 7_200,
    }]);
    const page = await authContext.newPage();
    Object.assign(screenshots, {
      dashboard: await capture(page, "02-dashboard", "/dashboard"),
      clients: await capture(page, "03-clientes", "/clientes"),
      motorcycleModal: await capture(page, "04-adicionar-moto", "/clientes", {
        action: async (currentPage) => {
          await currentPage.getByRole("button", { name: "Adicionar moto" }).first().click();
          await currentPage.waitForTimeout(300);
        },
      }),
      appointments: await capture(page, "05-agendamentos", "/agendamentos"),
      sales: await capture(page, "06-vendas", "/vendas"),
      quotes: await capture(page, "07-orcamentos", "/orcamentos"),
      stock: await capture(page, "08-estoque", "/estoque?view=completo"),
      services: await capture(page, "09-servicos", "/servicos"),
      production: await capture(page, "10-producao", "/producao"),
      finance: await capture(page, "11-financeiro", "/financeiro"),
      reports: await capture(page, "12-relatorios", "/relatorios?period=month"),
      fiscal: await capture(page, "13-fiscal", "/fiscal"),
      employees: await capture(page, "14-funcionarios", "/funcionarios"),
      settings: await capture(page, "15-configuracoes", "/configuracoes"),
    });
    await authContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      colorScheme: "light",
      serviceWorkers: "block",
    });
    await mobileContext.addInitScript(() => localStorage.setItem("wsp-theme", "light"));
    await mobileContext.addCookies([{
      name: "wsp_session",
      value: sessionToken({
        userId: demo.owner.id,
        workspaceId: demo.workspace.id,
        email: demo.owner.email,
        subscriptionStatus: "ACTIVE",
        exp: Date.now() + 2 * 60 * 60_000,
      }),
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1_000) + 7_200,
    }]);
    const mobilePage = await mobileContext.newPage();
    screenshots.mobile = await capture(mobilePage, "16-mobile", "/dashboard");
    await mobileContext.close();

    await buildPdf(browser, screenshots);
    const stats = await readFile(outputPdf);
    console.log(`Manual gerado: ${outputPdf} (${money(stats.length / 1024 / 1024)} MB)`);
    await rm(workDir, { recursive: true, force: true });
  } finally {
    await browser?.close().catch(() => null);
    if (server && !server.killed) {
      server.stdout?.removeAllListeners();
      server.stderr?.removeAllListeners();
      if (process.platform === "win32") {
        spawnSync("taskkill.exe", ["/pid", String(server.pid), "/t", "/f"], {
          windowsHide: true,
          stdio: "ignore",
        });
      } else {
        server.kill("SIGTERM");
      }
    }
    if (demo?.workspace.id) {
      await prisma.workspace.delete({ where: { id: demo.workspace.id } }).catch(() => null);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
