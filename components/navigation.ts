import {
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  Gauge,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

export const navGroups = [
  {
    title: "Operação",
    items: [
      { href: "/dashboard", label: "Início", icon: Gauge },
      { href: "/producao", label: "Produção", icon: Wrench },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/agendamentos", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/vendas", label: "Vendas", icon: ShoppingCart },
      { href: "/vendas-a-prazo", label: "Vendas a prazo", icon: Clock3 },
      { href: "/orcamentos", label: "Orçamentos", icon: FileText },
      { href: "/fiscal", label: "Cupom Fiscal", icon: ReceiptText },
      { href: "/estoque", label: "Estoque", icon: Package },
      { href: "/servicos", label: "Serviços", icon: Wrench },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: BarChart3 },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/funcionarios", label: "Funcionários", icon: UserCog },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
] as const;

export const mobileNavItems = [
  navGroups[0].items[0],
  navGroups[0].items[2],
  navGroups[1].items[0],
  navGroups[1].items[3],
  navGroups[0].items[3],
  navGroups[2].items[3],
] as const;
