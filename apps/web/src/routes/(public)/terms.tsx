import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(public)/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="text-muted-foreground text-sm">
          Última atualização: abril de 2026
        </p>
      </div>

      <p className="text-muted-foreground">
        Bem-vindo ao Sports System. Ao acessar ou utilizar esta plataforma,
        você concorda com os termos e condições descritos abaixo. Leia
        atentamente antes de prosseguir.
      </p>

      <Section title="1. Sobre a Plataforma">
        <p>
          O Sports System é um sistema acadêmico de gerenciamento de competições
          multiesportivas, desenvolvido como projeto universitário. A plataforma
          permite o cadastro de delegações, atletas e técnicos, além do
          acompanhamento de resultados e quadro de medalhas.
        </p>
      </Section>

      <Section title="2. Uso Permitido">
        <p>Ao utilizar esta plataforma, você concorda em:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Fornecer informações verdadeiras no momento do cadastro.</li>
          <li>Utilizar a plataforma exclusivamente para fins relacionados à competição.</li>
          <li>Não compartilhar suas credenciais de acesso com terceiros.</li>
          <li>Não utilizar a plataforma para fins ilícitos ou que prejudiquem outros usuários.</li>
        </ul>
      </Section>

      <Section title="3. Contas de Usuário">
        <p>
          Cada usuário é responsável por manter a confidencialidade de sua senha
          e por todas as atividades realizadas em sua conta. Em caso de uso não
          autorizado, notifique imediatamente os administradores da plataforma.
        </p>
      </Section>

      <Section title="4. Conteúdo Gerado pelos Usuários">
        <p>
          Os dados inseridos na plataforma (nomes de atletas, resultados,
          informações de delegações) são de responsabilidade do usuário que os
          cadastrou. A plataforma não se responsabiliza pela veracidade ou
          precisão das informações inseridas.
        </p>
      </Section>

      <Section title="5. Disponibilidade do Serviço">
        <p>
          Por se tratar de um projeto acadêmico, a plataforma pode estar sujeita
          a interrupções para manutenção, atualizações ou por limitações de
          infraestrutura. Não garantimos disponibilidade contínua do serviço.
        </p>
      </Section>

      <Section title="6. Limitação de Responsabilidade">
        <p>
          O Sports System é fornecido "como está", sem garantias de qualquer
          natureza. Em nenhuma hipótese os desenvolvedores serão responsáveis
          por danos diretos, indiretos ou consequentes decorrentes do uso ou
          incapacidade de uso da plataforma.
        </p>
      </Section>

      <Section title="7. Alterações nos Termos">
        <p>
          Estes termos podem ser atualizados a qualquer momento. O uso
          continuado da plataforma após alterações constitui aceitação dos novos
          termos.
        </p>
      </Section>

      <Section title="8. Contato">
        <p>
          Dúvidas sobre estes termos podem ser enviadas aos administradores da
          plataforma através dos canais disponibilizados pela instituição de
          ensino responsável pelo projeto.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
