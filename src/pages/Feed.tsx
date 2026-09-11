import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import { toSlug } from "@/lib/utils";
import {
  buildWhatsappMessage,
  fetchImovelContact,
  logPropertyEvent,
  openWhatsapp,
  toWhatsappNumber,
  type ImovelContact,
} from "@/lib/propertyEvents";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Share2,
  Info,
  ArrowLeft,
  Loader2,
  X,
  BadgeCheck,
  Building2,
} from "lucide-react";

interface FeedImovel {
  id: string;
  titulo: string;
  tipo: string;
  preco: number;
  quartos: number;
  suites: number | null;
  box: string | null;
  vagas: number;
  area: number;
  cidade: string;
  bairro: string | null;
  empreendimento: string | null;
  condicao: string | null;
  imagens: string[] | null;
  corretor_nome: string | null;
  corretor_id: string | null;
  corretor_cadastro_id: string | null;
  imobiliaria_nome: string | null;
}

interface BrokerProfile {
  nome: string;
  avatar: string | null;
  imobiliaria: string | null;
  creci: string | null;
}

const brl = (v: number) =>
  v > 0
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "Valor a combinar";

const avatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Corretor")}&background=0f4c81&color=fff&size=160`;

function countBoxes(box?: string | null) {
  if (!box) return 0;
  return box.split(",").map((b) => b.trim()).filter(Boolean).length;
}


