import { notFound } from 'next/navigation';
import layout from '../aprendizado.module.css';
import styles from './preview.module.css';

/** Bancada local para a cascata global de links. Nunca disponível em produção. */
export default function PreviewInteracoes() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={layout.pagina}>
      <div className={layout.conteudo}>
        <h1>Links em texto e navegação</h1>
        <p>
          Consulte o <a href="#destino">link no parágrafo</a> ou o{' '}
          <a href="#destino" className={styles.texto}>
            link estilizado no parágrafo
          </a>
          .
        </p>
        <ul>
          <li>
            Leia o <a href="#destino">link na lista</a>.
          </li>
          <li>
            Leia o{' '}
            <a href="#destino" className={styles.texto} data-link-texto>
              link de texto com classe na lista
            </a>
            .
          </li>
          <li>
            Documentação
            <ul>
              <li>
                <a href="#destino">Link na lista aninhada</a>
              </li>
            </ul>
          </li>
        </ul>
        <nav aria-label="Navegação de teste">
          <ul>
            <li>
              <a href="#destino" className={styles.navegacao}>
                Abrir conteúdo
              </a>
            </li>
          </ul>
        </nav>
        <span className={styles.tintaFoco} data-amostra-foco aria-hidden="true" />
        <h2 id="destino">Destino</h2>
      </div>
    </main>
  );
}
