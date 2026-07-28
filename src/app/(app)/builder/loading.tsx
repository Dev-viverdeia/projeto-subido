import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { Compositor } from './_components/Compositor';
import styles from './pagina.module.css';

/**
 * Estado de carregamento do Builder — e ele não tem skeleton nenhum de propósito.
 *
 * O que a rota espera do servidor é a LISTA de projetos, que só aparece abaixo da
 * dobra e só quando existe. O compositor é estático: pergunta, campo vazio,
 * exemplos. Renderizá-lo de verdade aqui faz o campo estar pronto para receber
 * texto enquanto a consulta ainda corre — quem chegou para criar um projeto não
 * espera nada, e quem chegou para reler o histórico vê a lista entrar embaixo,
 * sem a tela inteira trocar de pele.
 *
 * `temChave={false}` porque este componente não sabe: a leitura da env é da
 * página. Vale um instante com o campo desabilitado, e não o contrário — habilitar
 * por otimismo seria aceitar uma ideia que talvez não tenha para onde ir.
 */
export default function CarregandoBuilder() {
  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Builder" oculto />
      <Compositor temChave={false} />
    </div>
  );
}
