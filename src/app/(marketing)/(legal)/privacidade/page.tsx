import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  // Documento legal não disputa busca e não deve competir com a landing no índice.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <Link href="/" className="voltar">
        ← Voltar para a página inicial
      </Link>
      <h1>Política de privacidade</h1>

      <p>Última atualização: 19 de agosto de 2026.</p>

      <p>
        Esta política explica como a Subido trata dados pessoais quando você cria uma conta, usa a
        plataforma e conecta serviços externos. A Subido é uma plataforma para profissionais
        prospectarem empresas, venderem e entregarem projetos de inteligência artificial.
      </p>

      <h2>1. Quem é o controlador</h2>
      <p>
        A Subido é o produto responsável pelas decisões sobre o tratamento descrito nesta política,
        em colaboração com o Viver de IA. Para dúvidas de privacidade, solicitações de titulares ou
        informações sobre o controlador, escreva para{' '}
        <a href="mailto:rafaelmilagre@gmail.com">rafaelmilagre@gmail.com</a>.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>Conta: nome, e-mail, telefone, foto e informações de autenticação.</li>
        <li>
          Operação: clientes em negociação, contatos, projetos, propostas, tarefas, notas e arquivos
          que você decidir registrar.
        </li>
        <li>
          Reuniões: data, participantes, gravação, transcrição, resumo e próximos passos quando
          esses recursos forem usados.
        </li>
        <li>
          Navegação e segurança: endereço IP, dispositivo, registros de acesso e preferências de
          cookies.
        </li>
        <li>
          Google Calendar: identificador e e-mail da conta Google, autorização de acesso e dados dos
          eventos criados pela Subido.
        </li>
      </ul>

      <h2>3. Como usamos os dados</h2>
      <ul>
        <li>Manter sua conta e disponibilizar as funcionalidades contratadas.</li>
        <li>Organizar sua operação comercial e a entrega de projetos de IA.</li>
        <li>Gerar análises, recomendações e conteúdos solicitados por você.</li>
        <li>Prevenir fraude, abuso e incidentes de segurança.</li>
        <li>Prestar suporte e comunicar mudanças relevantes do serviço.</li>
      </ul>

      <h2>4. Integração com o Google Calendar</h2>
      <p>
        A conexão com o Google Calendar é opcional. Quando autorizada, a Subido usa o acesso apenas
        para criar e manter as reuniões que você agenda pela plataforma, incluir o convidado e
        inserir o link público da sala Subido. Não vendemos dados do Google, não os usamos para
        publicidade e não lemos calendários que não sejam necessários a essa função.
      </p>
      <p>
        A autorização é armazenada de forma cifrada. Você pode desconectar o Google Calendar a
        qualquer momento em <strong>Minha conta</strong>; ao desconectar, a Subido revoga o acesso e
        remove a credencial armazenada.
      </p>

      <h2>5. Bases legais</h2>
      <p>
        Tratamos dados conforme a finalidade, com base na execução do serviço solicitado, no
        cumprimento de obrigação legal, no legítimo interesse com avaliação de impacto ou no seu
        consentimento, quando aplicável.
      </p>

      <h2>6. Compartilhamento</h2>
      <p>
        Podemos usar fornecedores de infraestrutura, banco de dados, inteligência artificial,
        comunicação, analytics e pagamento estritamente para operar a plataforma. Eles recebem
        somente os dados necessários ao serviço e ficam sujeitos a obrigações de proteção e
        confidencialidade. Também podemos compartilhar dados quando a lei exigir ou para proteger
        direitos e segurança.
      </p>

      <h2>7. Seus direitos</h2>
      <p>
        Você pode pedir confirmação do tratamento, acesso, correção, portabilidade, anonimização,
        eliminação, informação sobre compartilhamento e revogação de consentimento, nos termos da
        LGPD. Envie a solicitação pelo contato desta política.
      </p>

      <h2>8. Retenção e segurança</h2>
      <p>
        Conservamos os dados pelo tempo necessário para prestar o serviço, cumprir obrigações legais
        e exercer direitos. Aplicamos controles de acesso, cifragem de credenciais sensíveis,
        registros de segurança e segregação de dados por conta. Nenhum sistema é infalível; em caso
        de incidente relevante, adotaremos as medidas previstas em lei.
      </p>

      <h2>9. Cookies e atualizações</h2>
      <p>
        Cookies essenciais mantêm login e segurança. Cookies opcionais de medição ou marketing só
        são usados conforme a sua escolha. Podemos atualizar esta política para refletir mudanças no
        produto ou na legislação, indicando a data da nova versão nesta página.
      </p>
    </>
  );
}