export default function Feed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedImovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [contactFor, setContactFor] = useState<FeedImovel | null>(null);
  const [contact, setContact] = useState<ImovelContact | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [message, setMessage] = useState("");
  const openedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    document.title = "Feed de Imóveis | MV Broker Connect";
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("imoveis")
        .select(
          "id, titulo, tipo, preco, quartos, suites, box, vagas, area, cidade, bairro, empreendimento, condicao, imagens, corretor_nome"
        )
        .eq("ativo_site", true)
        .eq("status", "Disponível")
        .order("created_at", { ascending: false })
        .limit(60);
      setItems(((data as any[]) || []) as FeedImovel[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("favorites").select("imovel_id").eq("user_id", user.id);
      setFavorites(((data as any[]) || []).map((f) => f.imovel_id));
    })();
  }, [user]);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      toast({ title: "Entre na sua conta para favoritar", variant: "destructive" });
      return;
    }
    const isFav = favorites.includes(id);
    setFavorites((prev) => (isFav ? prev.filter((f) => f !== id) : [...prev, id]));
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("imovel_id", id);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, imovel_id: id });
    }
  };

  const openContact = async (imovel: FeedImovel) => {
    if (!user) {
      toast({ title: "Entre na sua conta para falar com o corretor", variant: "destructive" });
      return;
    }
    setContactFor(imovel);
    setContact(null);
    setContactLoading(true);
    setMessage(
      buildWhatsappMessage({ id: imovel.id, titulo: imovel.titulo, tipo: imovel.tipo, preco: imovel.preco })
    );
    const c = await fetchImovelContact(imovel.id);
    setContact(c);
    setContactLoading(false);
  };

  const sendWhatsapp = async () => {
    if (!contactFor) return;
    const number = toWhatsappNumber(contact?.whatsapp);
    if (!number) {
      toast({
        title: "WhatsApp não cadastrado",
        description: "O corretor responsável ainda não tem WhatsApp no cadastro.",
        variant: "destructive",
      });
      return;
    }
    await logPropertyEvent(contactFor.id, "whatsapp_click", "feed");
    openWhatsapp(number, message);
    setContactFor(null);
  };

  const share = async (imovel: FeedImovel) => {
    const url = `${window.location.origin}/imovel/${imovel.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: imovel.titulo, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copiado" });
      }
      logPropertyEvent(imovel.id, "share", "feed");
    } catch {
      /* cancelado pelo usuário */
    }
  };

  const openDetails = (imovel: FeedImovel) => {
    logPropertyEvent(imovel.id, "detail_open", "feed");
    navigate(`/imovel/${imovel.id}`);
  };

  const registerOpen = (id: string) => {
    if (openedRef.current.has(id)) return;
    openedRef.current.add(id);
    logPropertyEvent(id, "detail_open", "feed");
  };

  const cards = useMemo(() => items, [items]);

  return (
    <div className="fixed inset-0 bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-black/70 to-transparent">
        <Link to="/" className="p-2 -ml-2 rounded-full active:opacity-60" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-semibold tracking-wide">FEED DE IMÓVEIS</h1>
      </header>

      {loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/70" />
        </div>
      ) : cards.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
          <p className="text-white/80 text-sm">Nenhum imóvel publicado no feed ainda.</p>
        </div>
      ) : (
        <div className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar">
          {cards.map((imovel) => {
            const img = imovel.imagens?.[0] || PLACEHOLDER_IMAGE;
            const isFav = favorites.includes(imovel.id);
            const boxes = countBoxes(imovel.box);
            const specs = [
              imovel.quartos > 0 ? `${imovel.quartos} dorm.` : null,
              imovel.suites && imovel.suites > 0 ? `${imovel.suites} suíte${imovel.suites > 1 ? "s" : ""}` : null,
              boxes > 0 ? `${boxes} box${boxes > 1 ? "es" : ""}` : imovel.vagas > 0 ? `${imovel.vagas} vaga${imovel.vagas > 1 ? "s" : ""}` : null,
              imovel.area > 0 ? `${imovel.area} m²` : null,
            ].filter(Boolean);

            return (
              <section
                key={imovel.id}
                className="relative h-full w-full snap-start snap-always overflow-hidden"
                onPointerEnter={() => registerOpen(imovel.id)}
              >
                <div className="absolute inset-0 mx-auto max-w-lg md:max-w-xl">
                  <img
                    src={img}
                    alt={imovel.titulo}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onClick={() => openDetails(imovel)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />

                  {/* Barra vertical de ações */}
                  <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
                    <button
                      onClick={() => toggleFavorite(imovel.id)}
                      aria-label="Favoritar"
                      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    >
                      <Heart className={`w-7 h-7 drop-shadow ${isFav ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                      <span className="text-[10px] font-semibold">Favorito</span>
                    </button>
                    <button
                      onClick={() => openContact(imovel)}
                      aria-label="Falar com o corretor no WhatsApp"
                      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    >
                      <span className="w-11 h-11 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </span>
                      <span className="text-[10px] font-semibold">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => share(imovel)}
                      aria-label="Compartilhar"
                      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    >
                      <Share2 className="w-6 h-6 drop-shadow" />
                      <span className="text-[10px] font-semibold">Enviar</span>
                    </button>
                    <button
                      onClick={() => openDetails(imovel)}
                      aria-label="Ver detalhes"
                      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    >
                      <Info className="w-6 h-6 drop-shadow" />
                      <span className="text-[10px] font-semibold">Detalhes</span>
                    </button>
                  </div>

                  {/* Informações */}
                  <div className="absolute left-4 right-20 bottom-8 space-y-1.5">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-white/80 uppercase">
                      {imovel.tipo}
                    </p>
                    <h2 className="text-lg font-bold leading-tight line-clamp-2" onClick={() => openDetails(imovel)}>
                      {imovel.titulo}
                    </h2>
                    {imovel.empreendimento && (
                      <p className="text-xs text-white/75 flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> {imovel.empreendimento}
                      </p>
                    )}
                    {specs.length > 0 && (
                      <p className="text-sm text-white/90">{specs.join(" • ")}</p>
                    )}
                    <p className="text-2xl font-extrabold">{brl(imovel.preco)}</p>
                    {imovel.condicao && <p className="text-xs text-white/70">{imovel.condicao}</p>}
                    <p className="text-[11px] text-white/60">
                      {[imovel.bairro, imovel.cidade].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal WhatsApp */}
      {contactFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card text-foreground rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">Falar com o corretor responsável</h3>
                {contactLoading ? (
                  <p className="text-xs text-muted-foreground">Buscando contato...</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {contact?.nome || "Corretor responsável"}
                    {contact?.creci ? ` · CRECI ${contact.creci}` : ""}
                    {contact?.imobiliaria ? ` · ${contact.imobiliaria}` : ""}
                  </p>
                )}
              </div>
              <button onClick={() => setContactFor(null)} aria-label="Fechar" className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full text-sm rounded-xl border border-border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              onClick={sendWhatsapp}
              disabled={contactLoading}
              className="w-full h-12 rounded-xl bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <MessageCircle className="w-5 h-5" /> Abrir WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
