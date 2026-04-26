import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Política de Privacidade</h1>
      <div className="space-y-4 text-muted-foreground">
        <p>
          Sua privacidade é importante para nós. Esta política descreve como coletamos, usamos e protegemos suas informações.
        </p>
        <h2 className="text-lg font-semibold text-foreground">1. Informações Coletadas</h2>
        <p>
          Coletamos dados como nome, e-mail e informações de uso da plataforma para melhorar a experiência do usuário.
        </p>
        <h2 className="text-lg font-semibold text-foreground">2. Uso das Informações</h2>
        <p>
          Utilizamos seus dados para autenticação, comunicação de atualizações e análise de uso do sistema.
        </p>
        <h2 className="text-lg font-semibold text-foreground">3. Compartilhamento</h2>
        <p>
          Não vendemos ou compartilhamos suas informações pessoais com terceiros, exceto quando exigido por lei.
        </p>
        <h2 className="text-lg font-semibold text-foreground">4. Segurança</h2>
        <p>
          Implementamos medidas de segurança para proteger seus dados contra acesso não autorizado ou alteração.
        </p>
        <h2 className="text-lg font-semibold text-foreground">5. Seus Direitos</h2>
        <p>
          Você pode solicitar acesso, correção ou exclusão de seus dados pessoais a qualquer momento.
        </p>
      </div>
    </div>
  );
}
