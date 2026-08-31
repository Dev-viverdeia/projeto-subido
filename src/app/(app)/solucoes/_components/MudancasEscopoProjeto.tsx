'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Check, Clock3, FileDiff, ShieldCheck, X } from 'lucide-react';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import { analisarMudancaEscopo } from '@/lib/projetos-execucao/escopo-actions';
import type { MudancaEscopoProjeto } from '@/lib/projetos-execucao/queries';
import { formatarReais } from '@/lib/propostas/schema';
import styles from './MudancasEscopoProjeto.module.css';

const INICIAL: EstadoProjetoExecucao = {};

const ROTULO_STATUS: Record<MudancaEscopoProjeto['status'], string> = {
  em_analise: 'Análise pendente',
  incluida: 'Já estava incluída',
  aguardando_cliente: 'Decisão do cliente',
  aprovada: 'Aprovada',
  recusada: 'Não aprovada',
  cancelada: 'Cancelada',
};

function resumoImpacto(mudanca: MudancaEscopoProjeto) {
  const partes: string[] = [];
  if ((mudanca.impactoPrazoDias ?? 0) > 0) {
    partes.push(`+${mudanca.impactoPrazoDias} ${mudanca.impactoPrazoDias === 1 ? 'dia' : 'dias'}`);
  }
  if ((mudanca.impactoValorCentavos ?? 0) > 0) {
    partes.push(formatarReais(mudanca.impactoValorCentavos));
  }
  return partes.join(' · ');
}

function AnaliseMudanca({
  projetoId,
  mudanca,
}: {
  projetoId: string;
  mudanca: MudancaEscopoProjeto;
}) {
  const [classificacao, setClassificacao] = useState<'dentro_escopo' | 'fora_escopo'>(
    'dentro_escopo',
  );
  const [estado, analisar, pendente] = useActionState(analisarMudancaEscopo, INICIAL);

  return (
    <form action={analisar} className={styles.analise}>
      <input type="hidden" name="projeto" value={projetoId} />
      <input type="hidden" name="mudanca" value={mudanca.id} />
      <input type="hidden" name="classificacao" value={classificacao} />

      <fieldset>
        <legend>Isso já fazia parte do combinado?</legend>
        <div className={styles.escolhas}>
          <button
            type="button"
            data-ativo={classificacao === 'dentro_escopo' || undefined}
            onClick={() => setClassificacao('dentro_escopo')}
          >
            <Check size={16} aria-hidden="true" />
            <span>
              <strong>Sim, já está incluído</strong>
              <small>Confirme como será feito, sem alterar prazo ou valor.</small>
            </span>
          </button>
          <button
            type="button"
            data-ativo={classificacao === 'fora_escopo' || undefined}
            onClick={() => setClassificacao('fora_escopo')}
          >
            <FileDiff size={16} aria-hidden="true" />
            <span>
              <strong>Não, amplia o projeto</strong>
              <small>Informe o impacto e peça a aprovação do cliente.</small>
            </span>
          </button>
        </div>
      </fieldset>

      <label>
        Resposta para o cliente
        <textarea
          name="resposta"
          minLength={5}
          maxLength={4000}
          required
          placeholder={
            classificacao === 'dentro_escopo'
              ? 'Ex.: Isso já está contemplado na etapa de validação. Vamos incluir no próximo ciclo.'
              : 'Ex.: Para incluir este novo fluxo, precisamos ampliar a configuração e os testes.'
          }
        />
      </label>

      {classificacao === 'fora_escopo' && (
        <div className={styles.impactos}>
          <label>
            Dias adicionais
            <input type="number" name="impactoPrazoDias" min="0" max="365" defaultValue="0" />
          </label>
          <label>
            Valor adicional
            <span className={styles.campoMoeda}>
              <i>R$</i>
              <input name="impactoValor" inputMode="decimal" placeholder="0,00" />
            </span>
          </label>
        </div>
      )}

      {(estado.erro || estado.sucesso || estado.aviso) && (
        <div className={styles.retorno} role="status">
          {estado.erro && <p data-erro>{estado.erro}</p>}
          {estado.sucesso && <p>{estado.sucesso}</p>}
          {estado.aviso && <small>{estado.aviso}</small>}
        </div>
      )}

      <button type="submit" className={styles.enviar} disabled={pendente}>
        {pendente
          ? 'Registrando análise…'
          : classificacao === 'dentro_escopo'
            ? 'Confirmar no combinado'
            : 'Enviar impacto ao cliente'}
        {!pendente && <ArrowRight size={15} aria-hidden="true" />}
      </button>
    </form>
  );
}

