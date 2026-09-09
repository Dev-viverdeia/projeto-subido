'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  FileCheck2,
  MessageSquareMore,
} from 'lucide-react';
import { decidirEntregaCliente } from '@/lib/portal-cliente/actions';
import type { ArquivoPortalCliente, TarefaPortalCliente } from '@/lib/portal-cliente/servico';
import { useFormularioEntrega } from '@/lib/projetos-execucao/use-formulario-entrega';
import { RetornoOperacao } from '@/app/(app)/_components/RetornoOperacao';
import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import { TermoEncerramentoPortal } from './TermoEncerramentoPortal';
import styles from './AprovacaoCliente.module.css';

export function AprovacaoCliente({
  codigo,
  tarefa,
  aceiteFinal = false,
  encerramento,
  arquivos = [],
}: {
  codigo: string;
  tarefa: TarefaPortalCliente;
  aceiteFinal?: boolean;
  encerramento?: EncerramentoProjeto | null;
  arquivos?: ArquivoPortalCliente[];
}) {
  const { estado, enviar, editar, pendente, bloqueado, operacao } =
    useFormularioEntrega(decidirEntregaCliente);
  const [modoAjuste, setModoAjuste] = useState(false);
  const [comentario, setComentario] = useState('');

  return (
    <article
      id={`entrega-${tarefa.id}`}
      className={styles.aprovacao}
      data-final={aceiteFinal || undefined}
    >
      <div className={styles.aprovacaoTopo}>
        <span className={styles.aprovacaoIcone}>
          <FileCheck2 size={19} aria-hidden="true" />
        </span>
        <div>
          <p>{aceiteFinal ? 'Aceite final do projeto' : tarefa.faseTitulo}</p>
          <h3>{tarefa.titulo}</h3>
        </div>
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
          {tarefa.clienteNota && (
            <details className={styles.observacao}>
              <summary>
                Observação do profissional <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <blockquote>{tarefa.clienteNota}</blockquote>
            </details>
          )}
          {tarefa.entregavelUrl && (
            <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
              Abrir entrega <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
          {arquivos.length > 0 && (
            <ul className={styles.arquivos} aria-label="Arquivos desta entrega">
              {arquivos.map((arquivo) => (
                <li key={arquivo.id}>
                  <a href={`/portal/${codigo}/arquivos/${arquivo.id}`}>
                    <Download size={17} aria-hidden="true" />
                    <span>
                      {arquivo.titulo} <small>Versão {arquivo.versao}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {aceiteFinal && <small>Esta aprovação confirma o recebimento e conclui o projeto.</small>}
        </div>

        <form
          onSubmit={enviar}
          onChange={editar}
          aria-busy={pendente || undefined}
          data-ajuste={modoAjuste || undefined}
        >
          <input type="hidden" name="codigo" value={codigo} />
          <input type="hidden" name="tarefa" value={tarefa.id} />
          <input type="hidden" name="final" value={aceiteFinal ? 'sim' : 'nao'} />

          {modoAjuste ? (
            <label className={styles.editorAjuste}>
              <span>O que precisa mudar?</span>
              <textarea
                name="comentario"
                value={comentario}
                onChange={(evento) => setComentario(evento.target.value)}
                disabled={pendente}
                minLength={5}
                maxLength={2000}
                placeholder="Descreva o ajuste para a equipe."
                required
                autoFocus
              />
            </label>
          ) : null}

          {estado.erro && (
            <RetornoOperacao tom="erro" titulo="Resposta não confirmada" descricao={estado.erro} />
          )}
          {estado.sucesso && <RetornoOperacao tom="sucesso" titulo={estado.sucesso} />}
          {estado.aviso && (
            <p className={styles.avisoAcao} role="status">
              {estado.aviso}
            </p>
          )}

          {!estado.sucesso && (
            <div className={styles.aprovacaoAcoes}>
              {modoAjuste ? (
                <>
                  <button type="button" onClick={() => setModoAjuste(false)} disabled={bloqueado}>
                    Voltar
                  </button>
                  <button
                    type="submit"
                    name="decisao"
                    value="ajustes"
                    className={styles.enviarAjuste}
                    disabled={bloqueado}
                  >
                    <MessageSquareMore size={15} aria-hidden="true" />
                    {pendente && operacao === 'ajustes' ? 'Enviando…' : 'Enviar ajuste'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-expanded={modoAjuste}
                    onClick={() => setModoAjuste(true)}
                    disabled={bloqueado}
                  >
                    <MessageSquareMore size={15} aria-hidden="true" /> Pedir ajuste
                  </button>
                  <button
                    type="submit"
                    name="decisao"
                    value="aprovada"
                    className={styles.aprovar}
                    disabled={bloqueado}
                  >
                    <Check size={16} aria-hidden="true" />{' '}
                    {pendente && operacao === 'aprovada'
                      ? 'Aprovando…'
                      : aceiteFinal
                        ? 'Aprovar e concluir'
                        : 'Aprovar entrega'}
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </div>
    </article>
  );
}
