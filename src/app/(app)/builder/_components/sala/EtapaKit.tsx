'use client';

import { useId, useRef, useState, useTransition } from 'react';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import type { EstadoStack } from '@/lib/builder/queries';
import { escolherStack } from '@/lib/builder/actions';
import { BotaoCopiar } from '../../../_components/BotaoCopiar';
import { Visto } from '../../../_components/PillEstado';
import { montarKit } from '@/lib/builder/kit';
import { STACKS, acharStack, promptDePartida } from './STACKS';
import styles from './EtapaKit.module.css';

/** Ferramenta primeiro; instruções e arquivos permanecem disponíveis por contexto. */
export function EtapaKit({
  id,
  documento,
  stack,
  salvar = escolherStack,
}: {
  id: string;
  documento: DocumentoSolucao;
  stack: EstadoStack;
  salvar?: (dados: FormData) => Promise<{ ok: boolean }>;
}) {
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState(false);
  const bloqueado = useRef(false);
  const grupo = useId();
  const escolhida = acharStack(stack);

  const escolher = (novo: string) => {
    if (bloqueado.current || novo === stack) return;
    bloqueado.current = true;
    setErro(false);
    const dados = new FormData();
    dados.set('id', id);
    dados.set('stack', novo);
    iniciar(async () => {
      try {
        const resultado = await salvar(dados);
        if (!resultado.ok) setErro(true);
      } catch {
        setErro(true);
      } finally {
        bloqueado.current = false;
      }
    });
  };

  const arquivos = montarKit(documento);

  return (
    <div className={styles.kit}>
      <section aria-labelledby="kit-onde">
        <h2 id="kit-onde" className={styles.secaoTitulo}>
          Escolha onde construir
        </h2>

        <div role="radiogroup" aria-labelledby="kit-onde" className={styles.opcoes}>
          {STACKS.map((s) => {
            const ativa = stack === s.id;
            return (
              <label key={s.id} className={styles.opcao} data-ativa={ativa ? '' : undefined}>
                <input
                  type="radio"
                  name={grupo}
                  value={s.id}
                  checked={ativa}
                  disabled={salvando}
                  aria-label={s.titulo}
                  onChange={() => escolher(s.id)}
                />
                <span className={styles.opcaoTopo}>
                  <span className={styles.opcaoEyebrow}>{s.eyebrow}</span>
                  <span className={styles.marca} aria-hidden="true">
                    {ativa ? <Visto tamanho={11} /> : null}
                  </span>
                </span>
                <span className={styles.opcaoTitulo}>{s.titulo}</span>
                <span className={styles.opcaoTexto}>{s.descricao}</span>
              </label>
            );
          })}
        </div>
        {salvando ? (
          <p role="status" className={styles.baixarNota}>
            Salvando escolha…
          </p>
        ) : null}
        {erro ? (
          <p role="alert" className={styles.baixarNota}>
            Não foi possível salvar. Tente escolher novamente.
          </p>
        ) : null}
      </section>

      {escolhida && (
        <section aria-labelledby="kit-comece" className={styles.comece}>
          <h2 id="kit-comece" className={styles.secaoTitulo}>
            Comece no {escolhida.titulo}
          </h2>

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

          <details className={styles.detalhe}>
            <summary>Prompt de partida</summary>
            <div className={styles.prompt}>
              <pre className={styles.promptTexto}>
                {promptDePartida(documento.titulo, documento.arquitetura)}
              </pre>
              <BotaoCopiar
                texto={promptDePartida(documento.titulo, documento.arquitetura)}
                rotuloDoQue="o prompt de partida"
              />
            </div>
          </details>
        </section>
      )}

      <section aria-labelledby="kit-baixar">
        <h2 id="kit-baixar" className={styles.secaoTitulo}>
          Baixe o kit do projeto
        </h2>

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

      <details className={styles.detalhe}>
        <summary>Ferramentas do projeto</summary>
        <ul className={styles.ferramentas}>
          {documento.ferramentas.map((f) => (
            <li key={f.nome} className={styles.ferramenta}>
              <p className={styles.ferramentaNome}>{f.nome}</p>
              <p className={styles.ferramentaPapel}>{f.papel}</p>
            </li>
          ))}
        </ul>
      </details>

      {documento.prompts.length > 0 && (
        <section aria-labelledby="kit-prompts">
          <h2 id="kit-prompts" className={styles.secaoTitulo}>
            Prompts prontos
          </h2>
          <ul className={styles.listaPrompts}>
            {documento.prompts.map((p) => (
              <li key={p.titulo}>
                <details className={styles.detalhe}>
                  <summary>{p.titulo}</summary>
                  <div className={styles.itemPromptTopo}>
                    <BotaoCopiar texto={p.conteudo} rotuloDoQue={p.titulo} />
                  </div>
                  <pre className={styles.promptTexto}>{p.conteudo}</pre>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
