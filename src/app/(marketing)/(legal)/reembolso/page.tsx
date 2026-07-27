import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de reembolso',
  // Documento legal não disputa busca e não deve competir com a landing no índice.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <Link href="/" className="voltar">
        ← Voltar para a página inicial
      </Link>
      <h1>Política de reembolso</h1>

      <p className="todo">
        TODO(legal) — confirmar prazos e condições com o time e com o jurídico. O que estiver aqui
        precisa bater EXATAMENTE com o que a landing promete na seção de garantia; divergência entre
        os dois é o tipo de coisa que vira reclamação procedente.
      </p>

      <h2>Arrependimento em 7 dias</h2>
      <p>
        Compra feita fora de estabelecimento físico dá direito a arrependimento em até 7 dias
        corridos, com devolução integral (CDC art. 49). Sem formulário e sem entrevista de retenção.
      </p>

      <h2>Como solicitar</h2>
      <p>Canal, dados necessários e prazo de resposta.</p>

      <h2>Prazo de estorno</h2>
      <p>Prazo por meio de pagamento, contado da confirmação do pedido.</p>

      <h2>Cancelamento após os 7 dias</h2>
      <p>O acesso permanece ativo até o fim do ciclo já pago, sem cobrança do ciclo seguinte.</p>

      <h2>Garantia de resultado</h2>
      <p>
        TODO — se existir, as condições exatas entram aqui, e precisam ser as mesmas exibidas na
        landing. Se forem constrangedoras de listar, a garantia não deve ser oferecida.
      </p>
    </>
  );
}
