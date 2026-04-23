import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(public)/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-muted-foreground text-sm">
          Última atualização: abril de 2026
        </p>
      </div>

      <p className="text-muted-foreground">
        Esta Política de Privacidade descreve como o Sports System coleta,
        utiliza e protege as informações fornecidas pelos usuários. Ao utilizar
        a plataforma, você concorda com as práticas descritas abaixo.
      </p>

      <Section title="1. Dados Coletados">
        <p>Coletamos as seguintes informações ao utilizar a plataforma:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nome completo e endereço de e-mail (cadastro de conta).</li>
          <li>Informações de perfil de atletas e técnicos cadastrados.</li>
          <li>Dados de participação em eventos e resultados de competições.</li>
          <li>Registros de acesso e interações com a plataforma.</li>
        </ul>
      </Section>

      <Section title="2. Finalidade do Uso dos Dados">
        <p>As informações coletadas são utilizadas exclusivamente para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Autenticação e gerenciamento de contas de usuário.</li>
          <li>Exibição de resultados, classificações e quadro de medalhas.</li>
          <li>Envio de notificações relacionadas à competição.</li>
          <li>Fins acadêmicos e de demonstração do sistema.</li>
        </ul>
      </Section>

      <Section title="3. Armazenamento e Segurança">
        <p>
          Os dados são armazenados em servidores seguros. Adotamos medidas
          técnicas para proteger as informações contra acesso não autorizado,
          incluindo autenticação via JWT e hash de senhas. No entanto, nenhum
          sistema é completamente inviolável, e não podemos garantir segurança
          absoluta.
        </p>
      </Section>

      <Section title="4. Compartilhamento de Dados">
        <p>
          Não vendemos, alugamos ou compartilhamos seus dados pessoais com
          terceiros, exceto quando exigido por lei ou para fins estritamente
          necessários ao funcionamento da plataforma.
        </p>
        <p>
          Informações públicas, como nomes de atletas, delegações e resultados
          de competições, podem ser visualizadas por qualquer visitante da
          plataforma sem necessidade de cadastro.
        </p>
      </Section>

      <Section title="5. Retenção de Dados">
        <p>
          Os dados são mantidos enquanto a conta estiver ativa ou enquanto o
          projeto acadêmico estiver em funcionamento. Após o encerramento do
          projeto, os dados poderão ser anonimizados ou excluídos.
        </p>
      </Section>

      <Section title="6. Direitos do Usuário">
        <p>Você tem direito a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Acessar os dados cadastrados em sua conta.</li>
          <li>Solicitar a correção de informações incorretas.</li>
          <li>Solicitar a exclusão de sua conta e dados associados.</li>
        </ul>
        <p>
          Para exercer esses direitos, entre em contato com os administradores
          da plataforma.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          A plataforma utiliza cookies de sessão para manter o estado de
          autenticação do usuário. Esses cookies são estritamente necessários
          para o funcionamento do sistema e não são utilizados para rastreamento
          ou publicidade.
        </p>
      </Section>

      <Section title="8. Projeto Acadêmico">
        <p>
          O Sports System é um projeto desenvolvido em contexto universitário.
          Os dados inseridos na plataforma podem ser utilizados para fins de
          avaliação e demonstração acadêmica, sempre de forma anonimizada quando
          necessário.
        </p>
      </Section>

      <Section title="9. Contato">
        <p>
          Dúvidas sobre esta política podem ser encaminhadas aos administradores
          através dos canais disponibilizados pela instituição de ensino
          responsável pelo projeto.
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
