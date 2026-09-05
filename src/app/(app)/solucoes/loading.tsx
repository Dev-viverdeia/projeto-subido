import { EsqueletoCatalogo } from './_components/EsqueletoCatalogo';
import catalogo from './_components/CatalogoProjetos.module.css';
import styles from './pagina.module.css';

export default function CarregandoSolucoes() {
  return (
    <div className={styles.pagina} aria-busy="true">
      <div className={catalogo.raiz}>
        <header className={catalogo.abertura}>
          <div>
            <h1 className={catalogo.titulo}>Projetos</h1>
            <p className={catalogo.apoio}>Guias para implementar IA para seus clientes.</p>
          </div>
        </header>
        <EsqueletoCatalogo />
      </div>
    </div>
  );
}
