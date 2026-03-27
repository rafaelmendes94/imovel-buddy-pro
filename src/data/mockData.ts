export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  type: "Apartamento" | "Casa" | "Comercial" | "Terreno";
  status: "Disponível" | "Vendido" | "Reservado" | "Alugado";
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  broker: string;
  image: string;
  createdAt: string;
  lat: number;
  lng: number;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  sales: number;
  revenue: number;
  avatar: string;
  status: "Ativo" | "Inativo";
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Apartamento Luxo Jardins",
    address: "Rua Oscar Freire, 1200",
    city: "São Paulo",
    type: "Apartamento",
    status: "Disponível",
    price: 1850000,
    area: 180,
    bedrooms: 3,
    bathrooms: 4,
    parking: 2,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    createdAt: "2024-01-15",
    lat: -23.5629,
    lng: -46.6685,
  },
  {
    id: "2",
    title: "Cobertura Duplex Vila Nova",
    address: "Av. Brigadeiro Faria Lima, 3400",
    city: "São Paulo",
    type: "Apartamento",
    status: "Reservado",
    price: 3200000,
    area: 320,
    bedrooms: 4,
    bathrooms: 5,
    parking: 3,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    createdAt: "2024-02-10",
    lat: -23.5868,
    lng: -46.6826,
  },
  {
    id: "3",
    title: "Casa Moderna Alphaville",
    address: "Al. Araguaia, 500",
    city: "Barueri",
    type: "Casa",
    status: "Disponível",
    price: 2100000,
    area: 450,
    bedrooms: 5,
    bathrooms: 6,
    parking: 4,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    createdAt: "2024-03-05",
    lat: -23.4977,
    lng: -46.8490,
  },
  {
    id: "4",
    title: "Sala Comercial Centro",
    address: "Rua XV de Novembro, 200",
    city: "São Paulo",
    type: "Comercial",
    status: "Alugado",
    price: 850000,
    area: 120,
    bedrooms: 0,
    bathrooms: 2,
    parking: 1,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    createdAt: "2024-01-20",
    lat: -23.5475,
    lng: -46.6361,
  },
  {
    id: "5",
    title: "Terreno Condomínio Fechado",
    address: "Estrada do Campo Limpo, 1000",
    city: "Cotia",
    type: "Terreno",
    status: "Disponível",
    price: 480000,
    area: 600,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    createdAt: "2024-02-28",
    lat: -23.6036,
    lng: -46.8780,
  },
  {
    id: "6",
    title: "Studio Moderno Pinheiros",
    address: "Rua dos Pinheiros, 800",
    city: "São Paulo",
    type: "Apartamento",
    status: "Vendido",
    price: 520000,
    area: 45,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    createdAt: "2024-03-12",
    lat: -23.5667,
    lng: -46.6915,
  },
];

export const brokers: Broker[] = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "carlos@imobcrm.com",
    phone: "(11) 99876-5432",
    creci: "123456-SP",
    sales: 24,
    revenue: 8500000,
    avatar: "CS",
    status: "Ativo",
  },
  {
    id: "2",
    name: "Ana Rodrigues",
    email: "ana@imobcrm.com",
    phone: "(11) 99765-4321",
    creci: "234567-SP",
    sales: 18,
    revenue: 6200000,
    avatar: "AR",
    status: "Ativo",
  },
  {
    id: "3",
    name: "Marcos Oliveira",
    email: "marcos@imobcrm.com",
    phone: "(11) 99654-3210",
    creci: "345678-SP",
    sales: 31,
    revenue: 12100000,
    avatar: "MO",
    status: "Ativo",
  },
  {
    id: "4",
    name: "Julia Santos",
    email: "julia@imobcrm.com",
    phone: "(11) 99543-2109",
    creci: "456789-SP",
    sales: 12,
    revenue: 3800000,
    avatar: "JS",
    status: "Inativo",
  },
];

export const salesData = [
  { month: "Jan", vendas: 4, receita: 2800000 },
  { month: "Fev", vendas: 6, receita: 4100000 },
  { month: "Mar", vendas: 3, receita: 1900000 },
  { month: "Abr", vendas: 8, receita: 5600000 },
  { month: "Mai", vendas: 5, receita: 3200000 },
  { month: "Jun", vendas: 7, receita: 4800000 },
];

export const propertyTypeData = [
  { name: "Apartamento", value: 45, fill: "hsl(var(--chart-1))" },
  { name: "Casa", value: 25, fill: "hsl(var(--chart-2))" },
  { name: "Comercial", value: 18, fill: "hsl(var(--chart-3))" },
  { name: "Terreno", value: 12, fill: "hsl(var(--chart-5))" },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}
