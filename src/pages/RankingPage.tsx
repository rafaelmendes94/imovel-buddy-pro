import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { properties, formatCurrency } from "@/data/mockData";
import {
  Trophy, Award, Medal, Star, ArrowLeft, Home, DollarSign,
  TrendingUp, Users, ChevronRight, Crown, Flame, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const brokerFullInfo: Record<string, { photo: string; creci: string; whatsapp: string; bio: string; totalSold: number; totalSoldValue: number; avgDaysToSell: number; rating: number }> = {
  "Carlos Silva": {
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    creci: "123456-RS",
    whatsapp: "5511999990001",
    bio: "Especialista em imóveis de alto padrão no litoral norte gaúcho.",
    totalSold: 24,
    totalSoldValue: 8500000,
    avgDaysToSell: 45,
    rating: 4.7,
  },
  "Ana Rodrigues": {
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    creci: "234567-RS",
    whatsapp: "5511999990002",
    bio: "Corretora dedicada com foco em lotes e terrenos.",
    totalSold: 18,
    totalSoldValue: 6200000,
    avgDaysToSell: 38,
    rating: 4.9,
  },
  "Marcos Oliveira": {
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    creci: "345678-RS",
    whatsapp: "5511999990003",
    bio: "Consultor imobiliário com amplo conhecimento do mercado.",
    totalSold: 31,
    totalSoldValue: 12100000,
    avgDaysToSell: 32,
    rating: 4.5,
  },
};

// Extended site properties (same as Site.tsx)
const siteProperties = [
  ...properties,
  { id: "sold-1", title: "Cobertura Vista Mar", broker: "Ana Rodrigues", status: "Vendido" as const, price: 1650000, type: "Apartamento" as const, area: 200, bedrooms: 3, bathrooms: 3, parking: 2, address: "", city: "Capão da Canoa", image: "", images: [] as string[], createdAt: "", lat: 0, lng: 0 },
  { id: "sold-2", title: "Casa Condomínio", broker: "Carlos Silva", status: "Vendido" as const, price: 980000, type: "Casa" as const, area: 220, bedrooms: 3, bathrooms: 2, parking: 2, address: "", city: "Xangri-lá", image: "", images: [] as string[], createdAt: "", lat: 0, lng: 0 },
  { id: "sold-3", title: "Apartamento Atlântida", broker: "Marcos Oliveira", status: "Vendido" as const, price: 720000, type: "Apartamento" as const, area: 85, bedrooms: 2, bathrooms: 1, parking: 1, address: "", city: "Xangri-lá", image: "", images: [] as string[], createdAt: "", lat: 0, lng: 0 },
  { id: "sold-4", title: "Lote Bosque", broker: "Ana Rodrigues", status: "Vendido" as const, price: 350000, type: "Terreno" as const, area: 480, bedrooms: 0, bathrooms: 0, parking: 0, address: "", city: "Xangri-lá", image: "", images: [] as string[], createdAt: "", lat: 0, lng: 0 },
  { id: "sold-5", title: "Sobrado Litoral", broker: "Carlos Silva", status: "Vendido" as const, price: 890000, type: "Casa" as const, area: 200, bedrooms: 3, bathrooms: 2, parking: 2, address: "", city: "Capão da Canoa", image: "", images: [] as string[], createdAt: "", lat: 0, lng: 0 },
];

function AnimatedCounter({ target, duration = 2000, prefix = "" }: { target: number; duration?: number; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return <span>{prefix}{count.toLocaleString("pt-BR")}</span>;
}

function Particle({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{
        left: `${x}%`,
        top: "-10px",
        background: ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6"][Math.floor(Math.random() * 5)],
      }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{
        y: [0, 400, 800],
        opacity: [1, 0.8, 0],
        scale: [1, 0.8, 0.3],
        x: [0, (Math.random() - 0.5) * 100],
        rotate: [0, 360, 720],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
      }}
    />
  );
}

export default function RankingPage() {
  const soldAll = siteProperties.filter((p) => p.status === "Vendido");
  const totalVGV = soldAll.reduce((s, p) => s + p.price, 0);
  const totalSold = soldAll.length;

  // Build ranking
  const brokerSales: Record<string, { count: number; value: number }> = {};
  soldAll.forEach((p) => {
    if (!brokerSales[p.broker]) brokerSales[p.broker] = { count: 0, value: 0 };
    brokerSales[p.broker].count++;
    brokerSales[p.broker].value += p.price;
  });

  const ranking = Object.entries(brokerSales)
    .map(([name, data]) => ({
      name,
      ...data,
      info: brokerFullInfo[name],
    }))
    .sort((a, b) => b.value - a.value);

  const medalColors = [
    "from-amber-400 via-yellow-300 to-amber-500",
    "from-gray-300 via-gray-200 to-gray-400",
    "from-orange-500 via-orange-400 to-orange-600",
  ];
  const medalBorders = ["border-amber-400", "border-gray-300", "border-orange-400"];
  const medalGlows = ["shadow-amber-400/50", "shadow-gray-300/50", "shadow-orange-400/50"];
  const medalIcons = [Crown, Award, Medal];
  const positionLabels = ["1º Lugar", "2º Lugar", "3º Lugar"];

  return (
    <div className="min-h-screen bg-gray-950 font-sans overflow-hidden">
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <Particle key={i} delay={i * 0.3} x={Math.random() * 100} />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/site" className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">MV <span className="text-amber-400">Broker</span></span>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Ranking Oficial</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30"
          >
            <Trophy className="w-12 h-12 text-gray-900" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl font-black text-white mb-3"
          >
            Ranking de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Corretores</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-gray-400 text-lg mb-10"
          >
            Os melhores profissionais da MV Connect
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-6 sm:gap-10"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <p className="text-3xl sm:text-4xl font-black text-emerald-400">
                  R$ <AnimatedCounter target={totalVGV / 1000} prefix="" duration={2500} />.000
                </p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">VGV Total Vendido</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <p className="text-3xl sm:text-4xl font-black text-blue-400">
                  <AnimatedCounter target={totalSold} duration={1500} />
                </p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Vendas Realizadas</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-purple-400" />
                <p className="text-3xl sm:text-4xl font-black text-purple-400">
                  <AnimatedCounter target={ranking.length} duration={1000} />
                </p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Corretores</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Podium - Top 3 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-center gap-4 sm:gap-6 mb-16">
          {/* 2nd place */}
          {ranking[1] && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 150 }}
              className="flex flex-col items-center"
            >
              <Link to={`/corretor/${ranking[1].name.toLowerCase().replace(/\s+/g, "-")}`} className="group">
                <div className="relative mb-3">
                  <div className={cn("w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-xl group-hover:scale-110 transition-transform", medalBorders[1], medalGlows[1])}>
                    <img src={ranking[1].info?.photo || ""} alt={ranking[1].name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-sm font-bold text-white text-center group-hover:text-gray-300 transition-colors">{ranking[1].name}</p>
              </Link>
              <div className="mt-3 w-28 sm:w-36 bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-xl pt-6 pb-4 text-center shadow-xl border border-gray-500/30">
                <p className="text-2xl font-black text-white">2º</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">{ranking[1].count} vendas</p>
                <p className="text-sm font-extrabold text-emerald-400 mt-1">{formatCurrency(ranking[1].value)}</p>
              </div>
            </motion.div>
          )}

          {/* 1st place */}
          {ranking[0] && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, type: "spring", stiffness: 150 }}
              className="flex flex-col items-center -mt-8"
            >
              <Link to={`/corretor/${ranking[0].name.toLowerCase().replace(/\s+/g, "-")}`} className="group">
                <div className="relative mb-3">
                  <motion.div
                    animate={{ boxShadow: ["0 0 20px rgba(245,158,11,0.3)", "0 0 40px rgba(245,158,11,0.6)", "0 0 20px rgba(245,158,11,0.3)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn("w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 group-hover:scale-110 transition-transform", medalBorders[0])}
                  >
                    <img src={ranking[0].info?.photo || ""} alt={ranking[0].name} className="w-full h-full object-cover" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="absolute -top-4 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40"
                  >
                    <Crown className="w-5 h-5 text-gray-900" />
                  </motion.div>
                </div>
                <p className="text-base font-extrabold text-amber-400 text-center group-hover:text-amber-300 transition-colors">{ranking[0].name}</p>
              </Link>
              <div className="mt-3 w-32 sm:w-40 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-xl pt-8 pb-5 text-center shadow-2xl shadow-amber-500/20 border border-amber-400/30">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="w-6 h-6 text-white mx-auto mb-1" />
                </motion.div>
                <p className="text-3xl font-black text-white">1º</p>
                <p className="text-[10px] text-amber-100 uppercase tracking-wider font-bold mt-1">{ranking[0].count} vendas</p>
                <p className="text-base font-extrabold text-white mt-1">{formatCurrency(ranking[0].value)}</p>
              </div>
            </motion.div>
          )}

          {/* 3rd place */}
          {ranking[2] && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, type: "spring", stiffness: 150 }}
              className="flex flex-col items-center"
            >
              <Link to={`/corretor/${ranking[2].name.toLowerCase().replace(/\s+/g, "-")}`} className="group">
                <div className="relative mb-3">
                  <div className={cn("w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-xl group-hover:scale-110 transition-transform", medalBorders[2], medalGlows[2])}>
                    <img src={ranking[2].info?.photo || ""} alt={ranking[2].name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Medal className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-sm font-bold text-white text-center group-hover:text-orange-300 transition-colors">{ranking[2].name}</p>
              </Link>
              <div className="mt-3 w-28 sm:w-36 bg-gradient-to-t from-orange-700 to-orange-600 rounded-t-xl pt-4 pb-3 text-center shadow-xl border border-orange-500/30">
                <p className="text-2xl font-black text-white">3º</p>
                <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold mt-1">{ranking[2].count} vendas</p>
                <p className="text-sm font-extrabold text-white mt-1">{formatCurrency(ranking[2].value)}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Full ranking list */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">Ranking Completo</h2>
          </div>

          <div className="space-y-3">
            {ranking.map((broker, i) => {
              const MIcon = i < 3 ? medalIcons[i] : Star;
              return (
                <motion.div
                  key={broker.name}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8 + i * 0.15 }}
                >
                  <Link
                    to={`/corretor/${broker.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl transition-all group",
                      i === 0 ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30 hover:border-amber-400/60" :
                      i === 1 ? "bg-gradient-to-r from-gray-500/10 to-gray-500/5 border border-gray-500/20 hover:border-gray-400/40" :
                      i === 2 ? "bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-400/40" :
                      "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
                    )}
                  >
                    {/* Position */}
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                      i < 3 ? `bg-gradient-to-br ${medalColors[i]}` : "bg-gray-800"
                    )}>
                      {i < 3 ? (
                        <MIcon className={cn("w-7 h-7", i < 3 ? "text-gray-900" : "text-gray-400")} />
                      ) : (
                        <span className="text-xl font-black text-gray-400">{i + 1}º</span>
                      )}
                    </div>

                    {/* Photo */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={broker.info?.photo || ""}
                        alt={broker.name}
                        className={cn(
                          "w-14 h-14 rounded-full object-cover border-2 group-hover:scale-110 transition-transform",
                          i < 3 ? medalBorders[i] : "border-gray-700"
                        )}
                      />
                      {i === 0 && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"
                        >
                          <Flame className="w-3 h-3 text-gray-900" />
                        </motion.div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-base font-bold",
                          i === 0 ? "text-amber-400" : "text-white"
                        )}>
                          {broker.name}
                        </p>
                        {i < 3 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                            {positionLabels[i]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        CRECI {broker.info?.creci} · ⭐ {broker.info?.rating} · Média {broker.info?.avgDaysToSell} dias
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xl font-extrabold text-white">{broker.count}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Vendas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-extrabold text-emerald-400">{formatCurrency(broker.value)}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">VGV</p>
                      </div>
                    </div>

                    {/* Mobile stats */}
                    <div className="sm:hidden text-right flex-shrink-0">
                      <p className="text-base font-extrabold text-emerald-400">{formatCurrency(broker.value)}</p>
                      <p className="text-[10px] text-gray-500">{broker.count} vendas</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800 py-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© 2024 MV Connect. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
