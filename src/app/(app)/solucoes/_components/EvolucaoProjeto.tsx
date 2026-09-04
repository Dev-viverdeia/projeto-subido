'use client';

import { useActionState } from 'react';
import { ArrowUpRight, BadgeCheck, CalendarClock, Check, Link2, ShieldCheck } from 'lucide-react';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import {
  agendarRevisaoResultado,
  registrarRevisaoResultado,
} from '@/lib/projetos-execucao/evolucao-actions';
import {
  formatarDataEvolucao,
  ROTULO_DECISAO_EVOLUCAO,
  type DecisaoEvolucaoProjeto,
  type EvolucaoProjeto,
} from '@/lib/projetos-execucao/evolucao';
import styles from './EvolucaoProjeto.module.css';
import { ContinuidadeComercial } from './ContinuidadeComercial';

const INICIAL: EstadoProjetoExecucao = {};

const DECISOES: Array<{ id: DecisaoEvolucaoProjeto; titulo: string }> = [
  { id: 'manter', titulo: 'Manter como está' },
  { id: 'ajustar_garantia', titulo: 'Corrigir na garantia' },
  { id: 'expandir', titulo: 'Expandir este projeto' },
  { id: 'novo_projeto', titulo: 'Vender outro projeto' },
  { id: 'encerrar', titulo: 'Encerrar acompanhamento' },
];

