'use client';

import { useActionState, useState, useTransition } from 'react';
import { ArrowRight, Check, Clock3, FileDiff, Plus, X } from 'lucide-react';
import {
  decidirMudancaEscopoCliente,
  solicitarMudancaEscopoCliente,
  type EstadoPortalCliente,
} from '@/lib/portal-cliente/actions';
import type { MudancaEscopoProjeto } from '@/lib/projetos-execucao/queries';
import { formatarReais } from '@/lib/propostas/schema';
import styles from './MudancaEscopoPortal.module.css';

const INICIAL: EstadoPortalCliente = {};

function impacto(mudanca: MudancaEscopoProjeto) {
  const partes: string[] = [];
  if ((mudanca.impactoPrazoDias ?? 0) > 0) {
    partes.push(`+${mudanca.impactoPrazoDias} ${mudanca.impactoPrazoDias === 1 ? 'dia' : 'dias'}`);
  }
  if ((mudanca.impactoValorCentavos ?? 0) > 0) {
    partes.push(formatarReais(mudanca.impactoValorCentavos));
  }
  return partes;
}

export function DecisaoMudancaEscopo({
  codigo,
  mudanca,
}: {
  codigo: string;
  mudanca: MudancaEscopoProjeto;
}) {
  const [estado, decidir, pendente] = useActionState(decidirMudancaEscopoCliente, INICIAL);
  const impactos = impacto(mudanca);

  return (
    <article className={styles.decisao} aria-labelledby={`mudanca-${mudanca.id}`}>
      <header>
        <span>
          <FileDiff size={17} aria-hidden="true" />
        </span>
        <div>
          <p>Mudança no combinado</p>
          <h3 id={`mudanca-${mudanca.id}`}>{mudanca.titulo}</h3>
        </div>
        <em>Sua decisão</em>
      </header>
      <div className={styles.decisaoCorpo}>
        <div>
          <p>{mudanca.descricao}</p>
          {mudanca.resposta && <blockquote>{mudanca.resposta}</blockquote>}
        </div>
        <form action={decidir}>
          <input type="hidden" name="codigo" value={codigo} />
          <input type="hidden" name="mudanca" value={mudanca.id} />
          <dl>
            <div>
              <dt>Prazo</dt>
              <dd>{impactos.find((item) => item.startsWith('+')) ?? 'Sem alteração'}</dd>
            </div>
            <div>
              <dt>Valor adicional</dt>
              <dd>{impactos.find((item) => item.startsWith('R$')) ?? 'Sem alteração'}</dd>
            </div>
          </dl>
          <small>O projeto original continua igual se você não aprovar.</small>
          {(estado.erro || estado.sucesso || estado.aviso) && (
            <div className={styles.retorno} role="status">
              {estado.erro && <p data-erro>{estado.erro}</p>}
              {estado.sucesso && <p>{estado.sucesso}</p>}
              {estado.aviso && <small>{estado.aviso}</small>}
            </div>
          )}
          <div className={styles.acoesDecisao}>
            <button type="submit" name="decisao" value="recusada" disabled={pendente}>
              Manter o combinado
            </button>
            <button
              type="submit"
              name="decisao"
              value="aprovada"
              className={styles.aprovar}
              disabled={pendente}
            >
              {pendente ? 'Registrando…' : 'Aprovar mudança'}
              {!pendente && <ArrowRight size={15} aria-hidden="true" />}
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

export function ControleEscopoPortal({
  codigo,
  mudancas,
}: {
  codigo: string;
  mudancas: MudancaEscopoProjeto[];
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<EstadoPortalCliente>(INICIAL);
  const [pendente, iniciarTransicao] = useTransition();
  const ativa = mudancas.find((item) => ['em_analise', 'aguardando_cliente'].includes(item.status));
  const historico = mudancas.filter(
    (item) => !['em_analise', 'aguardando_cliente'].includes(item.status),
  );

  function abrirPedido() {
    setEstado(INICIAL);
    setAberto(true);
  }

  function solicitar(formData: FormData) {
    iniciarTransicao(async () => {
      const resultado = await solicitarMudancaEscopoCliente(INICIAL, formData);
      setEstado(resultado);
      if (resultado.sucesso) setAberto(false);
    });
  }

  return (
    <section className={styles.controle} aria-labelledby="controle-escopo-titulo">
      <header>
        <div>
          <p>Escopo do projeto</p>
          <h2 id="controle-escopo-titulo">Mudou alguma coisa?</h2>
          <span>
            Use este espaço para pedir algo que altera o combinado geral. Para corrigir uma entrega,
            responda na própria validação.
          </span>
        </div>
        {!ativa && (
          <button type="button" onClick={abrirPedido}>
            <Plus size={15} aria-hidden="true" /> Pedir uma mudança
          </button>
        )}
      </header>

      {ativa ? (
        <div className={styles.estadoAtivo} data-status={ativa.status}>
          <span>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <div>
            <small>
              {ativa.status === 'em_analise'
                ? 'O responsável está analisando'
                : 'Uma decisão aparece no topo deste portal'}
            </small>
            <strong>{ativa.titulo}</strong>
            <p>
              {ativa.status === 'em_analise'
                ? 'Nada mudou no projeto por enquanto. Você receberá a resposta por aqui.'
                : 'Confira o impacto informado antes de aprovar.'}
            </p>
          </div>
        </div>
      ) : estado.sucesso ? (
        <div className={styles.estadoAtivo} data-status="salvo" role="status">
          <span>
            <Check size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>{estado.sucesso}</strong>
            {estado.aviso && <p>{estado.aviso}</p>}
          </div>
        </div>
      ) : null}

      {historico.length > 0 && (
        <ol className={styles.historico} aria-label="Histórico de mudanças">
          {historico.slice(0, 4).map((mudanca) => (
            <li key={mudanca.id}>
              <span>
                {mudanca.status === 'aprovada' || mudanca.status === 'incluida' ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <X size={14} aria-hidden="true" />
                )}
              </span>
              <div>
                <strong>{mudanca.titulo}</strong>
                <small>
                  {mudanca.status === 'incluida'
                    ? 'Incluída no projeto'
                    : mudanca.status === 'aprovada'
                      ? `Aprovada${impacto(mudanca).length ? ` · ${impacto(mudanca).join(' · ')}` : ''}`
                      : 'O combinado original foi mantido'}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}

      {aberto && (
        <div className={styles.modalFundo} role="presentation" onMouseDown={() => setAberto(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="nova-mudanca-titulo"
            className={styles.modal}
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <header>
              <div>
                <p>Novo pedido</p>
                <h2 id="nova-mudanca-titulo">O que precisa mudar?</h2>
                <span>Nada será alterado antes da análise do responsável.</span>
              </div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar pedido">
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <form action={solicitar}>
              <input type="hidden" name="codigo" value={codigo} />
              <label>
                Resumo do pedido
                <input
                  name="titulo"
                  minLength={3}
                  maxLength={160}
                  required
                  placeholder="Ex.: Incluir atendimento pelo Instagram"
                />
              </label>
              <label>
                Explique a necessidade
                <textarea
                  name="descricao"
                  minLength={10}
                  maxLength={4000}
                  required
                  placeholder="Conte o que mudou e o resultado que você espera."
                />
              </label>
              {estado.erro && (
                <p className={styles.erro} role="alert">
                  {estado.erro}
                </p>
              )}
              <div className={styles.modalAcoes}>
                <button type="button" onClick={() => setAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.aprovar} disabled={pendente}>
                  {pendente ? 'Enviando pedido…' : 'Enviar para análise'}
                  {!pendente && <ArrowRight size={15} aria-hidden="true" />}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
