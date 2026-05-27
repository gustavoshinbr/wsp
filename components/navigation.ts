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
    title: "Operacao",
    items: [
      { href: "/dashboard", label: "Inicio", icon: Gauge },
      { href: "/producao", label: "Producao", icon: Wrench },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/agendamentos", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/vendas", label: "Vendas", icon: ShoppingCart },
      { href: "/vendas-a-prazo", label: "Vendas a prazo", icon: Clock3 },
      { href: "/orcamentos", label: "Orcamentos", icon: FileText },
      { href: "/estoque", label: "Estoque", icon: Package },
      { href: "/servicos", label: "Servicos", icon: Wrench },
    ],
  },
  {
    title: "Gestao",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: BarChart3 },
      { href: "/relatorios", label: "Relatorios", icon: BarChart3 },
      { href: "/funcionarios", label: "Funcionarios", icon: UserCog },
      { href: "/fiscal", label: "Fiscal", icon: ReceiptText },
      { href: "/configuracoes", label: "Configuracoes", icon: Settings },
    ],
  },
] as const;

export const mobileNavItems = [
  navGroups[0].items[0],
  navGroups[0].items[2],
  navGroups[1].items[0],
  navGroups[1].items[3],
  navGroups[0].items[3],
  navGroups[2].items[4],
] as const;
