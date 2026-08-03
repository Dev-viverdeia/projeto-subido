import type { ItemSolucao } from '@/lib/conteudo/queries';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { iniciais } from './iniciais';
import styles from './KitSolucao.module.css';

/**
 * Ferramentas e prompts — o kit de implantação.
 *
 * SEM ÍCONE DE BIBLIOTECA, e a razão é de bundle: estes blocos vivem dentro da
 * `FichaSolucao`, que é cliente por causa do progresso. Um `lucide` importado
 * aqui arrastaria a biblioteca inteira para o navegador por causa de uma chave
 * inglesa. A sigla derivada do nome informa mais que o ícone genérico informava —
 * e é o mesmo tratamento que o card do catálogo dá à mesma ferramenta.
 *
 * O BLOCO DO PROMPT É ESCURO porque é CÓDIGO: monoespaçado sobre navy-deep é a
 * convenção que a pessoa já reconhece de qualquer editor, e a tinta clara sobre
 * escuro usa `--via-gray-300` (12,2:1) — nunca `--via-text-soft`, que sobre navy
 * cai para 3,45:1 e reprova AA.
 *
 * Vazio é COMPACTO (uma linha tracejada), não `EmptyState` de página: numa coluna
 * de apoio, o estado grande gritaria mais alto que o conteúdo principal.
 */
function Cabecalho({ children, total }: { children: string; total: number }) {
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
    <section aria-labelledby="ferramentas-titulo" className={styles.secao}>
      <div id="ferramentas-titulo">
        <Cabecalho total={itens.length}>Ferramentas</Cabecalho>
      </div>

      {itens.length === 0 ? (
        <VazioCompacto texto="Esta solução não depende de ferramenta externa." />
      ) : (
        <ul className={styles.listaFerramentas}>
          {itens.map((item) => (
            <li key={item.id} className={styles.ferramenta}>
              {/* A sigla é decorativa — quem carrega o significado é o nome ao
                  lado. Repeti-la em voz alta não informaria nada. */}
              <span className={styles.sigla} aria-hidden="true">
                {iniciais(item.titulo)}
              </span>
              <div className={styles.textos}>
                <p className={styles.nome}>{item.titulo}</p>
                {item.conteudo && <p className={styles.papel}>{item.conteudo}</p>}
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
    <section aria-labelledby="prompts-titulo" className={styles.secao}>
      <div id="prompts-titulo">
        <Cabecalho total={itens.length}>Prompts</Cabecalho>
      </div>

      {itens.length === 0 ? (
        <VazioCompacto texto="Esta solução não usa prompt pronto." />
      ) : (
        <ul className={styles.listaPrompts}>
          {itens.map((item) => (
            <li key={item.id} className={styles.prompt}>
              <div className={styles.promptTopo}>
                <p className={styles.nome}>{item.titulo}</p>
                {/* A MESMA GUARDA do `<pre>` abaixo. Sem ela, um prompt cadastrado
                    sem corpo mostrava o botão, escrevia string vazia na área de
                    transferência e respondia "Copiado" — a confirmação de uma
                    ação que não aconteceu. */}
                {item.conteudo && <BotaoCopiar texto={item.conteudo} rotuloDoQue={item.titulo} />}
              </div>

              {/* REGIÃO ROLÁVEL PRECISA SER FOCÁVEL. `max-height` + `overflow-y`
                  criam um scroller, e este `<pre>` não tem nenhum descendente
                  focável — sem `tabIndex`, quem navega só por teclado não alcança
                  o cursor de rolagem e o texto abaixo do corte fica ilegível.
                  É a `scrollable-region-focusable` do axe (WCAG 2.1.1); o
                  `Carousel` do DS aplica exatamente esta correção. Copiar não
                  substitui ler. */}
              {item.conteudo && (
                <pre
                  className={styles.codigo}
                  tabIndex={0}
                  role="region"
                  aria-label={`Texto do prompt: ${item.titulo}`}
                >
                  {item.conteudo}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
