import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { EstadoCarregamento } from '../_components/EstadoCarregamento';
import { EsqueletoCatalogo } from './_components/EsqueletoCatalogo';
import styles from './pagina.module.css';

/**
 * Estado de carregamento da rota — o cabeçalho é o REAL (texto estático), só a
 * grade vira skeleton. Quanto menos troca de pele no fim do load, menos pulo.
 */
export default function CarregandoSolucoes() {
  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Projetos" oculto />
      <EstadoCarregamento
        titulo="Preparando seus projetos"
        descricao="Carregando os guias e o ponto atual de cada implementação."
      />
      <EsqueletoCatalogo />
    </div>
  );
}
