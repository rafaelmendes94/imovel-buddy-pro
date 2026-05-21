import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy, Award, Medal, Star, ArrowLeft, Home, DollarSign,
  TrendingUp, Users, ChevronRight, Crown, Flame, Zap, Loader2, X, MapPin, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

interface BrokerRank {
  name: string;
  photo: string | null;
  count: number;
  value: number;
  userId: string;
}

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

const symbols = ["$", "R$", "%", "↗", "◆", "⬡"];

function FloatingSymbol({ delay, x }: { delay: number; x: number }) {
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const size = 10 + Math.random() * 16;
  const startY = Math.random() * 100;

  return (
    <motion.div
      className="absolute font-mono font-bold select-none pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${startY}%`,
        fontSize: size,
        color: ["#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#14b8a6"][Math.floor(Math.random() * 5)],
        opacity: 0,
      }}
      animate={{
        y: [0, -60, -120],
        opacity: [0, 0.25, 0],
        scale: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 5,
        ease: "easeInOut",
      }}
    >
      {symbol}
    </motion.div>
  );
}

function ConnectionLine({ delay }: { delay: number }) {
  const x1 = 10 + Math.random() * 80;
  const y1 = 10 + Math.random() * 80;
  const x2 = 10 + Math.random() * 80;
  const y2 = 10 + Math.random() * 80;

  return (
    <motion.svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.08, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, repeatDelay: Math.random() * 4 }}
    >
      <line
        x1={`${x1}%`} y1={`${y1}%`}
        x2={`${x2}%`} y2={`${y2}%`}
        stroke="#f59e0b"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      <circle cx={`${x1}%`} cy={`${y1}%`} r="2" fill="#f59e0b" opacity="0.4" />
      <circle cx={`${x2}%`} cy={`${y2}%`} r="2" fill="#10b981" opacity="0.4" />
    </motion.svg>
  );
}

