'use client';

import { useRef, useState, useTransition } from 'react';
import { Check, ChevronDown, LoaderCircle, PackageCheck, Repeat2, RotateCcw } from 'lucide-react';
import { gerenciarEntrega } from '@/lib/projetos-execucao/gestao-actions';
import {
  estaEmAcompanhamento,
  rotuloGestao,
  type TipoServico,
} from '@/lib/projetos-execucao/gestao';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { ModalOperacao } from '../../_components/ModalOperacao';
import styles from './GestaoServico.module.css';

type Acao = 'tipo' | 'concluir' | 'reabrir' | 'encerrar_recorrencia' | 'retomar_recorrencia';
const TITULOS: Record<Acao, string> = {
  tipo: 'Como você entrega este projeto?',
  concluir: 'Concluir esta entrega?',
  reabrir: 'Retomar a execução?',
  encerrar_recorrencia: 'Encerrar o acompanhamento?',
  retomar_recorrencia: 'Retomar o acompanhamento?',
};
const BOTOES: Record<Acao, string> = {
  tipo: 'Salvar tipo de projeto',
  concluir: 'Concluir entrega',
  reabrir: 'Reabrir execução',
  encerrar_recorrencia: 'Encerrar acompanhamento',
  retomar_recorrencia: 'Retomar acompanhamento',
};

