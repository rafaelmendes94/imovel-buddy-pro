import { AppLayout } from "@/components/AppLayout";
import { brokers, formatCurrency } from "@/data/mockData";
import { Plus, Mail, Phone, Award, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Brokers() {
  const [search, setSearch] = useState("");

  const filtered = brokers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Corretores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {brokers.length} corretores cadastrados
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" />
            Novo Corretor
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar corretor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filtered.map((broker) => (
            <div key={broker.id} className="elevated-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-primary">
                  {broker.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground text-sm truncate">
                    {broker.name}
                  </h3>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded",
                      broker.status === "Ativo"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {broker.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{broker.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{broker.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>CRECI: {broker.creci}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Vendas
                  </p>
                  <p className="text-lg font-bold text-card-foreground">
                    {broker.sales}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Receita
                  </p>
                  <p className="text-sm font-bold text-accent">
                    {formatCurrency(broker.revenue)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
