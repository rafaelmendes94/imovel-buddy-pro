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
  images: string[];
  createdAt: string;
  lat: number;
  lng: number;
  decorated?: boolean;
  seaView?: boolean;
  acceptsExchange?: boolean;
  paymentConditions?: string;
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
    title: "Apartamento Frente Mar",
    address: "Av. Beira Mar, 1200",
    city: "Capão da Canoa",
    type: "Apartamento",
    status: "Disponível",
    price: 950000,
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop",
    ],
    createdAt: "2024-01-15",
    lat: -29.7456,
    lng: -50.1028,
  },
  {
    id: "2",
    title: "Cobertura Duplex Vista Mar",
    address: "Rua Sepé, 500",
    city: "Capão da Canoa",
    type: "Apartamento",
    status: "Reservado",
    price: 1800000,
    area: 250,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    ],
    createdAt: "2024-02-10",
    lat: -29.7480,
    lng: -50.1065,
  },
  {
    id: "3",
    title: "Casa em Condomínio Xangri-lá",
    address: "Rua das Hortênsias, 300",
    city: "Xangri-lá",
    type: "Casa",
    status: "Disponível",
    price: 1200000,
    area: 350,
    bedrooms: 4,
    bathrooms: 5,
    parking: 3,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&h=300&fit=crop",
    ],
    createdAt: "2024-03-05",
    lat: -29.8050,
    lng: -50.0520,
  },
  {
    id: "4",
    title: "Sala Comercial Centro Capão",
    address: "Av. Paraguassú, 800",
    city: "Capão da Canoa",
    type: "Comercial",
    status: "Alugado",
    price: 450000,
    area: 80,
    bedrooms: 0,
    bathrooms: 2,
    parking: 1,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
    ],
    createdAt: "2024-01-20",
    lat: -29.7520,
    lng: -50.1100,
  },
  {
    id: "5",
    title: "Terreno Condomínio Xangri-lá",
    address: "Rua dos Coqueiros, 150",
    city: "Xangri-lá",
    type: "Terreno",
    status: "Disponível",
    price: 380000,
    area: 500,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=400&h=300&fit=crop",
    ],
    createdAt: "2024-02-28",
    lat: -29.8100,
    lng: -50.0450,
  },
  {
    id: "6",
    title: "Apartamento Praia de Atlântida",
    address: "Av. Central, 200",
    city: "Xangri-lá",
    type: "Apartamento",
    status: "Vendido",
    price: 620000,
    area: 75,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop",
    ],
    createdAt: "2024-03-12",
    lat: -29.7900,
    lng: -50.0650,
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
