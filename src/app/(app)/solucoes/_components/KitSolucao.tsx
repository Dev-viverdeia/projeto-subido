import { Wrench } from 'lucide-react';
import type { ItemSolucao } from '@/lib/conteudo/queries';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import styles from './KitSolucao.module.css';

/**
 * A coluna lateral do detalhe: ferramentas e prompts. Server Component — o único
 * pedaço que hidrata é o botão de copiar de cada prompt.
 *
 * Vazio é COMPACTO (caixa tracejada de uma linha), não EmptyState de página:
 * numa coluna lateral, o estado grande gritaria mais que o conteúdo principal.
 */
function Eyebrow({ children, total }: { children: string; total: number }) {
  return (
    <h2 className={styles.eyebrow}>
      {children}
      <span className={styles.total}>{total}</span>
    </h2>
  );
}

function VazioCompacto({ texto }: { texto: string }) {
  return <p className={styles.vazio}>{texto}</p>;
}

export function Ferramentas({ itens }: { itens: ItemSolucao[] }) {
  return (
    <section aria-label="Ferramentas da solução" className={styles.secao}>
      <Eyebrow total={itens.length}>Ferramentas</Eyebrow>
      {itens.length === 0 ? (
        <VazioCompacto texto="Esta solução não depende de ferramenta externa." />
      ) : (
        <ul className={styles.listaFerramentas}>
          {itens.map((item) => (
            <li key={item.id} className={styles.ferramenta}>
              <span className={styles.tile} aria-hidden="true">
                <Wrench size={14} strokeWidth={1.8} />
              </span>
              <div className={styles.ferramentaTextos}>
                <p className={styles.ferramentaNome}>{item.titulo}</p>
                {item.conteudo && <p className={styles.ferramentaPara}>{item.conteudo}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Prompts({ itens }: { itens: ItemSolucao[] }) {
  return (
    <section aria-label="Prompts da solução" className={styles.secao}>
      <Eyebrow total={itens.length}>Prompts</Eyebrow>
      {itens.length === 0 ? (
        <VazioCompacto texto="Esta solução não usa prompt pronto." />
      ) : (
        <ul className={styles.listaPrompts}>
          {itens.map((item) => (
            <li key={item.id} className={styles.prompt}>
              <div className={styles.promptCabecalho}>
                <p className={styles.promptNome}>{item.titulo}</p>
                <BotaoCopiar texto={item.conteudo} rotuloDoQue={item.titulo} />
              </div>
              {item.conteudo && <pre className={styles.promptTexto}>{item.conteudo}</pre>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
