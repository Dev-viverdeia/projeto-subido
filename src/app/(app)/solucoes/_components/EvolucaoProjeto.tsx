'use client';

import { useActionState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ChartNoAxesCombined,
  Check,
  ShieldCheck,
} from 'lucide-react';
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

const DECISOES: Array<{
  id: DecisaoEvolucaoProjeto;
  titulo: string;
  descricao: string;
}> = [
  {
    id: 'manter',
    titulo: 'Manter a operação',
    descricao: 'O projeto está funcionando e segue como foi entregue.',
  },
  {
    id: 'ajustar_garantia',
    titulo: 'Corrigir na garantia',
    descricao: 'Existe um ajuste do escopo entregue que precisa ser resolvido.',
  },
  {
    id: 'expandir',
    titulo: 'Expandir este projeto',
    descricao: 'O resultado abriu espaço para uma nova etapa paga.',
  },
  {
    id: 'novo_projeto',
    titulo: 'Começar outro projeto',
    descricao: 'Outra oportunidade de IA ficou clara para este cliente.',
  },
  {
    id: 'encerrar',
    titulo: 'Encerrar acompanhamento',
    descricao: 'Não há outra ação combinada depois desta revisão.',
  },
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
          <strong>A evolução começa depois do aceite final.</strong>
          <span>Conclua o encerramento com o cliente para marcar a revisão de resultado.</span>
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
        <div className={styles.titulo}>
          <span className={styles.icone}>
            <ChartNoAxesCombined size={19} aria-hidden="true" />
          </span>
          <div>
            <p>Depois da entrega</p>
            <h2>{registrada ? 'Resultado confirmado.' : 'Confirme o resultado com o cliente.'}</h2>
          </div>
        </div>
        <span className={styles.status}>
          {registrada ? (
            <>
              <BadgeCheck size={14} aria-hidden="true" /> Revisão registrada
            </>
          ) : (
            <>
              <CalendarClock size={14} aria-hidden="true" /> Revisão agendada
            </>
          )}
        </span>
      </header>

      <div className={styles.contexto}>
        <div>
          <span>Revisão de resultado</span>
          <strong>{formatarDataEvolucao(evolucao.revisaoEm)}</strong>
        </div>
        <div>
          <span>Garantia combinada</span>
          <strong>
            {encerramento.garantiaTerminaEm
              ? `Até ${formatarDataEvolucao(encerramento.garantiaTerminaEm.slice(0, 10))}`
              : 'Sem período adicional'}
          </strong>
        </div>
        <div>
          <span>Objetivo da conversa</span>
          <strong>Fato, evidência e próximo passo</strong>
        </div>
      </div>

      {registrada ? (
        <div className={styles.resultado}>
          <div className={styles.resultadoPrincipal}>
            <p>O que mudou na operação</p>
            <h3>{evolucao.resultadoObservado}</h3>
            {evolucao.evidenciaResultadoUrl && (
              <a href={evolucao.evidenciaResultadoUrl} target="_blank" rel="noreferrer">
                Ver evidência <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </div>
          <div className={styles.decisaoFinal}>
            <span>Decisão</span>
            <strong>
              {evolucao.decisao ? ROTULO_DECISAO_EVOLUCAO[evolucao.decisao] : 'Registrada'}
            </strong>
            <p>{evolucao.proximoPasso}</p>
            {evolucao.proximoPassoEm && (
              <time dateTime={evolucao.proximoPassoEm}>
                Próximo passo em {formatarDataEvolucao(evolucao.proximoPassoEm)}
              </time>
            )}
          </div>
          <footer>
            <span>
              {evolucao.compartilharCliente
                ? 'O resultado e o próximo passo também estão no portal do cliente.'
                : 'Este registro ficou somente na sua operação.'}
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
          <form action={acaoAgenda} className={styles.agendamento}>
            <input type="hidden" name="projeto" value={projetoId} />
            <label>
              <span>Quando revisar com o cliente</span>
              <input type="date" name="revisaoEm" defaultValue={evolucao.revisaoEm} required />
            </label>
            <button type="submit" disabled={agendando}>
              {agendando ? 'Atualizando…' : 'Atualizar data'}
            </button>
            {estadoAgenda.erro && <p role="alert">{estadoAgenda.erro}</p>}
            {estadoAgenda.sucesso && <p role="status">{estadoAgenda.sucesso}</p>}
          </form>

          <form action={acaoRegistro} className={styles.formulario}>
            <input type="hidden" name="projeto" value={projetoId} />
            <div className={styles.instrucao}>
              <Check size={17} aria-hidden="true" />
              <div>
                <strong>Registre somente o que foi confirmado.</strong>
                <span>Sem promessa, estimativa ou número que o cliente ainda não validou.</span>
              </div>
            </div>

            <div className={styles.gradeCampos}>
              <label className={styles.campoResultado}>
                <span>O que mudou na operação depois da entrega?</span>
                <textarea
                  name="resultado"
                  maxLength={4000}
                  required
                  placeholder="Ex.: a equipe passou a atender os contatos no mesmo fluxo e confirmou menos conversas perdidas fora do horário."
                />
              </label>
              <label>
                <span>Link da evidência</span>
                <input name="evidenciaUrl" type="url" maxLength={2048} placeholder="https://" />
                <small>Opcional: painel, relatório ou documento aprovado.</small>
              </label>
            </div>

            <fieldset className={styles.decisoes}>
              <legend>O que ficou combinado agora?</legend>
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
                    <span>
                      <strong>{decisao.titulo}</strong>
                      <small>{decisao.descricao}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.gradeProximoPasso}>
              <label>
                <span>Próximo passo combinado</span>
                <textarea
                  name="proximoPasso"
                  maxLength={2000}
                  required
                  placeholder="Ex.: revisar os indicadores com a responsável e decidir a expansão para o segundo canal."
                />
              </label>
              <label>
                <span>Quando isso acontece</span>
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
              <span>
                <strong>Mostrar esta revisão no portal do cliente</strong>
                <small>Compartilha somente o resultado e o próximo passo registrados aqui.</small>
              </span>
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
              <span>Depois de registrar, a decisão fica vinculada a esta entrega.</span>
              <button type="submit" disabled={registrando}>
                <BadgeCheck size={15} aria-hidden="true" />
                {registrando ? 'Registrando revisão…' : 'Registrar revisão de resultado'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
