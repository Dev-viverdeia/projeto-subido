import { Pill } from '@/design-system/via';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import styles from './EntenderProjeto.module.css';

/**
 * ETAPA 2 — ENTENDA O PROJETO. Só o que responde "o que é isto e por quê".
 *
 * A primeira versão desta etapa era a FichaProjeto INTEIRA, e o defeito era de
 * estrutura, não de estilo: o título repetia o hero logo acima, e etapas,
 * prompts e ferramentas apareciam aqui E nas etapas seguintes — o Kit mostra
 * ferramentas e prompts, o Construir mostra as etapas como kanban. O painel
 * virava uma rolagem de milhares de pixels duplicando três seções.
 *
 * Fica o que SÓ existe aqui: o resumo, o diagnóstico de viabilidade, a
 * arquitetura em prosa, a conta da economia e a fronteira (riscos + fora do
 * escopo). É a leitura de dez minutos antes da reunião com o cliente — o
 * material de execução mora nas etapas seguintes, e o avanço da sala já leva
 * até ele.
 */
export function EntenderProjeto({ documento }: { documento: DocumentoSolucao }) {
  const { viabilidade, economia } = documento;

  return (
    <div className={styles.entender}>
      {/* O resumo abre como lead — o título NÃO se repete: ele está no hero,
          a 200px daqui. */}
      <p className={styles.lead}>{documento.resumo}</p>

      <div className={styles.viabilidade}>
        <div className={styles.viabilidadeTopo}>
          <span className={styles.rotuloMono}>Viabilidade</span>
          <Pill variant={viabilidade.nivel === 'direta' ? 'default' : 'attn'} size="sm">
            {viabilidade.nivel}
          </Pill>
        </div>
        <p className={styles.viabilidadeTexto}>{viabilidade.justificativa}</p>
      </div>

      <div className={styles.grade}>
        <section className={styles.principal} aria-labelledby="entender-como">
          <h3 id="entender-como" className={styles.rotuloMono}>
            Como funciona
          </h3>
          <p className={styles.prosa}>{documento.arquitetura}</p>
        </section>

        {/* A economia mora AQUI e só aqui — é argumento de entendimento, não de
            execução. Número protagonista, premissas como corpo do bloco: a conta
            que o leitor pode refazer. */}
        <aside className={styles.lateral} aria-labelledby="entender-economia">
          <h3 id="entender-economia" className={styles.rotuloMono}>
            Economia estimada
          </h3>
          <p className={styles.economia}>
            <span className={styles.economiaNumero}>{economia.horas_por_mes}</span>
            <span className={styles.economiaUnidade}>h / mês</span>
          </p>
          <p className={styles.economiaRotulo}>Premissas desta conta</p>
          <ul className={styles.premissas}>
            {economia.premissas.map((premissa) => (
              <li key={premissa}>{premissa}</li>
            ))}
          </ul>
        </aside>
      </div>

      <section className={styles.fechamento} aria-label="Riscos e fora do escopo">
        <div className={styles.fechamentoColuna}>
          <h3 className={styles.rotuloMono}>Riscos</h3>
          <ul className={styles.riscos}>
            {documento.riscos.map((item) => (
              <li key={item.risco} className={styles.risco}>
                <p className={styles.riscoTexto}>{item.risco}</p>
                <p className={styles.mitigacao}>{item.mitigacao}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.fechamentoColuna}>
          <h3 className={styles.rotuloMono}>Fora do escopo</h3>
          <ul className={styles.fora}>
            {documento.fora_do_escopo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.nota}>
            O que está nesta coluna não faz parte da entrega. Combinar a fronteira antes é o que
            evita a discussão de escopo na terceira semana.
          </p>
        </div>
      </section>
    </div>
  );
}
