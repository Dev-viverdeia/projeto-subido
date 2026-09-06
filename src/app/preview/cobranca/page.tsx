import { notFound } from 'next/navigation';
import { PainelAssinatura } from '@/app/(app)/conta/assinatura/PainelAssinatura';
import { PainelCreditos } from '@/app/(app)/conta/creditos/PainelCreditos';
import { RetornoCheckout } from '@/app/(app)/conta/_components/RetornoCheckout';
import styles from './preview.module.css';
import shell from '@/app/(app)/layout.module.css';

export default async function PreviewCobranca({ searchParams }: PageProps<'/preview/cobranca'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const falha = parametros.estado === 'erro';
  const assinatura =
    parametros.estado && !falha
      ? {
          status: String(parametros.estado),
          cancela_ao_fim_do_periodo: parametros.cancelar === '1',
          periodo_atual_termina_em: '2026-10-05T12:00:00Z',
        }
      : null;
  const catalogo = {
    pronto: false,
    planos: { starter: null, pro: null },
    pacotes: { essencial: null, crescimento: null, escala: null },
  };
  const credito = parametros.tela === 'creditos';
  return (
    <div className={shell.shell}>
      <main className={styles.preview}>
        <RetornoCheckout
          tipo={credito ? 'creditos' : 'assinatura'}
          retorno={typeof parametros.checkout === 'string' ? parametros.checkout : undefined}
          sessao={typeof parametros.session_id === 'string' ? parametros.session_id : undefined}
        />
        {credito ? (
          <PainelCreditos
            plano="starter"
            catalogo={catalogo}
            carteira={{ saldo: falha ? null : 30, movimentos: [], extratoDisponivel: !falha }}
          />
        ) : (
          <PainelAssinatura
            plano="pro"
            saldo={30}
            assinatura={assinatura}
            indisponivel={falha}
            catalogo={catalogo}
            creditos={{ starter: null, pro: null }}
          />
        )}
      </main>
    </div>
  );
}