export function EvolucaoProjeto({
  projetoId,
  empresa,
  encerramento,
  evolucao,
}: {
  projetoId: string;
  empresa: string;
  encerramento: EncerramentoProjeto | null;
  evolucao: EvolucaoProjeto | null;
}) {
  const [estadoAgenda, acaoAgenda, agendando] = useActionState(agendarRevisaoResultado, INICIAL);
  const [estadoRegistro, acaoRegistro, registrando] = useActionState(
    registrarRevisaoResultado,
    INICIAL,
  );

  if (!encerramento || encerramento.status !== 'encerrado' || !evolucao) {
    return (
      <section className={styles.indisponivel} role="status">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <strong>A revisão aparece depois do aceite final.</strong>
          <span>Conclua a entrega com o cliente para registrar o resultado.</span>
        </div>
      </section>
    );
  }

  const registrada = evolucao.status === 'registrada';
  const decisaoComercial =
    evolucao.decisao === 'expandir' || evolucao.decisao === 'novo_projeto'
      ? evolucao.decisao
      : null;

  return (
    <section className={styles.evolucao} data-registrada={registrada || undefined}>
      <header className={styles.cabecalho}>
        <div>
          <p>Depois da entrega</p>
          <h2>{registrada ? 'Resultado confirmado' : 'Confirme o resultado.'}</h2>
          {!registrada && <span>Registre o que mudou e combine a próxima ação.</span>}
        </div>
        <span className={styles.status}>
          {registrada ? (
            <BadgeCheck size={16} aria-hidden="true" />
          ) : (
            <CalendarClock size={16} aria-hidden="true" />
          )}
          {registrada ? 'Revisão concluída' : 'Revisão pendente'}
        </span>
      </header>

      {registrada ? (
        <div className={styles.resultado}>
          <div className={styles.resultadoPrincipal}>
            <span>Resultado confirmado pelo cliente</span>
            <h3>{evolucao.resultadoObservado}</h3>
            {evolucao.evidenciaResultadoUrl && (
              <a href={evolucao.evidenciaResultadoUrl} target="_blank" rel="noreferrer">
                Abrir resultado <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
          </div>

          <dl className={styles.proximaAcao}>
            <div>
              <dt>Decisão</dt>
              <dd>{evolucao.decisao ? ROTULO_DECISAO_EVOLUCAO[evolucao.decisao] : 'Registrada'}</dd>
            </div>
            <div>
              <dt>Próxima ação</dt>
              <dd>
                {evolucao.proximoPasso}
                {evolucao.proximoPassoEm && (
                  <time dateTime={evolucao.proximoPassoEm}>
                    {formatarDataEvolucao(evolucao.proximoPassoEm)}
                  </time>
                )}
              </dd>
            </div>
          </dl>

          <footer className={styles.rodapeResultado}>
            <span>
              <Check size={15} aria-hidden="true" />
              {evolucao.compartilharCliente
                ? 'Resultado disponível no portal do cliente'
                : 'Resultado salvo somente na sua conta'}
            </span>
            {decisaoComercial && (
              <ContinuidadeComercial
                projetoId={projetoId}
                empresa={empresa}
                decisao={decisaoComercial}
                proximoPasso={evolucao.proximoPasso!}
                proximoPassoEm={evolucao.proximoPassoEm}
                oportunidadeId={evolucao.oportunidadeContinuidadeId}
              />
            )}
          </footer>
        </div>
      ) : (
        <div className={styles.pendente}>
          <div className={styles.agenda}>
            <CalendarClock size={18} aria-hidden="true" />
            <div>
              <span>Revisão com o cliente</span>
              <strong>{formatarDataEvolucao(evolucao.revisaoEm)}</strong>
            </div>
            <details>
              <summary>Alterar data</summary>
              <form action={acaoAgenda}>
                <input type="hidden" name="projeto" value={projetoId} />
                <label>
                  <span className={styles.somenteLeitor}>Nova data da revisão</span>
                  <input type="date" name="revisaoEm" defaultValue={evolucao.revisaoEm} required />
                </label>
                <button type="submit" disabled={agendando}>
                  {agendando ? 'Salvando…' : 'Salvar data'}
                </button>
              </form>
              {estadoAgenda.erro && <p role="alert">{estadoAgenda.erro}</p>}
              {estadoAgenda.sucesso && <p role="status">{estadoAgenda.sucesso}</p>}
            </details>
          </div>

          <form action={acaoRegistro} className={styles.formulario}>
            <input type="hidden" name="projeto" value={projetoId} />

            <label className={styles.campoResultado}>
              <span>Qual resultado o cliente confirmou?</span>
              <textarea
                name="resultado"
                maxLength={4000}
                required
                placeholder="Ex.: a equipe passou a responder novos contatos em menos de um minuto."
              />
            </label>

            <details className={styles.evidencia}>
              <summary>
                <Link2 size={15} aria-hidden="true" /> Adicionar link do resultado
              </summary>
              <label>
                <span>Link do painel, relatório ou documento</span>
                <input name="evidenciaUrl" type="url" maxLength={2048} placeholder="https://" />
              </label>
            </details>

            <fieldset className={styles.decisoes}>
              <legend>O que acontece agora?</legend>
              <div>
                {DECISOES.map((decisao, indice) => (
                  <label key={decisao.id}>
                    <input
                      type="radio"
                      name="decisao"
                      value={decisao.id}
                      defaultChecked={indice === 0}
                    />
                    <span className={styles.marcaRadio} aria-hidden="true" />
                    <strong>{decisao.titulo}</strong>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.gradeProximoPasso}>
              <label>
                <span>Próxima ação combinada</span>
                <input
                  name="proximoPasso"
                  maxLength={2000}
                  required
                  placeholder="Ex.: revisar os indicadores com a responsável."
                />
              </label>
              <label>
                <span>Quando</span>
                <input
                  type="date"
                  name="proximoPassoEm"
                  defaultValue={evolucao.revisaoEm}
                  required
                />
              </label>
            </div>

            <label className={styles.compartilhar}>
              <input type="checkbox" name="compartilharCliente" defaultChecked />
              <span>Mostrar resultado e próxima ação no portal do cliente</span>
            </label>

            {estadoRegistro.erro && (
              <p className={styles.erro} role="alert">
                {estadoRegistro.erro}
              </p>
            )}
            {estadoRegistro.sucesso && (
              <p className={styles.sucesso} role="status">
                {estadoRegistro.sucesso}
              </p>
            )}

            <footer className={styles.rodapeFormulario}>
              <span>Este registro encerra a revisão desta entrega.</span>
              <button type="submit" disabled={registrando}>
                <BadgeCheck size={16} aria-hidden="true" />
                {registrando ? 'Registrando…' : 'Registrar resultado'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
