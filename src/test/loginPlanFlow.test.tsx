import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// ---------- Mocks ----------
const h = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastMock: vi.fn(),
  signInMock: vi.fn(),
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  functionsInvokeMock: vi.fn(),
  refreshUserDataMock: vi.fn(),
  signOutMock: vi.fn(),
  mockUser: { id: "user-123", user_metadata: { account_type: "corretor" } } as any,
}));
const {
  navigateMock, toastMock, signInMock, fromMock, rpcMock,
  functionsInvokeMock, refreshUserDataMock, signOutMock,
} = h;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => h.navigateMock };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: h.toastMock }),
  toast: h.toastMock,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signInWithPassword: (...a: any[]) => h.signInMock(...a) },
    from: (...a: any[]) => h.fromMock(...a),
    rpc: (...a: any[]) => h.rpcMock(...a),
    functions: { invoke: (...a: any[]) => h.functionsInvokeMock(...a) },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: h.mockUser,
    signOut: h.signOutMock,
    refreshUserData: h.refreshUserDataMock,
  }),
}));

// Imports AFTER mocks
import Login from "@/pages/Login";
import EscolherPlano from "@/pages/EscolherPlano";

// Helpers to build supabase query-builder chain
const buildQuery = (result: any) => {
  const q: any = {};
  q.select = vi.fn().mockReturnValue(q);
  q.eq = vi.fn().mockReturnValue(q);
  q.order = vi.fn().mockResolvedValue(result);
  q.maybeSingle = vi.fn().mockResolvedValue(result);
  q.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return q;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: "user-123", user_metadata: { account_type: "corretor" } };
});

describe("Fluxo Login → Escolher Plano → Painel", () => {
  it("login sem assinatura redireciona para /escolher-plano", async () => {
    signInMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "user_roles") return buildQuery({ data: [{ role: "broker" }], error: null });
      return buildQuery({ data: null, error: null });
    });
    rpcMock.mockImplementation((name: string) => {
      if (name === "get_effective_subscription") return Promise.resolve({ data: [], error: null });
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/seu@email/i), {
      target: { value: "broker@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "broker@test.com",
        password: "senha123",
      });
      expect(navigateMock).toHaveBeenCalledWith("/escolher-plano", { replace: true });
    });
  });

  it("login com assinatura ativa redireciona para /painel", async () => {
    signInMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    fromMock.mockImplementation(() => buildQuery({ data: [{ role: "broker" }], error: null }));
    rpcMock.mockResolvedValue({
      data: [{ id: "sub-1", plan_id: "plan-1", status: "active" }],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/seu@email/i), {
      target: { value: "broker@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/painel", { replace: true });
    });
  });

  it("seleção de plano gratuito ativa assinatura e vai para /painel", async () => {
    const freePlan = {
      id: "plan-free",
      name: "Plano Grátis",
      price: 0,
      billing_cycle: "monthly",
      trial_days: 0,
      max_properties: 10,
      max_brokers: 1,
      modules: ["imoveis"],
      is_free: true,
      plan_type: "corretor",
    };

    fromMock.mockImplementation((table: string) => {
      if (table === "profiles")
        return buildQuery({ data: { account_type: "corretor" }, error: null });
      if (table === "plans") return buildQuery({ data: [freePlan], error: null });
      return buildQuery({ data: null, error: null });
    });
    rpcMock.mockResolvedValue({ data: "sub-new", error: null });
    refreshUserDataMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <EscolherPlano />
      </MemoryRouter>
    );

    const btn = await screen.findByRole("button", { name: /começar grátis/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("create_trial_subscription", {
        _user_id: "user-123",
        _plan_id: "plan-free",
      });
      expect(refreshUserDataMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/painel", { replace: true });
    });
  });
});
