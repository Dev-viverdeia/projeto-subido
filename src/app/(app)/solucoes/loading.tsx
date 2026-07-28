import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { EsqueletoCatalogo } from './_components/EsqueletoCatalogo';
import styles from './pagina.module.css';

/**
 * Estado de carregamento da rota — o cabeçalho é o REAL (texto estático), só a
 * grade vira skeleton. Quanto menos troca de pele no fim do load, menos pulo.
 */
export default function CarregandoSolucoes() {
  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Soluções de IA" oculto />
      <EsqueletoCatalogo />
    </div>
  );
}
