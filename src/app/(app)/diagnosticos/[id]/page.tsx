import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { obterDiagnostico } from '@/lib/diagnosticos/queries';
import { ExecutorDiagnostico } from '../_components/ExecutorDiagnostico';
import { PainelRelatorio } from '../_components/PainelRelatorio';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Relatório do diagnóstico' };

export default async function DiagnosticoPage({
  params,
  searchParams,
}: PageProps<'/diagnosticos/[id]'>) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const diagnostico = await obterDiagnostico(id);
  if (!diagnostico) notFound();

  return (
    <div className={styles.pagina}>
      <Link href="/diagnosticos" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar aos diagnósticos
      </Link>

      {diagnostico.status === 'concluido' && diagnostico.relatorio ? (
        <PainelRelatorio diagnostico={diagnostico} />
      ) : (
        <ExecutorDiagnostico
          id={diagnostico.id}
          status={diagnostico.status}
          automatico={diagnostico.status === 'na_fila' || consulta.executar === '1'}
        />
      )}
    </div>
  );
}
