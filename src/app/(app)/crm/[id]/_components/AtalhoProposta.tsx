import Link from 'next/link';
import { FileSignature } from 'lucide-react';
import styles from '../pagina.module.css';

export function AtalhoProposta({ oportunidadeId }: { oportunidadeId: string }) {
  return (
    <Link href={`/propostas/nova?oportunidade=${oportunidadeId}`} className={styles.criarProposta}>
      <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
      Criar proposta
    </Link>
  );
}
