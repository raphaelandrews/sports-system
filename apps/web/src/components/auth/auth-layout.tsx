import { Button } from "@sports-system/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { toast } from "sonner";

import { AuthDivider } from "@/components/auth/auth-divider";
import { FloatingPaths } from "@/components/auth/floating-paths";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  switchText: string;
  switchLabel: string;
  switchTo: "/login" | "/register";
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  switchText,
  switchLabel,
  switchTo,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <span className="z-10 font-bold text-xl tracking-tight">
          Sports System
        </span>

        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div
        className="relative flex min-h-screen flex-col justify-center px-8"
        style={{ "--ring": "var(--border)", "--color-ring": "var(--color-border)" } as React.CSSProperties}
      >
        <Button
          render={<Link to="/" />}
          className="absolute top-7 left-5 pr-2.5 pl-1.5"
          variant="ghost"
          size="sm"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Início
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-6">
          <span className="block font-bold text-xl tracking-tight lg:hidden">
            Sports System
          </span>

          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => toast.info("OAuth em breve")}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continuar com Google
            </Button>
            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => toast.info("OAuth em breve")}
            >
              <GithubIcon className="mr-2 h-4 w-4" />
              Continuar com GitHub
            </Button>
          </div>

          <AuthDivider>OU</AuthDivider>

          {children}

          <p className="text-center text-muted-foreground text-sm">
            {switchText}{" "}
            <Link
              to={switchTo}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {switchLabel}
            </Link>
          </p>

          <p className="text-muted-foreground text-xs">
            Ao continuar, você concorda com nossos{" "}
            <Link
              to="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
  </svg>
);

const GithubIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 1024 1024" {...props}>
    <path
      clipRule="evenodd"
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
      transform="scale(64)"
    />
  </svg>
);
