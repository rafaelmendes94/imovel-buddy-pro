import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Building2, Star, Phone, MapPin, Globe, Mail,
  MessageSquare, Send, ThumbsUp, Clock, Users, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const partnersData: Record<string, {
  name: string;
  logo: string;
  cover: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  since: string;
  rating: number;
  totalRatings: number;
  projects: number;
  comments: { author: string; avatar: string; rating: number; text: string; date: string }[];
}> = {
  "construtora-litoral": {
    name: "Construtora Litoral",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop",
    description: "Referência em construção de alto padrão no litoral gaúcho. Mais de 20 anos de experiência entregando empreendimentos de qualidade com foco em sustentabilidade e inovação.",
    address: "Av. Beira Mar, 1200",
    city: "Capão da Canoa - RS",
    phone: "5551999001001",
    email: "contato@construtoralitoral.com.br",
    website: "www.construtoralitoral.com.br",
    category: "Construtora",
    since: "2003",
    rating: 4.8,
    totalRatings: 32,
    projects: 45,
    comments: [
      { author: "João Mendes", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Excelente construtora! Entregaram meu apartamento no prazo e com acabamento impecável.", date: "2024-03-10" },
      { author: "Maria Clara", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Profissionalismo e qualidade. Recomendo a todos!", date: "2024-02-28" },
      { author: "Pedro Souza", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", rating: 4, text: "Ótima experiência na compra do meu lote. Equipe muito atenciosa.", date: "2024-01-15" },
    ],
  },
  "incorporadora-sul": {
    name: "Incorporadora Sul",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop",
    description: "Incorporadora líder no sul do Brasil, especializada em empreendimentos residenciais e comerciais. Compromisso com inovação arquitetônica e valorização imobiliária.",
    address: "Rua dos Navegantes, 800",
    city: "Xangri-lá - RS",
    phone: "5551999002002",
    email: "contato@incorporadorasul.com.br",
    website: "www.incorporadorasul.com.br",
    category: "Incorporadora",
    since: "2008",
    rating: 4.6,
    totalRatings: 28,
    projects: 32,
    comments: [
      { author: "Ana Beatriz", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Projeto incrível e atendimento de primeira!", date: "2024-03-05" },
      { author: "Carlos Eduardo", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", rating: 4, text: "Bom custo-benefício nos empreendimentos.", date: "2024-02-12" },
    ],
  },
  "imobiliaria-central": {
    name: "Imobiliária Central",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop",
    description: "A maior imobiliária da região, com um portfólio diversificado de imóveis residenciais e comerciais. Atendimento personalizado e expertise no mercado local.",
    address: "Av. Central, 500",
    city: "Capão da Canoa - RS",
    phone: "5551999003003",
    email: "contato@imobiliariacentral.com.br",
    website: "www.imobiliariacentral.com.br",
    category: "Imobiliária",
    since: "2000",
    rating: 4.5,
    totalRatings: 45,
    projects: 120,
    comments: [
      { author: "Fernanda Lima", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Encontraram o imóvel perfeito para minha família!", date: "2024-03-15" },
    ],
  },
  "porto-seguro-imoveis": {
    name: "Porto Seguro Imóveis",
    logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=400&fit=crop",
    description: "Segurança e confiança em cada negociação. Especialistas em imóveis de praia e investimentos no litoral norte.",
    address: "Rua da Praia, 300",
    city: "Xangri-lá - RS",
    phone: "5551999004004",
    email: "contato@portoseguroimoveis.com.br",
    website: "www.portoseguroimoveis.com.br",
    category: "Imobiliária",
    since: "2010",
    rating: 4.7,
    totalRatings: 22,
    projects: 65,
    comments: [],
  },
  "engenharia-projetos": {
    name: "Engenharia & Projetos",
    logo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=400&fit=crop",
    description: "Soluções completas em engenharia civil e projetos arquitetônicos. Da concepção à entrega, com excelência técnica.",
    address: "Av. Atlântida, 150",
    city: "Capão da Canoa - RS",
    phone: "5551999005005",
    email: "contato@engprojetos.com.br",
    website: "www.engprojetos.com.br",
    category: "Engenharia",
    since: "2005",
    rating: 4.9,
    totalRatings: 18,
    projects: 80,
    comments: [
      { author: "Roberto Alves", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Projeto executado com perfeição. Time muito competente!", date: "2024-03-20" },
    ],
  },
  "financeira-prime": {
    name: "Financeira Prime",
    logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=400&fit=crop",
    description: "Financiamento imobiliário facilitado. As melhores taxas e condições para realizar o sonho da casa própria.",
    address: "Rua Financeira, 700",
    city: "Capão da Canoa - RS",
    phone: "5551999006006",
    email: "contato@financeiraprime.com.br",
    website: "www.financeiraprime.com.br",
    category: "Financeira",
    since: "2012",
    rating: 4.4,
    totalRatings: 35,
    projects: 200,
    comments: [],
  },
  "seguradora-atlas": {
    name: "Seguradora Atlas",
    logo: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=400&fit=crop",
    description: "Seguros residenciais e empresariais com cobertura completa. Proteja seu patrimônio com quem entende do assunto.",
    address: "Av. Segurança, 400",
    city: "Xangri-lá - RS",
    phone: "5551999007007",
    email: "contato@seguradoraatlas.com.br",
    website: "www.seguradoraatlas.com.br",
    category: "Seguradora",
    since: "2007",
    rating: 4.3,
    totalRatings: 20,
    projects: 500,
    comments: [],
  },
  "arquitetura-moderna": {
    name: "Arquitetura Moderna",
    logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=400&fit=crop",
    description: "Escritório de arquitetura premiado. Projetos contemporâneos que unem estética e funcionalidade.",
    address: "Rua do Design, 250",
    city: "Capão da Canoa - RS",
    phone: "5551999008008",
    email: "contato@arquiteturamoderna.com.br",
    website: "www.arquiteturamoderna.com.br",
    category: "Arquitetura",
    since: "2011",
    rating: 4.8,
    totalRatings: 15,
    projects: 90,
    comments: [
      { author: "Luciana Torres", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Transformaram meu sonho em realidade. Projeto lindo!", date: "2024-02-20" },
    ],
  },
  "design-interiores": {
    name: "Design & Interiores",
    logo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=400&fit=crop",
    description: "Especialistas em design de interiores e decoração. Ambientes exclusivos que refletem a personalidade de cada cliente.",
    address: "Rua Elegância, 180",
    city: "Xangri-lá - RS",
    phone: "5551999009009",
    email: "contato@designinteriores.com.br",
    website: "www.designinteriores.com.br",
    category: "Design",
    since: "2014",
    rating: 4.7,
    totalRatings: 25,
    projects: 150,
    comments: [],
  },
  "solar-energia": {
    name: "Solar Energia",
    logo: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=100&fit=crop",
    cover: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=400&fit=crop",
    description: "Energia solar para residências e empresas. Economia e sustentabilidade com as melhores soluções do mercado.",
    address: "Av. Solar, 600",
    city: "Capão da Canoa - RS",
    phone: "5551999010010",
    email: "contato@solarenergia.com.br",
    website: "www.solarenergia.com.br",
    category: "Energia Solar",
    since: "2016",
    rating: 4.6,
    totalRatings: 30,
    projects: 350,
    comments: [
      { author: "Marcos Vieira", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Instalação rápida e economia real na conta de luz!", date: "2024-03-01" },
      { author: "Patrícia Gomes", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face", rating: 4, text: "Boa empresa, preço justo e bom suporte pós-venda.", date: "2024-01-22" },
    ],
  },
};

function toSlug(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function PartnerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const partner = slug ? partnersData[slug] : null;

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [localComments, setLocalComments] = useState<typeof partnersData[string]["comments"]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-lg">Parceiro não encontrado</p>
          <Link to="/site" className="text-amber-600 font-bold hover:underline">← Voltar ao site</Link>
        </div>
      </div>
    );
  }

  const allComments = [...partner.comments, ...localComments];
  const avgRating = allComments.length > 0
    ? (allComments.reduce((s, c) => s + c.rating, 0) / allComments.length).toFixed(1)
    : partner.rating.toFixed(1);

  const handleSubmitReview = () => {
    if (userRating === 0 || !commentText.trim() || !authorName.trim()) return;
    setLocalComments(prev => [...prev, {
      author: authorName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=f59e0b&color=fff`,
      rating: userRating,
      text: commentText,
      date: new Date().toISOString().split("T")[0],
    }]);
    setSubmitted(true);
    setShowRatingModal(false);
    setCommentText("");
    setAuthorName("");
    setUserRating(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/site" className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-lg font-extrabold text-gray-900">MV <span className="text-amber-500">Broker</span></span>
          </Link>
          <button
            onClick={() => setShowRatingModal(true)}
            className="px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <Star className="w-4 h-4" /> Avaliar
          </button>
        </div>
      </header>

      {/* Cover + Info */}
      <section className="relative">
        <div className="h-56 sm:h-72 overflow-hidden">
          <img src={partner.cover} alt={partner.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white flex-shrink-0">
              <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white sm:text-gray-900">{partner.name}</h1>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white uppercase tracking-wide">
                  {partner.category}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Parceiro desde {partner.since}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Star className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{avgRating}</p>
            <p className="text-xs text-gray-500 font-medium">{partner.totalRatings + localComments.length} avaliações</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Building2 className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{partner.projects}</p>
            <p className="text-xs text-gray-500 font-medium">Projetos</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{new Date().getFullYear() - parseInt(partner.since)}</p>
            <p className="text-xs text-gray-500 font-medium">Anos de mercado</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Users className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{allComments.length}</p>
            <p className="text-xs text-gray-500 font-medium">Comentários</p>
          </div>
        </div>

        {/* About + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Sobre</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{partner.description}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Contato</h2>
            <div className="space-y-3">
              <a href={`tel:${partner.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                <Phone className="w-4 h-4 text-amber-500" /> {partner.phone}
              </a>
              <a href={`mailto:${partner.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                <Mail className="w-4 h-4 text-amber-500" /> {partner.email}
              </a>
              <a href={`https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                <Globe className="w-4 h-4 text-amber-500" /> {partner.website}
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-amber-500" /> {partner.address}, {partner.city}
              </div>
            </div>
            <a
              href={`https://wa.me/${partner.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm mt-4"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Star rating summary bar */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Avaliações e Comentários
            </h2>
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Star className="w-4 h-4" /> Avaliar Parceiro
            </button>
          </div>

          {/* Rating overview */}
          <div className="flex items-center gap-6 mb-6 p-4 bg-amber-50 rounded-xl">
            <div className="text-center">
              <p className="text-4xl font-black text-amber-600">{avgRating}</p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-4 h-4", s <= Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{partner.totalRatings + localComments.length} avaliações</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = allComments.filter(c => c.rating === star).length;
                const pct = allComments.length > 0 ? (count / allComments.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-gray-500">{star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {submitted && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" /> Sua avaliação foi enviada com sucesso!
            </div>
          )}

          {/* Comments list */}
          {allComments.length > 0 ? (
            <div className="space-y-4">
              {allComments.map((c, i) => (
                <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <img src={c.avatar} alt={c.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">{c.author}</p>
                      <p className="text-[10px] text-gray-400">{c.date}</p>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-3 h-3", s <= c.rating ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400 text-sm">Nenhum comentário ainda. Seja o primeiro a avaliar!</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">© 2024 MV BROKER CONNECT. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Rating + Comment Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Avaliar {partner.name}</h3>
              <button onClick={() => setShowRatingModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">Como você avalia este parceiro?</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(s)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star className={cn("w-8 h-8 transition-colors", s <= (hoverRating || userRating) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <p className="text-sm font-semibold text-amber-600">
                  Você deu {userRating} estrela{userRating > 1 ? "s" : ""}!
                </p>
              )}
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
              />
              <textarea
                placeholder="Deixe seu comentário sobre este parceiro..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none"
              />
            </div>
            <button
              disabled={userRating === 0 || !commentText.trim() || !authorName.trim()}
              onClick={handleSubmitReview}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2",
                userRating > 0 && commentText.trim() && authorName.trim()
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" /> Enviar Avaliação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
