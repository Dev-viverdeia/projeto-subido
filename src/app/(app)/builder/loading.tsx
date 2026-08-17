import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { EstadoCarregamento } from '../_components/EstadoCarregamento';
import { Compositor } from './_components/Compositor';
import styles from './pagina.module.css';

/**
 * Estado de carregamento do Builder — e ele não tem skeleton nenhum de propósito.
 *
 * O compositor aparece de imediato enquanto Projeto-base, clientes e histórico
 * chegam do servidor. Os seletores continuam bloqueados até a rota real assumir,
 * evitando uma tela vazia sem inventar opções que ainda não foram lidas.
 */
export default function CarregandoBuilder() {
  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Estúdio" oculto />
      <EstadoCarregamento
        titulo="Preparando o Estúdio"
        descricao="Carregando projetos-base, clientes e trabalhos recentes."
      />
      <Compositor />
    </div>
  );
}