export function GestaoServico({
  projeto,
  onConcluir,
}: {
  projeto: ProjetoExecucaoCompleto;
  onConcluir: () => void;
}) {
  const [acao, setAcao] = useState<Acao | null>(null);
  const [tipo, setTipo] = useState<TipoServico>(projeto.tipoServico ?? 'pontual');
  const [erro, setErro] = useState<string>();
  const [sucesso, setSucesso] = useState<string>();
  const [pendente, iniciar] = useTransition();
  const enviando = useRef(false);
  const faixa = useRef<HTMLElement>(null);
  const gatilho = useRef<HTMLButtonElement | null>(null);
  const concluido = projeto.status === 'concluido';
  const recorrente = projeto.tipoServico === 'recorrente';
  const acompanhando = estaEmAcompanhamento(projeto);
  const tarefasPendentes = projeto.tarefas.filter((t) => t.status !== 'concluida').length;
  const validacoes = projeto.tarefas.filter((t) =>
    ['aguardando', 'ajustes'].includes(t.clienteStatus),
  ).length;
  const compromissos = projeto.acoesPlano.filter((a) => a.status === 'pendente').length;
  const temPendencias = tarefasPendentes + validacoes + compromissos > 0;

  function abrir(proxima: Acao) {
    if (enviando.current) return;
    setTipo(projeto.tipoServico ?? 'pontual');
    setErro(undefined);
    setSucesso(undefined);
    setAcao(proxima);
  }

  function fechar() {
    if (enviando.current) return;
    setAcao(null);
    requestAnimationFrame(() => {
      const alvo = gatilho.current?.isConnected
        ? gatilho.current
        : faixa.current?.querySelector('button');
      alvo?.focus();
    });
  }

  function enviar(form: FormData) {
    if (enviando.current || !acao) return;
    enviando.current = true;
    setErro(undefined);
    const operacao = acao;
    form.set('projeto', projeto.id);
    form.set('atualizadoEm', projeto.atualizadoEm);
    form.set('acao', acao === 'tipo' ? tipo : acao);
    iniciar(async () => {
      try {
        const resultado = await gerenciarEntrega({}, form);
        if (resultado.erro) {
          setErro(resultado.erro);
          return;
        }
        setSucesso(resultado.sucesso);
        enviando.current = false;
        fechar();
        if (operacao === 'concluir') onConcluir();
      } catch {
        setErro('A conexão falhou. Tente novamente.');
      } finally {
        enviando.current = false;
      }
    });
  }

  return (
    <>
      <section
        ref={faixa}
        className={styles.faixa}
        aria-label="Gestão da entrega"
        data-concluido={concluido || undefined}
      >
        <div className={styles.situacao}>
          <span className={styles.icone} aria-hidden="true">
            {acompanhando ? (
              <Repeat2 size={21} />
            ) : concluido ? (
              <Check size={21} />
            ) : (
              <PackageCheck size={21} />
            )}
          </span>
          <div>
            <strong>{rotuloGestao(projeto)}</strong>
            <span>
              {acompanhando
                ? 'A entrega terminou. O cuidado continua.'
                : concluido
                  ? 'Arquivos e histórico continuam disponíveis.'
                  : 'Você define quando a entrega está pronta.'}
            </span>
          </div>
        </div>
        <div className={styles.acoes}>
          <button
            className={styles.secundario}
            type="button"
            onClick={(event) => {
              gatilho.current = event.currentTarget;
              abrir('tipo');
            }}
          >
            {concluido ? 'Gerenciar' : recorrente ? 'Recorrente' : 'Pontual'}{' '}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {!concluido && (
            <button
              className={styles.primario}
              type="button"
              onClick={(event) => {
                gatilho.current = event.currentTarget;
                abrir('concluir');
              }}
            >
              <Check size={17} aria-hidden="true" />
              Concluir entrega
            </button>
          )}
          {acompanhando && (
            <button
              className={styles.secundario}
              type="button"
              onClick={(event) => {
                gatilho.current = event.currentTarget;
                abrir('encerrar_recorrencia');
              }}
            >
              Encerrar acompanhamento
            </button>
          )}
        </div>
      </section>
      {sucesso && (
        <p className={styles.retorno} role="status">
          {sucesso}
        </p>
      )}
      <ModalOperacao
        open={acao !== null}
        onClose={fechar}
        title={acao ? TITULOS[acao] : ''}
        size="sm"
        blocked={pendente}
      >
        {acao && (
          <form action={enviar} className={styles.formulario} aria-busy={pendente}>
            {acao === 'tipo' ? (
              <>
                <fieldset className={styles.tipos} disabled={pendente}>
                  <legend>Tipo de projeto</legend>
                  {(['pontual', 'recorrente'] as const).map((opcao) => (
                    <label key={opcao} data-selecionado={tipo === opcao || undefined}>
                      <input
                        type="radio"
                        name="tipo"
                        value={opcao}
                        checked={tipo === opcao}
                        onChange={() => setTipo(opcao)}
                      />
                      {opcao === 'pontual' ? (
                        <PackageCheck size={23} aria-hidden="true" />
                      ) : (
                        <Repeat2 size={23} aria-hidden="true" />
                      )}
                      <strong>{opcao === 'pontual' ? 'Pontual' : 'Recorrente'}</strong>
                      <span>
                        {opcao === 'pontual'
                          ? 'Entregar e concluir.'
                          : 'Entregar e continuar acompanhando.'}
                      </span>
                    </label>
                  ))}
                </fieldset>
                {concluido && tipo !== projeto.tipoServico && (
                  <p>
                    {tipo === 'recorrente'
                      ? 'O projeto volta ao acompanhamento, sem reabrir a execução.'
                      : 'O projeto fica em Concluídas e sai do acompanhamento.'}
                  </p>
                )}
                {concluido && (
                  <div className={styles.opcoesGestao}>
                    <button
                      type="button"
                      className={styles.secundario}
                      onClick={() => abrir('reabrir')}
                      disabled={pendente}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                      Reabrir execução
                    </button>
                    {recorrente && !acompanhando && (
                      <button
                        type="button"
                        className={styles.secundario}
                        onClick={() => abrir('retomar_recorrencia')}
                        disabled={pendente}
                      >
                        Retomar acompanhamento
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p>
                  {acao === 'concluir'
                    ? recorrente
                      ? 'A execução será concluída. O projeto continua nos recorrentes.'
                      : 'O projeto vai para Concluídas. Você pode reabri-lo depois.'
                    : acao === 'reabrir'
                      ? 'O projeto volta à fila de execução. Os registros anteriores serão preservados.'
                      : acao === 'encerrar_recorrencia'
                        ? 'O projeto sai dos recorrentes e fica em Concluídas. Nenhum registro será apagado.'
                        : 'O projeto volta aos recorrentes. A entrega e o histórico continuam preservados.'}
                </p>
                {(acao === 'concluir' || acao === 'encerrar_recorrencia') && temPendencias && (
                  <div className={styles.pendencias}>
                    <strong>Ainda há itens em aberto</strong>
                    <span>
                      {tarefasPendentes} tarefas · {validacoes} validações · {compromissos}{' '}
                      compromissos
                    </span>
                    <label>
                      <input
                        type="checkbox"
                        name="confirmarPendencias"
                        value="sim"
                        required
                        disabled={pendente}
                      />
                      <span>
                        {acao === 'concluir'
                          ? 'Entreguei o projeto e estou ciente das pendências.'
                          : 'Quero encerrar o acompanhamento mesmo assim.'}
                      </span>
                    </label>
                  </div>
                )}
                {acao === 'concluir' && (
                  <p className={styles.nota}>
                    As tarefas não serão marcadas como feitas. O aceite do cliente continua
                    separado.
                  </p>
                )}
              </>
            )}
            {erro && (
              <p className={styles.erro} role="alert">
                {erro}
              </p>
            )}
            <footer className={styles.rodape}>
              <button
                className={styles.secundario}
                type="button"
                onClick={fechar}
                disabled={pendente}
              >
                Cancelar
              </button>
              <button className={styles.primario} type="submit" disabled={pendente}>
                {pendente && (
                  <LoaderCircle className={styles.carregando} size={17} aria-hidden="true" />
                )}
                {pendente ? 'Salvando…' : BOTOES[acao]}
              </button>
            </footer>
          </form>
        )}
      </ModalOperacao>
    </>
  );
}
