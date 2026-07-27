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

      <p className="todo">
        TODO(legal) — precisa de revisão jurídica e de alinhamento com o que a plataforma realmente
        coleta. Rodar tráfego pago com pixel e sem esta política publicada é infração à LGPD.
      </p>

      <h2>1. Quem é o controlador</h2>
      <p>Razão social, CNPJ e contato do encarregado (DPO), conforme LGPD art. 41.</p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>Cadastro: nome, e-mail, telefone e dados de pagamento.</li>
        <li>Uso: progresso, interações na plataforma e registros de acesso.</li>
        <li>Navegação: cookies, identificadores de campanha (UTM, gclid) e IP.</li>
      </ul>

      <h2>3. Para que usamos</h2>
      <p>
        Execução do contrato, suporte, melhoria do produto e — mediante consentimento — marketing.
      </p>

      <h2>4. Base legal</h2>
      <p>Execução de contrato, legítimo interesse e consentimento, por finalidade.</p>

      <h2>5. Compartilhamento</h2>
      <p>Processadores de pagamento, infraestrutura, analytics e plataformas de anúncio.</p>

      <h2>6. Seus direitos</h2>
      <p>
        Acesso, correção, portabilidade, eliminação e revogação do consentimento (LGPD art. 18).
      </p>

      <h2>7. Cookies</h2>
      <p>Categorias usadas e como revogar a escolha a qualquer momento.</p>

      <h2>8. Retenção e segurança</h2>
      <p>Prazos de guarda e medidas técnicas adotadas.</p>
    </>
  );
}
