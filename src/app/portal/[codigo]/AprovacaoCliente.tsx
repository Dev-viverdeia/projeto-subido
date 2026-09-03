'use client';

import { useActionState, useState } from 'react';
import { ArrowUpRight, Check, FileCheck2, MessageSquareMore } from 'lucide-react';
import { decidirEntregaCliente, type EstadoPortalCliente } from '@/lib/portal-cliente/actions';
import type { TarefaPortalCliente } from '@/lib/portal-cliente/servico';
import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import { TermoEncerramentoPortal } from './TermoEncerramentoPortal';
import styles from './AprovacaoCliente.module.css';

const INICIAL: EstadoPortalCliente = {};

export function AprovacaoCliente({
  codigo,
  tarefa,
  aceiteFinal = false,
  encerramento,
}: {
  codigo: string;
  tarefa: TarefaPortalCliente;
  aceiteFinal?: boolean;
  encerramento?: EncerramentoProjeto | null;
}) {
  const [estado, acao, pendente] = useActionState(decidirEntregaCliente, INICIAL);
  const [modoAjuste, setModoAjuste] = useState(false);
  const [envio, setEnvio] = useState<'ajuste' | 'aprovacao' | null>(null);

  return (
    <article className={styles.aprovacao} data-final={aceiteFinal || undefined}>
      <div className={styles.aprovacaoTopo}>
        <span className={styles.aprovacaoIcone}>
          <FileCheck2 size={19} aria-hidden="true" />
        </span>
        <div>
          <p>{aceiteFinal ? 'Aceite final do projeto' : tarefa.faseTitulo}</p>
          <h3>{tarefa.titulo}</h3>
        </div>
        <span className={styles.aprovacaoSelo}>Aguardando você</span>
      </div>

      <div className={styles.aprovacaoConteudo}>
        {aceiteFinal && encerramento ? (
          <div className={styles.termoAceite}>
            <TermoEncerramentoPortal encerramento={encerramento} compacto />
          </div>
        ) : null}

        <div className={styles.aprovacaoResumo}>
          <div className={styles.validacaoGrid}>
            <section>
              <span>O que você recebeu</span>
              <p className={styles.entregavel}>{tarefa.entregavel}</p>
            </section>
            <div className={styles.criterioAceite}>
              <span>Aprovar quando</span>
              <p>{tarefa.concluidoQuando}</p>
            </div>
          </div>
          {tarefa.clienteNota && <blockquote>{tarefa.clienteNota}</blockquote>}
          {tarefa.entregavelUrl && (
            <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
              Abrir entrega <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
          {aceiteFinal && <small>Esta aprovação confirma o recebimento e conclui o projeto.</small>}
        </div>

        <form action={acao} data-ajuste={modoAjuste || undefined}>
          <input type="hidden" name="codigo" value={codigo} />
          <input type="hidden" name="tarefa" value={tarefa.id} />
          <input type="hidden" name="final" value={aceiteFinal ? 'sim' : 'nao'} />

          {modoAjuste ? (
            <label className={styles.editorAjuste}>
              <span>O que precisa mudar?</span>
              <textarea
                name="comentario"
                maxLength={2000}
                placeholder="Descreva o ajuste para a equipe."
                required
                autoFocus
              />
            </label>
          ) : null}

          {estado.erro && <p role="alert">{estado.erro}</p>}
          {estado.sucesso && <p role="status">{estado.sucesso}</p>}
          {estado.aviso && (
            <p className={styles.avisoAcao} role="status">
              {estado.aviso}
            </p>
          )}

          <div className={styles.aprovacaoAcoes}>
            {modoAjuste ? (
              <>
                <button type="button" onClick={() => setModoAjuste(false)} disabled={pendente}>
                  Voltar
                </button>
                <button
                  type="submit"
                  name="decisao"
                  value="ajustes"
                  className={styles.enviarAjuste}
                  disabled={pendente}
                  onClick={() => setEnvio('ajuste')}
                >
                  <MessageSquareMore size={15} aria-hidden="true" />
                  {pendente && envio === 'ajuste' ? 'Enviando…' : 'Enviar ajuste'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-expanded={modoAjuste}
                  onClick={() => setModoAjuste(true)}
                  disabled={pendente}
                >
                  <MessageSquareMore size={15} aria-hidden="true" /> Pedir ajuste
                </button>
                <button
                  type="submit"
                  name="decisao"
                  value="aprovada"
                  className={styles.aprovar}
                  disabled={pendente}
                  onClick={() => setEnvio('aprovacao')}
                >
                  <Check size={16} aria-hidden="true" />{' '}
                  {pendente && envio === 'aprovacao'
                    ? 'Aprovando…'
                    : aceiteFinal
                      ? 'Aprovar e concluir'
                      : 'Aprovar entrega'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </article>
  );
}
