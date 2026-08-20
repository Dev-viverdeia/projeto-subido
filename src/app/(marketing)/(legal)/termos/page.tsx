import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de uso',
  // Documento legal não disputa busca e não deve competir com a landing no índice.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <Link href="/" className="voltar">
        ← Voltar para a página inicial
      </Link>
      <h1>Termos de uso</h1>

      <p>Última atualização: 19 de agosto de 2026.</p>

      <p>
        Estes termos regulam o uso da Subido, plataforma criada para ajudar profissionais a
        prospectar empresas, vender e entregar projetos de inteligência artificial. Ao criar uma
        conta ou usar a plataforma, você declara que leu e concordou com estes termos.
      </p>

      <h2>1. Objeto</h2>
      <p>
        A Subido reúne formação, projetos guiados, prospecção, vendas, reuniões, propostas, mentoria
        e ferramentas de apoio. A disponibilidade de cada recurso pode variar conforme o acesso da
        conta. A plataforma não garante clientes, vendas, faturamento ou resultados específicos.
      </p>

      <h2>2. Cadastro e conta</h2>
      <p>
        Você deve fornecer informações verdadeiras, manter seus dados atualizados e proteger suas
        credenciais. A conta é pessoal e não pode ser compartilhada. Você é responsável pelas ações
        realizadas na sua conta e deve comunicar imediatamente qualquer acesso indevido.
      </p>

      <h2>3. Uso da plataforma e dados de terceiros</h2>
      <p>
        Ao cadastrar leads, contatos, gravações, transcrições ou arquivos, você declara possuir base
        legal e autorização para esse tratamento. É proibido usar a Subido para spam, fraude,
        discriminação, violação de privacidade, atividade ilícita ou tentativa de acesso não
        autorizado.
      </p>

      <h2>4. Integrações externas</h2>
      <p>
        Integrações, como o Google Calendar, são opcionais e dependem da autorização do titular da
        conta externa. Você pode desconectá-las quando quiser. Serviços de terceiros também possuem
        termos próprios e podem alterar disponibilidade ou funcionamento sem controle da Subido.
      </p>

      <h2>5. Propriedade intelectual</h2>
      <p>
        A marca, o software, as formações, os templates e os materiais da Subido são protegidos. O
        acesso concede licença limitada, revogável e não transferível para uso profissional próprio.
        Não é permitido copiar, revender, publicar ou redistribuir conteúdo sem autorização.
      </p>

      <h2>6. Conduta e suspensão</h2>
      <p>
        Podemos limitar ou suspender acesso em caso de risco de segurança, violação destes termos,
        inadimplência ou uso que prejudique terceiros ou a operação. Sempre que possível, você será
        informado e terá oportunidade de corrigir o problema.
      </p>

      <h2>7. Conteúdo gerado por IA</h2>
      <p>
        Sugestões, análises, propostas e outros conteúdos gerados por inteligência artificial podem
        conter erros. Você deve revisar informações, fontes, valores, compromissos e decisões antes
        de apresentá-los a clientes ou colocá-los em produção.
      </p>

      <h2>8. Privacidade, cancelamento e contato</h2>
      <p>
        O tratamento de dados segue a <Link href="/privacidade">Política de privacidade</Link>. As
        regras de arrependimento e reembolso estão na{' '}
        <Link href="/reembolso">Política de reembolso</Link>. Para dúvidas ou solicitações, escreva
        para <a href="mailto:rafaelmilagre@gmail.com">rafaelmilagre@gmail.com</a>.
      </p>
    </>
  );
}
