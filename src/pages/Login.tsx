import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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

    const [{ data: rolesData }, { data: subscriptionData }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      supabase.rpc("get_effective_subscription", { _user_id: data.user.id }),
    ]);

    const roles = rolesData?.map(r => r.role) || [];
    const subscription = Array.isArray(subscriptionData) ? subscriptionData[0] : null;
    const requestedPath = (location.state as any)?.from?.pathname;

    if (requestedPath && requestedPath !== "/login") {
      navigate(requestedPath, { replace: true });
    } else if (roles.includes("super_admin") || roles.includes("admin_staff")) {
      navigate("/dashboard", { replace: true });
    } else if (roles.includes("partner")) {
      navigate(subscription ? "/painel-parceiro" : "/escolher-plano", { replace: true });
    } else if (subscription) {
      navigate("/painel", { replace: true });
    } else {
      navigate("/escolher-plano", { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={logoImg} alt="MV BROKER CONNECT" className="mx-auto w-32 h-32 object-contain mb-4" />
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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
