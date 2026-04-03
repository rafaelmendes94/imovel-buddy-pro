import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
          MV BROKER CONNECT
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Sistema completo de gestão imobiliária
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button asChild size="lg">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/registro">Cadastrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
