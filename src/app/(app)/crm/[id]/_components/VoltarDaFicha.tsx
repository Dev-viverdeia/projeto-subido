import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { hrefListaProspeccao, origemProspeccao } from '@/lib/prospeccao/retorno';
import styles from '../pagina.module.css';

export function VoltarDaFicha({
  parametros,
}: {
  parametros: Record<string, string | string[] | undefined>;
}) {
  const origem =
    parametros.origem === 'prospeccao'
      ? origemProspeccao(parametros.lista, parametros.empresa)
      : null;
  return (
    <Link
      href={origem ? hrefListaProspeccao(origem) : '/vendas'}
      scroll={origem ? false : undefined}
      className={styles.voltar}
    >
      <ArrowLeft size={16} strokeWidth={1.9} aria-hidden="true" />
      {origem ? 'Voltar para Prospecção' : 'Voltar para Vendas'}
    </Link>
  );
}
