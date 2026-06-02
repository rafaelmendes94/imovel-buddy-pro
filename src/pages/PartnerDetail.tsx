import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, Star, Phone, MapPin, Globe, Mail,
  MessageSquare, Send, ThumbsUp, Clock, Users, X, Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";
import { supabase } from "@/integrations/supabase/client";

interface PartnerData {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  cover_url: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  since_year: string;
  rating: number;
  total_ratings: number;
  projects: number;
}

export default function PartnerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [dbComments, setDbComments] = useState<{ id: string; author: string; avatar: string; rating: number; text: string; date: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadRatings = async (partnerId: string) => {
    const { data } = await supabase
      .from("partner_ratings")
      .select("id, rater_name, rating, comment, created_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    setDbComments(((data as any[]) || []).map(r => ({
      id: r.id,
      author: r.rater_name || "Anônimo",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.rater_name || "A")}&background=f59e0b&color=fff`,
      rating: r.rating,
      text: r.comment || "",
      date: new Date(r.created_at).toLocaleDateString("pt-BR"),
    })));
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      setPartner(data as any);
      if (data) await loadRatings((data as any).id);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>;
  }

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

  const allComments = dbComments;
  const avgRating = allComments.length > 0
    ? (allComments.reduce((s, c) => s + c.rating, 0) / allComments.length).toFixed(1)
    : (partner.rating || 0).toFixed(1);

  const yearsInMarket = partner.since_year ? new Date().getFullYear() - parseInt(partner.since_year) : 0;

  const handleSubmitReview = async () => {
    if (userRating === 0 || !commentText.trim()) return;
    if (!currentUserId) {
      alert("Você precisa estar logado para avaliar.");
      return;
    }
    const name = authorName.trim() || "Anônimo";
    const { error } = await supabase.from("partner_ratings").insert({
      partner_id: partner.id,
      rater_id: currentUserId,
      rater_name: name,
      rating: userRating,
      comment: commentText.trim(),
    });
    if (error) { alert("Erro ao enviar avaliação: " + error.message); return; }
    await loadRatings(partner.id);
    setSubmitted(true);
    setShowRatingModal(false);
    setCommentText("");
    setAuthorName("");
    setUserRating(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-lg font-extrabold text-gray-900">MV <span className="text-amber-500">Broker</span></span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(true)} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Configurações da página">
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setShowRatingModal(true)} className="px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2">
              <Star className="w-4 h-4" /> Avaliar
            </button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="h-56 sm:h-72 overflow-hidden">
          <img src={partner.cover_url || partner.logo_url || "/placeholder.svg"} alt={partner.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white flex-shrink-0">
              <img src={partner.logo_url || "/placeholder.svg"} alt={partner.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white sm:text-gray-900">{partner.name}</h1>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white uppercase tracking-wide">
                  {partner.category}
                </span>
              </div>
              {partner.since_year && <p className="text-sm text-gray-500 mt-1">Parceiro desde {partner.since_year}</p>}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Star className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{avgRating}</p>
            <p className="text-xs text-gray-500 font-medium">{partner.total_ratings + allComments.length} avaliações</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Building2 className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{partner.projects}</p>
            <p className="text-xs text-gray-500 font-medium">Projetos</p>
          </div>
          {yearsInMarket > 0 && (
            <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
              <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">{yearsInMarket}</p>
              <p className="text-xs text-gray-500 font-medium">Anos de mercado</p>
            </div>
          )}
          <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
            <Users className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{allComments.length}</p>
            <p className="text-xs text-gray-500 font-medium">Comentários</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Sobre</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{partner.description}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Contato</h2>
            <div className="space-y-3">
              {partner.phone && <a href={`tel:${partner.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors"><Phone className="w-4 h-4 text-amber-500" /> {partner.phone}</a>}
              {partner.email && <a href={`mailto:${partner.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors"><Mail className="w-4 h-4 text-amber-500" /> {partner.email}</a>}
              {partner.website && <a href={`https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors"><Globe className="w-4 h-4 text-amber-500" /> {partner.website}</a>}
              {(partner.address || partner.city) && <div className="flex items-center gap-3 text-sm text-gray-600"><MapPin className="w-4 h-4 text-amber-500" /> {[partner.address, partner.city].filter(Boolean).join(", ")}</div>}
            </div>
            {partner.phone && (
              <a href={`https://wa.me/${partner.phone}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm mt-4">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Avaliações e Comentários
            </h2>
            <button onClick={() => setShowRatingModal(true)} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors flex items-center gap-2">
              <Star className="w-4 h-4" /> Avaliar Parceiro
            </button>
          </div>

          <div className="flex items-center gap-6 mb-6 p-4 bg-amber-50 rounded-xl">
            <div className="text-center">
              <p className="text-4xl font-black text-amber-600">{avgRating}</p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-4 h-4", s <= Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{partner.total_ratings + allComments.length} avaliações</p>
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

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">© 2024 MV BROKER CONNECT. Todos os direitos reservados.</p>
        </div>
      </footer>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Avaliar {partner.name}</h3>
              <button onClick={() => setShowRatingModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">Como você avalia este parceiro?</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setUserRating(s)} className="p-1 transition-transform hover:scale-125">
                    <Star className={cn("w-8 h-8 transition-colors", s <= (hoverRating || userRating) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                  </button>
                ))}
              </div>
              {userRating > 0 && <p className="text-sm font-semibold text-amber-600">Você deu {userRating} estrela{userRating > 1 ? "s" : ""}!</p>}
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Seu nome (opcional)" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
              <textarea placeholder="Deixe seu comentário sobre este parceiro..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none" />
            </div>
            <button disabled={userRating === 0 || !commentText.trim()} onClick={handleSubmitReview}
              className={cn("w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2",
                userRating > 0 && commentText.trim() ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}>
              <Send className="w-4 h-4" /> Enviar Avaliação
            </button>
          </div>
        </div>
      )}
      <SiteConfigDialog open={showConfig} onOpenChange={setShowConfig} configType="partner_page" ownerId={slug} showProfilePhoto title="Configuração da Página do Parceiro" />
    </div>
  );
}