export function MudancasEscopoProjeto({
  projetoId,
  mudancas,
}: {
  projetoId: string;
  mudancas: MudancaEscopoProjeto[];
}) {
  const ativa = mudancas.find((item) => item.status === 'em_analise') ?? null;
  const aguardando = mudancas.find((item) => item.status === 'aguardando_cliente') ?? null;
  const historico = mudancas.filter(
    (item) => !['em_analise', 'aguardando_cliente'].includes(item.status),
  );
  const adicionaisAprovados = mudancas
    .filter((item) => item.status === 'aprovada')
    .reduce((total, item) => total + (item.impactoValorCentavos ?? 0), 0);

  return (
    <section className={styles.painel} aria-labelledby="mudancas-escopo-titulo">
      <header>
        <div className={styles.titulo}>
          <span>
            <FileDiff size={18} aria-hidden="true" />
          </span>
          <div>
            <p>Controle do combinado</p>
            <h2 id="mudancas-escopo-titulo">Mudanças de escopo</h2>
            <small>Correções de uma entrega continuam na própria tarefa.</small>
          </div>
        </div>
        <div className={styles.resumo}>
          <span>
            {mudancas.length} {mudancas.length === 1 ? 'registro' : 'registros'}
          </span>
          {adicionaisAprovados > 0 && (
            <strong>+ {formatarReais(adicionaisAprovados)} aprovados</strong>
          )}
        </div>
      </header>

      {ativa ? (
        <div className={styles.pedidoAtivo}>
          <div className={styles.pedidoTexto}>
            <span>
              <Clock3 size={14} /> Pedido do cliente
            </span>
            <h3>{ativa.titulo}</h3>
            <p>{ativa.descricao}</p>
          </div>
          <AnaliseMudanca projetoId={projetoId} mudanca={ativa} />
        </div>
      ) : aguardando ? (
        <div className={styles.aguardando}>
          <span>
            <Clock3 size={16} aria-hidden="true" />
          </span>
          <div>
            <p>Aguardando decisão do cliente</p>
            <h3>{aguardando.titulo}</h3>
            <small>{aguardando.resposta}</small>
          </div>
          <strong>{resumoImpacto(aguardando)}</strong>
        </div>
      ) : (
        <div className={styles.emDia}>
          <ShieldCheck size={17} aria-hidden="true" />
          <span>
            <strong>O escopo está sob controle.</strong>
            <small>Um novo pedido do cliente aparecerá aqui para análise.</small>
          </span>
        </div>
      )}

      {historico.length > 0 && (
        <ol className={styles.historico} aria-label="Histórico de mudanças de escopo">
          {historico.slice(0, 5).map((mudanca) => (
            <li key={mudanca.id} data-status={mudanca.status}>
              <span className={styles.estadoIcone}>
                {mudanca.status === 'recusada' || mudanca.status === 'cancelada' ? (
                  <X size={14} aria-hidden="true" />
                ) : (
                  <Check size={14} aria-hidden="true" />
                )}
              </span>
              <div>
                <strong>{mudanca.titulo}</strong>
                <small>{mudanca.resposta ?? mudanca.descricao}</small>
              </div>
              <span className={styles.estado}>{ROTULO_STATUS[mudanca.status]}</span>
              {resumoImpacto(mudanca) && <em>{resumoImpacto(mudanca)}</em>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
