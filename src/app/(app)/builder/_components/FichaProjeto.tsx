import { Pill } from '@/design-system/via';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { dataCurta } from './statusBuilder';
import styles from './FichaProjeto.module.css';

/**
 * O documento — o produto do Builder.
 *
 * A COMPOSIÇÃO É ASSIMÉTRICA DE PROPÓSITO. Três momentos, nenhum com o mesmo peso:
 * um cabeçalho de largura total com o diagnóstico, uma grade 900+resto onde mora a
 * execução, e uma faixa de fechamento com o que a solução NÃO faz. Quatro seções
 * iguais em quatro cards iguais leriam como template — e este documento é o
 * argumento que o implementador leva para a reunião.
 *
 * A FAIXA DE FECHAMENTO NÃO É RODAPÉ. Riscos e fora do escopo ficam em superfície
 * própria, com o mesmo peso tipográfico do resto, porque são a parte que torna o
 * documento crível. Empurrá-los para o fim da barra lateral seria transformar
 * limite declarado em letra miúda — que é exatamente o que a casa não faz.
 */
export function FichaProjeto({
  documento,
  criadoEm,
  modelo,
}: {
  documento: DocumentoSolucao;
  criadoEm: string;
  modelo: string | null;
}) {
  const { viabilidade, economia } = documento;

  return (
    <article className={styles.ficha}>
      <header className={styles.cabecalho}>
        {/* Os "·" são itens de flex sem classe — herdam a cor do eyebrow, que é a
            regra: separador que carrega campo é informação, não filete. */}
        <p className={styles.eyebrow}>
          Projeto
          <span>·</span>
          {dataCurta(criadoEm)}
          {modelo ? (
            <>
              <span>·</span>
              {modelo}
            </>
          ) : null}
        </p>

        <h1 className={styles.titulo}>{documento.titulo}</h1>
        <p className={styles.resumo}>{documento.resumo}</p>

        {/* O diagnóstico vem antes de tudo: se a ideia não é viável como descrita,
            essa é a informação mais cara do documento e não pode estar embaixo. */}
        <div className={styles.viabilidade}>
          <div className={styles.viabilidadeTopo}>
            <span className={styles.viabilidadeRotulo}>Viabilidade</span>
            <Pill variant={viabilidade.nivel === 'direta' ? 'default' : 'attn'} size="sm">
              {viabilidade.nivel}
            </Pill>
          </div>
          <p className={styles.viabilidadeTexto}>{viabilidade.justificativa}</p>
        </div>
      </header>

      <div className={styles.grade}>
        <div className={styles.principal}>
          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>Como funciona</h2>
            <p className={styles.prosa}>{documento.arquitetura}</p>
          </section>

          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>
              Passo a passo
              <span className={styles.total}>{documento.etapas.length}</span>
            </h2>

            <ol className={styles.etapas}>
              {documento.etapas.map((etapa, indice) => (
                <li key={etapa.titulo} className={styles.etapa}>
                  <span className={styles.numero}>{String(indice + 1).padStart(2, '0')}</span>
                  <div className={styles.etapaCorpo}>
                    <h3 className={styles.etapaTitulo}>{etapa.titulo}</h3>
                    <p className={styles.etapaTexto}>{etapa.descricao}</p>
                    {etapa.ferramentas.length > 0 ? (
                      <p className={styles.etapaFerramentas}>{etapa.ferramentas.join(' · ')}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {documento.prompts.length > 0 ? (
            <section className={styles.secao}>
              <h2 className={styles.secaoTitulo}>
                Prompts
                <span className={styles.total}>{documento.prompts.length}</span>
              </h2>

              <div className={styles.prompts}>
                {documento.prompts.map((prompt) => (
                  <div key={prompt.titulo} className={styles.prompt}>
                    <div className={styles.promptTopo}>
                      <h3 className={styles.promptTitulo}>{prompt.titulo}</h3>
                      <BotaoCopiar texto={prompt.conteudo} rotuloDoQue={prompt.titulo} />
                    </div>
                    <pre className={styles.promptTexto}>{prompt.conteudo}</pre>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.lateral}>
          <section className={styles.painel}>
            <h2 className={styles.painelTitulo}>Ferramentas</h2>
            <ul className={styles.ferramentas}>
              {documento.ferramentas.map((ferramenta) => (
                <li key={ferramenta.nome} className={styles.ferramenta}>
                  <div className={styles.ferramentaTopo}>
                    <span className={styles.ferramentaNome}>{ferramenta.nome}</span>
                    <span className={styles.custo} data-custo={ferramenta.custo}>
                      {ferramenta.custo}
                    </span>
                  </div>
                  <p className={styles.ferramentaPapel}>{ferramenta.papel}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Número protagonista, com a conta ao lado. Estimativa sem premissa é
              chute com aparência de dado — por isso as premissas não são nota de
              rodapé, são o corpo do bloco. */}
          <section className={styles.painel}>
            <h2 className={styles.painelTitulo}>Economia estimada</h2>
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
          </section>
        </aside>
      </div>

      <section className={styles.fechamento}>
        <div className={styles.fechamentoColuna}>
          <h2 className={styles.fechamentoTitulo}>Riscos</h2>
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
          <h2 className={styles.fechamentoTitulo}>Fora do escopo</h2>
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
    </article>
  );
}
