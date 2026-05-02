import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight, Terminal } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { loginFn, logoutFn, registerFn } from "@/features/auth/server/auth";
import { useNavCommand } from "@/shared/components/layouts/nav-command-context";
import { buildApiUrl } from "@/shared/lib/url";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: HomePage,
});

interface TerminalLine {
  id: string;
  text: string;
  isUser: boolean;
}

type FlowState =
  | { type: "none" }
  | { type: "login"; step: "provider" }
  | { type: "login"; step: "email" }
  | { type: "login"; step: "password"; email: string }
  | { type: "register"; step: "provider" }
  | { type: "register"; step: "name" }
  | { type: "register"; step: "email"; name: string }
  | { type: "register"; step: "password"; name: string; email: string }
  | { type: "register"; step: "confirm"; name: string; email: string; password: string };

const BASE_COMMANDS: Record<string, { description: string; action: string }> = {
  help: { description: "Mostra comandos disponíveis", action: "help" },
  nav: { description: "Abre o menu de navegação", action: "nav" },
  navigation: { description: "Abre o menu de navegação", action: "nav" },
  leagues: { description: "Vai para a página de ligas", action: "leagues" },
  home: { description: "Vai para a página inicial", action: "home" },
  login: { description: "Inicia fluxo de login no terminal", action: "login" },
  register: { description: "Inicia fluxo de cadastro no terminal", action: "register" },
  profile: { description: "Vai para o perfil", action: "profile" },
  clear: { description: "Limpa o terminal", action: "clear" },
};

const AUTH_COMMANDS: Record<string, { description: string; action: string }> = {
  logout: { description: "Encerra a sessão atual", action: "logout" },
};

const AUTH_PROVIDERS = [
  { key: "1", label: "Email", id: "email" },
  { key: "2", label: "GitHub", id: "github" },
  { key: "3", label: "Google", id: "google" },
];

function syncAccessTokenCookie(accessToken: string) {
  document.cookie = `access_token=${accessToken}; path=/; max-age=1800; SameSite=Lax`;
}

function isMaskedStep(flow: FlowState): boolean {
  return (
    (flow.type === "login" && flow.step === "password") ||
    (flow.type === "register" && (flow.step === "password" || flow.step === "confirm"))
  );
}