interface SaleRow {
  id: string;
  titulo: string;
  tipo: string;
  cidade: string;
  bairro: string;
  preco: number;
  data_venda: string | null;
  updated_at: string;
  created_at: string;
  imagens: string[] | null;
  brokerId: string;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<BrokerRank[]>([]);
  const [totalVGV, setTotalVGV] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allSales, setAllSales] = useState<SaleRow[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<BrokerRank | null>(null);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    const { data: soldProperties } = await supabase
      .from("imoveis")
      .select("id, titulo, tipo, cidade, bairro, preco, data_venda, created_at, updated_at, imagens, corretor_nome, corretor_id, user_id")
      .eq("status", "Vendido");

    if (!soldProperties || soldProperties.length === 0) {
      setLoading(false);
      return;
    }

    const userIds = new Set<string>();
    soldProperties.forEach(p => {
      const id = p.corretor_id || p.user_id;
      userIds.add(id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", Array.from(userIds));

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    (profiles || []).forEach(p => {
      profileMap[p.user_id] = { name: p.full_name, avatar: p.avatar_url };
    });

    const salesMap: Record<string, { count: number; value: number; name: string; photo: string | null; userId: string }> = {};
    const salesRows: SaleRow[] = [];

    soldProperties.forEach(p => {
      const brokerId = p.corretor_id || p.user_id;
      const brokerName = p.corretor_nome || profileMap[brokerId]?.name || "Corretor";
      const brokerPhoto = profileMap[brokerId]?.avatar || null;

      if (!salesMap[brokerId]) {
        salesMap[brokerId] = { count: 0, value: 0, name: brokerName, photo: brokerPhoto, userId: brokerId };
      }
      salesMap[brokerId].count++;
      salesMap[brokerId].value += Number(p.preco) || 0;

      salesRows.push({
        id: p.id,
        titulo: p.titulo || "Imóvel",
        tipo: p.tipo || "",
        cidade: p.cidade || "",
        bairro: p.bairro || "",
        preco: Number(p.preco) || 0,
        data_venda: p.data_venda,
        created_at: p.created_at,
        imagens: p.imagens,
        brokerId,
      });
    });

    const sorted = Object.values(salesMap).sort((a, b) => b.value - a.value);

    setRanking(sorted);
    setAllSales(salesRows);
    setTotalVGV(soldProperties.reduce((s, p) => s + (Number(p.preco) || 0), 0));
    setTotalSold(soldProperties.length);
    setLoading(false);
  };

  const brokerSales = selectedBroker
    ? allSales
        .filter(s => s.brokerId === selectedBroker.userId)
        .sort((a, b) => new Date(b.data_venda || b.created_at).getTime() - new Date(a.data_venda || a.created_at).getTime())
    : [];



  const medalColors = [
    "from-amber-400 via-yellow-300 to-amber-500",
    "from-gray-300 via-gray-200 to-gray-400",
    "from-orange-500 via-orange-400 to-orange-600",
  ];
  const medalBorders = ["border-amber-400", "border-gray-300", "border-orange-400"];
  const medalGlows = ["shadow-amber-400/50", "shadow-gray-300/50", "shadow-orange-400/50"];
  const medalIcons = [Crown, Award, Medal];
  const positionLabels = ["1º Lugar", "2º Lugar", "3º Lugar"];

  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans overflow-hidden">
      {/* Floating symbols & connection lines */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingSymbol key={`s-${i}`} delay={i * 0.5} x={Math.random() * 100} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <ConnectionLine key={`c-${i}`} delay={i * 1.2} />
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
            Os melhores profissionais da MV BROKER CONNECT
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
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatCurrency(totalVGV)}
                </p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">VGV Total Vendido</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <p className="text-2xl sm:text-3xl font-black text-blue-400">
                  <AnimatedCounter target={totalSold} duration={1500} />
                </p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Vendas Realizadas</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-purple-400" />
                <p className="text-2xl sm:text-3xl font-black text-purple-400">
                  <AnimatedCounter target={ranking.length} duration={1000} />
                </p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Corretores</p>
            </div>
          </motion.div>
        </div>
      </section>

      {ranking.length === 0 ? (
        <section className="max-w-5xl mx-auto px-4 pb-16 text-center">
          <p className="text-gray-500 text-lg">Nenhuma venda registrada ainda.</p>
        </section>
      ) : (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Podium - Top 3 */}
          <div className="flex items-end justify-center gap-4 sm:gap-6 mb-16">
            {/* 2nd place */}
            {ranking[1] && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 150 }}
                onClick={() => setSelectedBroker(ranking[1])}
                className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="group">
                  <div className="relative mb-3">
                    <div className={cn("w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-xl group-hover:scale-110 transition-transform", medalBorders[1], medalGlows[1])}>
                      <img src={ranking[1].photo || defaultAvatar} alt={ranking[1].name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white text-center">{ranking[1].name}</p>
                </div>
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
                onClick={() => setSelectedBroker(ranking[0])}
                className="flex flex-col items-center -mt-8 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="group">
                  <div className="relative mb-3">
                    <motion.div
                      animate={{ boxShadow: ["0 0 20px rgba(245,158,11,0.3)", "0 0 40px rgba(245,158,11,0.6)", "0 0 20px rgba(245,158,11,0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn("w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 group-hover:scale-110 transition-transform", medalBorders[0])}
                    >
                      <img src={ranking[0].photo || defaultAvatar} alt={ranking[0].name} className="w-full h-full object-cover" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="absolute -top-4 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40"
                    >
                      <Crown className="w-5 h-5 text-gray-900" />
                    </motion.div>
                  </div>
                  <p className="text-base font-extrabold text-amber-400 text-center">{ranking[0].name}</p>
                </div>
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
                onClick={() => setSelectedBroker(ranking[2])}
                className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="group">
                  <div className="relative mb-3">
                    <div className={cn("w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-xl group-hover:scale-110 transition-transform", medalBorders[2], medalGlows[2])}>
                      <img src={ranking[2].photo || defaultAvatar} alt={ranking[2].name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <Medal className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white text-center">{ranking[2].name}</p>
                </div>
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
                    key={broker.userId}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8 + i * 0.15 }}
                  >
                    <div
                      onClick={() => setSelectedBroker(broker)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl transition-all group cursor-pointer hover:scale-[1.02]",
                        i === 0 ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30" :
                        i === 1 ? "bg-gradient-to-r from-gray-500/10 to-gray-500/5 border border-gray-500/20" :
                        i === 2 ? "bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20" :
                        "bg-gray-900/50 border border-gray-800 hover:border-amber-500/30"
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
                          src={broker.photo || defaultAvatar}
                          alt={broker.name}
                          className={cn(
                            "w-14 h-14 rounded-full object-cover border-2",
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
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {/* Broker sales dialog */}
      <Dialog open={!!selectedBroker} onOpenChange={(o) => !o && setSelectedBroker(null)}>
        <DialogContent className="max-w-3xl bg-gray-950 border-gray-800 text-white max-h-[85vh] overflow-y-auto">
          {selectedBroker && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedBroker.photo || defaultAvatar}
                    alt={selectedBroker.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
                  />
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-extrabold text-white">{selectedBroker.name}</DialogTitle>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-400">
                        <span className="font-bold text-white">{selectedBroker.count}</span> vendas
                      </span>
                      <span className="text-sm font-extrabold text-emerald-400">{formatCurrency(selectedBroker.value)}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">Vendas Contabilizadas</h3>
                </div>
                {brokerSales.map((s, idx) => {
                  const cover = s.imagens && s.imagens.length > 0 ? s.imagens[0] : null;
                  const dateStr = s.data_venda || s.created_at;
                  const dateFmt = dateStr ? new Date(dateStr).toLocaleDateString("pt-BR") : "—";
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/70 border border-gray-800 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      {cover ? (
                        <img src={cover} alt={s.titulo} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{s.titulo}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          {s.tipo && <span className="px-2 py-0.5 rounded-full bg-gray-800">{s.tipo}</span>}
                          {(s.bairro || s.cidade) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[s.bairro, s.cidade].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateFmt}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-extrabold text-emerald-400">{formatCurrency(s.preco)}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Vendido</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800 py-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© 2026 MV BROKER CONNECT. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
