'use client';

import { useTransition } from 'react';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import type { EstadoStack } from '@/lib/builder/queries';
import { escolherStack } from '@/lib/builder/actions';
import { BotaoCopiar } from '../../../_components/BotaoCopiar';
import { Visto } from '../../../_components/PillEstado';
import { montarKit } from '@/lib/builder/kit';
import { STACKS, acharStack, promptDePartida } from './STACKS';
import styles from './EtapaKit.module.css';

/**
 * SEU KIT — o que você vai usar, e por onde começa.
 *
 * A ESCOLHA VEM ANTES DO PROMPT, e essa ordem é o conteúdo da etapa. O prompt de
 * partida depende de onde a pessoa vai construir; mostrá-lo antes da escolha
 * seria dar a instrução errada para dois terços de quem lê. Enquanto não escolhe,
 * a etapa mostra as três saídas e nada mais — e a etapa "Construir" fica travada,
 * dizendo exatamente isso.
 *
 * O ZIP EXISTE E DIZ O QUE TEM DENTRO. São cinco arquivos derivados do documento
 * — não onze. A referência gera onze porque roda três agentes que escrevem coisas
 * diferentes; aqui há uma geração e um documento, e recortá-lo em fatias menores
 * só para chegar a onze seria inflar número.
 *
 * A LISTA DOS ARQUIVOS FICA VISÍVEL ANTES DO DOWNLOAD, e não num accordion de
 * "curiosidade opcional": é ela que diz por que baixar em vez de copiar da tela.
 * Baixar às cegas é o que faz um botão de download parecer opcional.
 *
 * Continua sem "Versão em PDF": o PDF exigiria renderizar layout no servidor, e
 * o kit é feito para uma IA ler — Markdown é o formato certo para isso.
 */
export function EtapaKit({
  id,
  documento,
  stack,
}: {
  id: string;
  documento: DocumentoSolucao;
  stack: EstadoStack;
}) {
  const [salvando, iniciar] = useTransition();
  const escolhida = acharStack(stack);

  const escolher = (novo: string) => {
    const dados = new FormData();
    dados.set('id', id);
    dados.set('stack', novo);
    iniciar(() => {
      void escolherStack(dados);
    });
  };

  const arquivos = montarKit(documento);

  return (
    <div className={styles.kit}>
      <section aria-labelledby="kit-baixar">
        <h3 id="kit-baixar" className={styles.secaoTitulo}>
          Baixe o kit do projeto
        </h3>

        <div className={styles.baixar}>
          {/* `<a download>` e não botão: o download é uma navegação com resposta
              de arquivo, e o elemento certo dá clique do meio, "salvar como" e
              funciona sem JS. */}
          <a className={styles.botaoBaixar} href={`/api/builder/${id}/kit`} download>
            Baixar projeto (.zip)
          </a>
          <p className={styles.baixarNota}>
            {arquivos.length} arquivos em Markdown, prontos para anexar na IA.
          </p>
        </div>

        <ul className={styles.arquivos}>
          {arquivos.map((a) => (
            <li key={a.nome} className={styles.arquivo}>
              {a.nome}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kit-onde">
        <h3 id="kit-onde" className={styles.secaoTitulo}>
          Escolha onde construir
        </h3>

        <div role="radiogroup" aria-labelledby="kit-onde" className={styles.opcoes}>
          {STACKS.map((s) => {
            const ativa = stack === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={ativa}
                className={styles.opcao}
                data-ativa={ativa ? '' : undefined}
                disabled={salvando}
                onClick={() => escolher(s.id)}
              >
                <span className={styles.opcaoTopo}>
                  <span className={styles.opcaoEyebrow}>{s.eyebrow}</span>
                  <span className={styles.marca} aria-hidden="true">
                    {ativa ? <Visto tamanho={11} /> : null}
                  </span>
                </span>
                <span className={styles.opcaoTitulo}>{s.titulo}</span>
                <span className={styles.opcaoTexto}>{s.descricao}</span>
              </button>
            );
          })}
        </div>
      </section>

      {escolhida && (
        <section aria-labelledby="kit-comece" className={styles.comece}>
          <h3 id="kit-comece" className={styles.secaoTitulo}>
            Comece no {escolhida.titulo}
          </h3>

          <ol className={styles.passos}>
            {escolhida.passos.map((passo, i) => (
              <li key={passo} className={styles.passo}>
                <span className={styles.passoNumero} aria-hidden="true">
                  {String.fromCharCode(97 + i)}
                </span>
                {passo}
              </li>
            ))}
          </ol>

          <div className={styles.prompt}>
            <pre className={styles.promptTexto}>
              {promptDePartida(documento.titulo, documento.arquitetura)}
            </pre>
            <BotaoCopiar
              texto={promptDePartida(documento.titulo, documento.arquitetura)}
              rotuloDoQue="o prompt de partida"
            />
          </div>
        </section>
      )}

      <section aria-labelledby="kit-ferramentas">
        <h3 id="kit-ferramentas" className={styles.secaoTitulo}>
          Ferramentas do projeto
        </h3>
        <ul className={styles.ferramentas}>
          {documento.ferramentas.map((f) => (
            <li key={f.nome} className={styles.ferramenta}>
              <p className={styles.ferramentaNome}>{f.nome}</p>
              <p className={styles.ferramentaPapel}>{f.papel}</p>
            </li>
          ))}
        </ul>
      </section>

      {documento.prompts.length > 0 && (
        <section aria-labelledby="kit-prompts">
          <h3 id="kit-prompts" className={styles.secaoTitulo}>
            Prompts prontos
          </h3>
          <ul className={styles.listaPrompts}>
            {documento.prompts.map((p) => (
              <li key={p.titulo} className={styles.itemPrompt}>
                <div className={styles.itemPromptTopo}>
                  <p className={styles.ferramentaNome}>{p.titulo}</p>
                  <BotaoCopiar texto={p.conteudo} rotuloDoQue={p.titulo} />
                </div>
                <pre className={styles.promptTexto}>{p.conteudo}</pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
