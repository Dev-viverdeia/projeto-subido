'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Check, PencilLine, Target } from 'lucide-react';
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
  const [editando, setEditando] = useState(false);
  const [estado, acao, pendente] = useActionState(salvarPerfilJornada, ESTADO_INICIAL);
  const aberto = !perfil || editando;

  return (
    <section
      id="configuracao-jornada"
      className={`${styles.bloco} ${aberto ? styles.aberto : styles.resumido}`}
      aria-labelledby="titulo-configuracao-jornada"
    >
      <header className={styles.cabecalho}>
        <div className={styles.marca} aria-hidden="true">
          {perfil ? <Check size={18} strokeWidth={2.4} /> : <Target size={19} strokeWidth={1.8} />}
        </div>
        <div className={styles.introducao}>
          <p>{perfil ? 'Direção da operação' : 'Briefing de ativação'}</p>
          <h2 id="titulo-configuracao-jornada">
            {perfil
              ? `${perfil.projetoInicialTitulo ?? 'Projeto inicial'} para ${perfil.nicho}`
              : 'Dê três coordenadas para o mapa responder.'}
          </h2>
          <span>
            {perfil
              ? perfil.posicionamento
              : 'O restante da jornada será calculado com fatos do CRM, calls, diagnósticos e propostas.'}
          </span>
        </div>

        {!aberto && (
          <button type="button" className={styles.editar} onClick={() => setEditando(true)}>
            <PencilLine size={15} strokeWidth={1.9} aria-hidden="true" />
            Editar direção
          </button>
        )}
      </header>

      {aberto && (
        <form action={acao} className={styles.formulario}>
          <fieldset className={styles.decisao}>
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

          <fieldset className={styles.decisao}>
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

          <fieldset className={styles.decisao}>
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
            <p aria-live="polite" className={estado.erro ? styles.erro : styles.sucesso}>
              {estado.erro ?? estado.sucesso ?? 'Essas escolhas podem ser ajustadas depois.'}
            </p>
            <div className={styles.acoes}>
              {perfil && (
                <button
                  type="button"
                  className={styles.cancelar}
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className={styles.salvar}
                disabled={pendente || !projetos.length}
              >
                {pendente ? 'Salvando…' : 'Salvar direção'}
                {!pendente && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
              </button>
            </div>
          </footer>
        </form>
      )}
    </section>
  );
}
