import { Link } from "react-router-dom";
import { Building2, Search, Map, Images, Users, Handshake, CreditCard } from "lucide-react";
import sharkFriendlyIcon from "@/assets/shark-friendly.png";

const shortcuts = [
  { label: "Imóveis", icon: Building2, to: "/todos-imoveis" },
  { label: "Buscar", icon: Search, to: "/todos-imoveis?busca=1" },
  { label: "Mapa", icon: Map, to: "/mapas-condominio" },
  { label: "Fotos", icon: Images, to: "/galeria-cidade" },
  { label: "Corretores", icon: Users, to: "/ranking" },
  { label: "Parceiros", icon: Handshake, to: "/parceiros" },
  { label: "Planos", icon: CreditCard, to: "/planos" },
];

export function MobileQuickActions() {
  return (
    <section className="md:hidden px-4 pt-4 pb-1">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Atalhos</h2>
      <div className="grid grid-cols-4 gap-2.5">
        {shortcuts.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-border shadow-sm px-1 py-3.5 active:scale-95 transition-transform"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <s.icon className="w-5 h-5 text-primary" />
            </span>
            <span className="text-[10.5px] font-semibold text-foreground text-center leading-tight">{s.label}</span>
          </Link>
        ))}
        <a
          href="#contato"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-border shadow-sm px-1 py-3.5 active:scale-95 transition-transform"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Phone className="w-5 h-5 text-primary" />
          </span>
          <span className="text-[10.5px] font-semibold text-foreground text-center leading-tight">Contato</span>
        </a>
      </div>
    </section>
  );
}