function HomePage() {
  useSuspenseQuery(leagueListQueryOptions());
  const router = useRouter();
  const { open: openNav } = useNavCommand();
  const session = Route.useRouteContext().session;

  const [lines, setLines] = useState<TerminalLine[]>([
    { id: "welcome", text: "Bem-vindo ao SportsHub! Digite 'help' para ver os comandos.", isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [flow, setFlow] = useState<FlowState>({ type: "none" });
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const selectedProviderIndexRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = useCallback((text: string, isUser: boolean) => {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), text, isUser }]);
  }, []);

  const showProviders = useCallback(
    (action: "login" | "register") => {
      const verb = action === "login" ? "login" : "cadastro";
      addLine(`Escolha o método de ${verb}:`, false);
      setFlow({ type: action, step: "provider" });
      selectedProviderIndexRef.current = 0;
      setSelectedProviderIndex(0);
    },
    [addLine]
  );

  const handleOAuth = useCallback((provider: string) => {
    if (provider === "github") {
      window.location.href = buildApiUrl("/auth/oauth/github/start");
    } else if (provider === "google") {
      window.location.href = buildApiUrl("/auth/oauth/google/start");
    }
  }, []);

  const handleLoginEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const tokens = await loginFn({ data: { email, password } });
        syncAccessTokenCookie(tokens.access_token);
        await router.invalidate();
        addLine("Login realizado com sucesso!", false);
        addLine("Redirecionando para ligas...", false);
        setTimeout(() => router.navigate({ to: "/leagues" }), 800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao fazer login";
        addLine(`Erro: ${msg}`, false);
        addLine("Tente novamente ou digite 'cancelar' para sair.", false);
      }
    },
    [addLine, router]
  );

  const handleRegisterEmail = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const tokens = await registerFn({ data: { name, email, password } });
        syncAccessTokenCookie(tokens.access_token);
        await router.invalidate();
        addLine("Cadastro realizado com sucesso!", false);
        addLine("Redirecionando para ligas...", false);
        setTimeout(() => router.navigate({ to: "/leagues" }), 800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao cadastrar";
        addLine(`Erro: ${msg}`, false);
        addLine("Tente novamente ou digite 'cancelar' para sair.", false);
      }
    },
    [addLine, router]
  );

  const processFlow = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed.toLowerCase() === "cancelar") {
        addLine("Operação cancelada.", false);
        setFlow({ type: "none" });
        return;
      }

      if (flow.type === "login") {
        if (flow.step === "provider") {
          const choice = trimmed.toLowerCase();
          const provider = AUTH_PROVIDERS.find((p) => p.key === choice || p.id === choice);
          if (!provider) {
            addLine("Opção inválida. Digite 1, 2, 3 ou o nome do provedor.", false);
            return;
          }
          if (provider.id === "email") {
            addLine("Digite seu email:", false);
            setFlow({ type: "login", step: "email" });
          } else {
            handleOAuth(provider.id);
          }
          return;
        }

        if (flow.step === "email") {
          if (!trimmed.includes("@")) {
            addLine("Email inválido. Tente novamente.", false);
            return;
          }
          addLine("Digite sua senha:", false);
          setFlow({ type: "login", step: "password", email: trimmed });
          return;
        }

        if (flow.step === "password") {
          if (!trimmed) {
            addLine("Senha não pode estar vazia.", false);
            return;
          }
          void handleLoginEmail(flow.email, trimmed);
          setFlow({ type: "none" });
          return;
        }
      }

      if (flow.type === "register") {
        if (flow.step === "provider") {
          const choice = trimmed.toLowerCase();
          const provider = AUTH_PROVIDERS.find((p) => p.key === choice || p.id === choice);
          if (!provider) {
            addLine("Opção inválida. Digite 1, 2, 3 ou o nome do provedor.", false);
            return;
          }
          if (provider.id === "email") {
            addLine("Digite seu nome:", false);
            setFlow({ type: "register", step: "name" });
          } else {
            handleOAuth(provider.id);
          }
          return;
        }

        if (flow.step === "name") {
          if (!trimmed) {
            addLine("Nome não pode estar vazio.", false);
            return;
          }
          addLine("Digite seu email:", false);
          setFlow({ type: "register", step: "email", name: trimmed });
          return;
        }

        if (flow.step === "email") {
          if (!trimmed.includes("@")) {
            addLine("Email inválido. Tente novamente.", false);
            return;
          }
          addLine("Digite sua senha:", false);
          setFlow({ type: "register", step: "password", name: flow.name, email: trimmed });
          return;
        }

        if (flow.step === "password") {
          if (
            trimmed.length < 8 ||
            !/[A-Z]/.test(trimmed) ||
            !/[^a-zA-Z0-9]/.test(trimmed)
          ) {
            addLine("Senha inválida. Requisitos:", false);
            addLine("  - Mínimo 8 caracteres", false);
            addLine("  - Ao menos uma letra maiúscula", false);
            addLine("  - Ao menos um símbolo", false);
            return;
          }
          addLine("Confirme sua senha:", false);
          setFlow({
            type: "register",
            step: "confirm",
            name: flow.name,
            email: flow.email,
            password: trimmed,
          });
          return;
        }

        if (flow.step === "confirm") {
          if (trimmed !== flow.password) {
            addLine("Senhas não coincidem. Tente novamente.", false);
            return;
          }
          void handleRegisterEmail(flow.name, flow.email, flow.password);
          setFlow({ type: "none" });
          return;
        }
      }
    },
    [flow, addLine, handleOAuth, handleLoginEmail, handleRegisterEmail]
  );

  const executeCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      if (!trimmed) return;

      addLine(`> ${cmd}`, true);

      if (trimmed === "help") {
        addLine("Comandos disponíveis:", false);
        Object.entries(BASE_COMMANDS).forEach(([name, info]) => {
          addLine(`  ${name.padEnd(12)} — ${info.description}`, false);
        });
        if (session) {
          Object.entries(AUTH_COMMANDS).forEach(([name, info]) => {
            addLine(`  ${name.padEnd(12)} — ${info.description}`, false);
          });
        }
      } else if (trimmed === "nav" || trimmed === "navigation") {
        addLine("Abrindo navegação...", false);
        openNav();
      } else if (trimmed === "leagues") {
        addLine("Navegando para ligas...", false);
        router.navigate({ to: "/leagues" });
      } else if (trimmed === "home") {
        addLine("Já está na página inicial.", false);
      } else if (trimmed === "login") {
        if (session) {
          addLine(`Você já está logado como ${session.name}.`, false);
          addLine("Use 'logout' para encerrar a sessão.", false);
        } else {
          showProviders("login");
        }
      } else if (trimmed === "register") {
        showProviders("register");
      } else if (trimmed === "logout") {
        if (!session) {
          addLine("Você não está logado.", false);
          return;
        }
        try {
          await logoutFn();
          await router.invalidate();
          addLine("Sessão encerrada.", false);
        } catch {
          addLine("Erro ao encerrar sessão.", false);
        }
      } else if (trimmed === "profile") {
        if (session) {
          addLine("Navegando para perfil...", false);
          router.navigate({ to: "/profile" });
        } else {
          addLine("Você precisa estar logado. Use 'login' para entrar.", false);
        }
      } else if (trimmed === "clear") {
        setLines([]);
      } else {
        addLine(
          `Comando não reconhecido: '${trimmed}'. Digite 'help' para ver os comandos.`,
          false
        );
      }
    },
    [addLine, openNav, router, session, showProviders]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (flow.type !== "none" && flow.step === "provider") {
      if (!input.trim()) {
        const provider = AUTH_PROVIDERS[selectedProviderIndexRef.current];
        addLine(`> ${provider.label}`, true);
        if (provider.id === "email") {
          if (flow.type === "login") {
            addLine("Digite seu email:", false);
            setFlow({ type: "login", step: "email" });
          } else {
            addLine("Digite seu nome:", false);
            setFlow({ type: "register", step: "name" });
          }
        } else {
          handleOAuth(provider.id);
        }
        setInput("");
        return;
      }
    }

    if (!input.trim()) return;

    const raw = input;

    if (flow.type !== "none") {
      if (!isMaskedStep(flow)) {
        addLine(`> ${raw}`, true);
      } else {
        addLine("> ********", true);
      }
      processFlow(raw);
    } else {
      await executeCommand(raw);
    }

    setHistory((prev) => [...prev, raw]);
    setHistoryIndex(-1);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flow.type !== "none" && flow.step === "provider") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next =
          (selectedProviderIndexRef.current - 1 + AUTH_PROVIDERS.length) %
          AUTH_PROVIDERS.length;
        selectedProviderIndexRef.current = next;
        setSelectedProviderIndex(next);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next =
          (selectedProviderIndexRef.current + 1) % AUTH_PROVIDERS.length;
        selectedProviderIndexRef.current = next;
        setSelectedProviderIndex(next);
        return;
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const inputType = isMaskedStep(flow) ? "password" : "text";

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-mono">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Terminal size={16} className="text-muted-foreground" />
        {session ? (
          <span className="text-sm font-bold tracking-wider">
            {session.name} <span className="text-[10px] text-muted-foreground">[{session.role?.toLowerCase()}]</span>
          </span>
        ) : (
          <h1 className="text-sm font-bold tracking-wider">SPORTSHUB</h1>
        )}
      </div>

      {/* Terminal Output */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="space-y-1 mx-1.75">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`text-xs leading-relaxed text-foreground ${
                line.isUser ? "" : "opacity-70"
              }`}
            >
              {line.text}
            </div>
          ))}
        </div>
        {flow.type !== "none" && flow.step === "provider" && (
          <div className="space-y-0.5 mt-1 mb-1 mx-4">
            {AUTH_PROVIDERS.map((p, i) => (
              <div
                key={p.id}
                className={`text-xs ${
                  i === selectedProviderIndex
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                {"  "}
                {p.key}. {p.label}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
          <span className="text-surface-4 mt-0.5 shrink-0 select-none text-xs w-3 text-center">
            <ChevronRight size={20} />
          </span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type={inputType}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        </form>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
