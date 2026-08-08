import Link from 'next/link';
import { ScanSearch } from 'lucide-react';
import styles from '../pagina.module.css';

export function AtalhoDiagnostico({ oportunidadeId }: { oportunidadeId: string }) {
  return (
    <Link
      href={`/diagnosticos/novo?oportunidade=${oportunidadeId}`}
      className={styles.criarDiagnostico}
    >
      <ScanSearch size={16} strokeWidth={1.8} aria-hidden="true" />
      Diagnosticar
    </Link>
  );
}
