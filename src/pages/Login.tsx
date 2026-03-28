import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Home, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check roles to redirect
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const roles = rolesData?.map(r => r.role) || [];

    if (roles.includes("super_admin") || roles.includes("admin_staff")) {
      navigate("/admin/dashboard");
    } else {
      navigate("/painel");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mb-4">
            <Home className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ImobCRM</h1>
          <p className="text-muted-foreground text-sm mt-1">Entre na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">E-mail</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/registro" className="text-accent font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
