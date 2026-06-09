import { BrokerLayout } from "@/components/BrokerLayout";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { toSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, ExternalLink, Rss } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const FN_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/property-feed`;

export default function BrokerXmlFeeds() {
  const { profile, user } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const slug = profile?.full_name ? toSlug(profile.full_name) : "";

  const vrsyncUrl = slug ? `${FN_BASE}?slug=${slug}&format=vrsync` : "";
  const imovelwebUrl = slug ? `${FN_BASE}?slug=${slug}&format=imovelweb` : "";

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { count } = await supabase
        .from("imoveis")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("ativo_site", true)
        .eq("publicar_xml", true)
        .neq("status", "Vendido");
      setCount(count ?? 0);
    })();
  }, [user?.id]);

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <BrokerLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rss className="w-6 h-6 text-primary" />
            Feeds XML para Portais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cole estes links no painel dos portais. Eles atualizam seus anúncios automaticamente.
          </p>
        </div>

        {!slug && (
          <Card className="p-4 border-destructive/50">
            Complete seu nome completo no perfil para gerar os links.
          </Card>
        )}

        <Card className="p-4 bg-muted/50">
          <div className="text-sm">
            <span className="font-semibold">{count ?? "..."}</span> imóveis serão enviados nos feeds (ativos no site + portais ligados, status diferente de Vendido).
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">VRSync (ZAP + Viva Real + OLX)</h2>
              <p className="text-xs text-muted-foreground">Padrão do Grupo OLX. Use no ZAP Imóveis, Viva Real e OLX.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={vrsyncUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copy(vrsyncUrl)} disabled={!slug}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" asChild disabled={!slug}>
              <a href={vrsyncUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
            </Button>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold">Imovelweb / ImóvelGuide</h2>
            <p className="text-xs text-muted-foreground">Padrão usado pelo Imovelweb e ImóvelGuide.</p>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={imovelwebUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copy(imovelwebUrl)} disabled={!slug}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" asChild disabled={!slug}>
              <a href={imovelwebUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Como configurar em cada portal</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="zap">
              <AccordionTrigger>ZAP Imóveis</AccordionTrigger>
              <AccordionContent className="text-sm space-y-1 text-muted-foreground">
                <p>1. Acesse o ZAP Gestor → <b>Integração / Importação XML</b>.</p>
                <p>2. Cole o link <b>VRSync</b> acima.</p>
                <p>3. Defina frequência de atualização (recomendado: a cada 4h).</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="vivareal">
              <AccordionTrigger>Viva Real</AccordionTrigger>
              <AccordionContent className="text-sm space-y-1 text-muted-foreground">
                <p>1. No painel Viva Real → <b>Configurações → Integração XML</b>.</p>
                <p>2. Cole o link <b>VRSync</b> acima.</p>
                <p>3. Aguarde a primeira importação (até 24h).</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="olx">
              <AccordionTrigger>OLX Imóveis</AccordionTrigger>
              <AccordionContent className="text-sm space-y-1 text-muted-foreground">
                <p>1. Painel OLX Pro → <b>Integração XML</b>.</p>
                <p>2. Cole o link <b>VRSync</b> acima.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="iw">
              <AccordionTrigger>Imovelweb / ImóvelGuide</AccordionTrigger>
              <AccordionContent className="text-sm space-y-1 text-muted-foreground">
                <p>1. Painel do anunciante → <b>Importação XML</b>.</p>
                <p>2. Cole o link <b>Imovelweb</b> acima.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card className="p-4 text-xs text-muted-foreground">
          Para controlar individualmente qual imóvel vai para os portais, abra o cadastro do imóvel e use o switch <b>📡 Portais (XML)</b>.
        </Card>
      </div>
    </BrokerLayout>
  );
}
