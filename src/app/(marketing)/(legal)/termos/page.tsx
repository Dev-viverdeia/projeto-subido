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

      <p className="todo">
        TODO(legal) — este documento precisa ser redigido e revisado por advogado antes de qualquer
        veiculação paga. O esqueleto abaixo lista os pontos que um contrato de assinatura digital no
        Brasil precisa cobrir; o texto em si não é conteúdo jurídico e não deve ser publicado como
        está.
      </p>

      <h2>1. Objeto</h2>
      <p>O que a assinatura dá acesso, e o que ela explicitamente não inclui.</p>

      <h2>2. Cadastro e conta</h2>
      <p>Requisitos, veracidade dos dados, responsabilidade pelas credenciais e uso individual.</p>

      <h2>3. Pagamento, renovação e reajuste</h2>
      <p>Meios aceitos, ciclo de cobrança, renovação automática e regra de reajuste.</p>

      <h2>4. Cancelamento e arrependimento</h2>
      <p>
        Direito de arrependimento em 7 dias (CDC art. 49) e cancelamento a qualquer tempo com efeito
        ao fim do ciclo. Ver a <a href="/reembolso">política de reembolso</a>.
      </p>

      <h2>5. Propriedade intelectual</h2>
      <p>Titularidade do conteúdo, licença de uso pessoal e vedação a redistribuição.</p>

      <h2>6. Conduta e suspensão</h2>
      <p>Compartilhamento de acesso, uso indevido e hipóteses de suspensão.</p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Em especial: a assinatura entrega formação, ferramentas, mentoria e vitrine — não promete
        vaga, contrato nem faturamento.
      </p>

      <h2>8. Foro e contato</h2>
      <p>Foro eleito e canal oficial de atendimento.</p>
    </>
  );
}
