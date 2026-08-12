'use client';

import { useActionState, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, PencilLine, Target } from 'lucide-react';
import { salvarPerfilJornada } from '@/lib/jornada/actions';
import type { PerfilJornada } from '@/lib/jornada/motor';
import type { ProjetoInicialJornada } from '@/lib/jornada/queries';
import type { EstadoPerfilJornada } from '@/lib/jornada/schema';
import styles from './ConfiguracaoJornada.module.css';

const ESTADO_INICIAL: EstadoPerfilJornada = {};

export function ConfiguracaoJornada({
  perfil,
  projetos,
}: {
  perfil: PerfilJornada;
  projetos: ProjetoInicialJornada[];
}) {
  const [editando, setEditando] = useState(() => !perfil);
  const [passo, setPasso] = useState(1);
  const [estado, acao, pendente] = useActionState(salvarPerfilJornada, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  const aberto = editando;
  const mostrarCabecalho = Boolean(perfil) || !aberto;

  function avancar() {
    const campos = formulario.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      `[data-passo="${passo}"] input, [data-passo="${passo}"] textarea`,
    );

    for (const campo of campos ?? []) {
      if (!campo.checkValidity()) {
        campo.reportValidity();
        campo.focus();
        return;
      }
    }

    setPasso((atual) => Math.min(3, atual + 1));
  }

  return (
    <section
      id="configuracao-jornada"
      className={`${styles.bloco} ${aberto ? styles.aberto : styles.resumido}`}
      aria-labelledby={mostrarCabecalho ? 'titulo-configuracao-jornada' : undefined}
      aria-label={mostrarCabecalho ? undefined : 'Configure a direção da sua operação'}
    >
      {mostrarCabecalho && (
        <header className={styles.cabecalho}>
          <div className={styles.marca} aria-hidden="true">
            {perfil ? (
              <Check size={18} strokeWidth={2.4} />
            ) : (
              <Target size={19} strokeWidth={1.8} />
            )}
          </div>
          <div className={styles.introducao}>
            <p>{perfil ? 'Direção da operação' : 'Três decisões simples'}</p>
            <h2 id="titulo-configuracao-jornada">
              {perfil
                ? `${perfil.projetoInicialTitulo ?? 'Projeto inicial'} para ${perfil.nicho}`
                : 'Monte sua primeira direção de trabalho.'}
            </h2>
            <span>
              {perfil
                ? perfil.posicionamento
                : 'Escolha um mercado, um projeto e uma frase. Você poderá ajustar tudo depois.'}
            </span>
          </div>

          {!aberto && (
            <button
              type="button"
              className={styles.editar}
              onClick={() => {
                setPasso(1);
                setEditando(true);
              }}
            >
              {perfil ? (
                <PencilLine size={15} strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              )}
              {perfil ? 'Editar direção' : 'Definir direção'}
            </button>
          )}
        </header>
      )}

      {aberto && (
        <form ref={formulario} action={acao} className={styles.formulario}>
          <ol className={styles.progresso} aria-label="Etapas da direção da operação">
            {['Seu mercado', 'Projeto principal', 'Como vende'].map((rotulo, indice) => {
              const numero = indice + 1;
              const concluido = numero < passo;
              const ativo = numero === passo;

              return (
                <li
                  key={rotulo}
                  data-ativo={ativo || undefined}
                  data-concluido={concluido || undefined}
                >
                  <span>{concluido ? <Check size={13} strokeWidth={2.7} /> : numero}</span>
                  <strong>{rotulo}</strong>
                </li>
              );
            })}
          </ol>

          <fieldset className={styles.decisao} data-passo="1" hidden={passo !== 1}>
            <legend>
              <span>01</span>
              <strong>Onde você quer começar?</strong>
              <small>Um nicho específico deixa sua primeira abordagem mais concreta.</small>
            </legend>
            <label className={styles.campoTexto}>
              <span>Nicho inicial</span>
              <input
                type="text"
                name="nicho"
                defaultValue={perfil?.nicho ?? ''}
                placeholder="Ex.: clínicas odontológicas"
                minLength={2}
                maxLength={100}
                required
                aria-invalid={Boolean(estado.porCampo?.nicho)}
              />
              {estado.porCampo?.nicho && <small role="alert">{estado.porCampo.nicho}</small>}
            </label>
          </fieldset>

          <fieldset className={styles.decisao} data-passo="2" hidden={passo !== 2}>
            <legend>
              <span>02</span>
              <strong>Qual projeto você vai dominar primeiro?</strong>
              <small>
                Você poderá usar os outros depois. Agora precisamos de uma oferta principal.
              </small>
            </legend>
            {projetos.length ? (
              <div className={styles.projetos}>
                {projetos.map((projeto) => (
                  <label className={styles.projeto} key={projeto.id}>
                    <input
                      type="radio"
                      name="projetoInicialId"
                      value={projeto.id}
                      defaultChecked={projeto.id === perfil?.projetoInicialId}
                      required
                    />
                    <span className={styles.projetoMarca} aria-hidden="true">
                      <Check size={13} strokeWidth={2.6} />
                    </span>
                    <span>
                      <small>{projeto.categoria ?? 'Projeto guiado'}</small>
                      <strong>{projeto.titulo}</strong>
                      <em>{projeto.resumo}</em>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.semProjetos}>Nenhum projeto publicado está disponível agora.</p>
            )}
            {estado.porCampo?.projetoInicialId && (
              <small className={styles.erroCampo} role="alert">
                {estado.porCampo.projetoInicialId}
              </small>
            )}
          </fieldset>

          <fieldset className={styles.decisao} data-passo="3" hidden={passo !== 3}>
            <legend>
              <span>03</span>
              <strong>Como você explica o serviço?</strong>
              <small>Escreva para um cliente, sem ferramenta, sigla ou promessa abstrata.</small>
            </legend>
            <label className={styles.campoTexto}>
              <span>Frase de posicionamento</span>
              <textarea
                name="posicionamento"
                defaultValue={perfil?.posicionamento ?? ''}
                placeholder="Eu ajudo clínicas odontológicas a responder novos pacientes mais rápido com um atendimento de IA conectado à equipe."
                rows={4}
                minLength={20}
                maxLength={280}
                required
                aria-invalid={Boolean(estado.porCampo?.posicionamento)}
              />
              {estado.porCampo?.posicionamento && (
                <small role="alert">{estado.porCampo.posicionamento}</small>
              )}
            </label>
          </fieldset>

          <footer className={styles.rodape}>
            <div className={styles.rodapeContexto}>
              <span>Passo {passo} de 3</span>
              <p aria-live="polite" className={estado.erro ? styles.erro : styles.sucesso}>
                {estado.erro ?? estado.sucesso ?? 'Você poderá ajustar essa direção depois.'}
              </p>
            </div>
            <div className={styles.acoes}>
              {passo > 1 ? (
                <button
                  type="button"
                  className={styles.cancelar}
                  onClick={() => setPasso((atual) => Math.max(1, atual - 1))}
                >
                  <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
                  Voltar
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.cancelar}
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </button>
              )}

              {passo < 3 ? (
                <button type="button" className={styles.salvar} onClick={avancar}>
                  Continuar
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  className={styles.salvar}
                  disabled={pendente || !projetos.length}
                >
                  {pendente ? 'Salvando…' : 'Salvar direção'}
                  {!pendente && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
                </button>
              )}
            </div>
          </footer>
        </form>
      )}
    </section>
  );
}
