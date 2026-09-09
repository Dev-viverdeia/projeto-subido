'use client';

import { useRef, useState, useTransition } from 'react';
import { CalendarPlus, LoaderCircle, Plus } from 'lucide-react';
import { agendarAcompanhamento } from '@/lib/projetos-execucao/gestao-actions';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { PlanoVivo } from './PlanoVivo';
import { EvolucaoProjeto } from './EvolucaoProjeto';
import styles from './GestaoServico.module.css';

export function AcompanhamentoEntrega({ projeto }: { projeto: ProjetoExecucaoCompleto }) {
  const { id: projetoId, acoesPlano: acoes } = projeto;
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string>();
  const [sucesso, setSucesso] = useState<string>();
  const [titulo, setTitulo] = useState('');
  const [prazo, setPrazo] = useState('');
  const [pendente, iniciar] = useTransition();
  const pedidoId = useRef<string | null>(null);
  const enviando = useRef(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const compromissos = acoes.filter((a) => !['acesso', 'dependencia'].includes(a.categoria));
  const pendentes = compromissos.filter((a) => a.status === 'pendente');
  const concluidos = compromissos.filter((a) => a.status === 'concluida');

  function fechar() {
    if (enviando.current) return;
    setAberto(false);
    requestAnimationFrame(() => gatilho.current?.focus());
  }

  function enviar(form: FormData) {
    if (enviando.current) return;
    enviando.current = true;
    pedidoId.current ??= crypto.randomUUID();
    form.set('acao', pedidoId.current);
    form.set('projeto', projetoId);
    setErro(undefined);
    iniciar(async () => {
      try {
        const resposta = await agendarAcompanhamento({}, form);
        if (resposta.erro) {
          setErro(resposta.erro);
          return;
        }
        pedidoId.current = null;
        setSucesso(resposta.sucesso);
        enviando.current = false;
        fechar();
      } catch {
        setErro('Não conseguimos salvar agora. Tente novamente.');
      } finally {
        enviando.current = false;
      }
    });
  }

  return (
    <section className={styles.acompanhamento} aria-label="Acompanhamento recorrente">
      <header className={styles.acompanhamentoTopo}>
        <div>
          <h2>Próximas ações</h2>
          <p>
            {pendentes.length
              ? 'O que você combinou com o cliente.'
              : 'Combine o próximo cuidado com este projeto.'}
          </p>
        </div>
        <button
          ref={gatilho}
          type="button"
          className={styles.primario}
          onClick={() => {
            setErro(undefined);
            setSucesso(undefined);
            setTitulo('');
            setPrazo('');
            pedidoId.current = null;
            setAberto(true);
          }}
        >
          <Plus size={17} aria-hidden="true" />
          Agendar ação
        </button>
      </header>
      {sucesso && (
        <p role="status" className={styles.retorno}>
          {sucesso}
        </p>
      )}
      {pendentes.length ? (
        <PlanoVivo projetoId={projetoId} acoes={acoes} aberto />
      ) : (
        <div className={styles.semAcao}>
          <CalendarPlus size={25} aria-hidden="true" />
          <span>Nenhuma ação agendada.</span>
        </div>
      )}
      {concluidos.length > 0 && (
        <details className={styles.historico}>
          <summary>Ações concluídas · {concluidos.length}</summary>
          <ul>
            {concluidos.map((a) => (
              <li key={a.id}>{a.titulo}</li>
            ))}
          </ul>
        </details>
      )}
      {projeto.encerramento?.status === 'encerrado' && projeto.evolucao && (
        <details className={styles.historico}>
          <summary>Revisão de resultado</summary>
          <EvolucaoProjeto
            projetoId={projeto.id}
            empresa={projeto.empresa}
            encerramento={projeto.encerramento}
            evolucao={projeto.evolucao}
          />
        </details>
      )}
      <ModalOperacao
        open={aberto}
        onClose={fechar}
        title="Agendar próxima ação"
        size="sm"
        blocked={pendente}
      >
        <form action={enviar} className={styles.formulario} aria-busy={pendente}>
          <label className={styles.campo}>
            O que você vai fazer?
            <input
              name="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              disabled={pendente}
              minLength={3}
              maxLength={500}
              required
              placeholder="Ex.: revisar os indicadores com o cliente"
              data-autofocus
            />
          </label>
          <label className={styles.campo}>
            Quando
            <input
              name="prazo"
              type="date"
              value={prazo}
              onChange={(event) => setPrazo(event.target.value)}
              disabled={pendente}
              required
            />
          </label>
          <p className={styles.nota}>
            Fica no seu plano de trabalho. Não envia convite nem mensagem ao cliente.
          </p>
          {erro && (
            <p role="alert" className={styles.erro}>
              {erro}
            </p>
          )}
          <footer className={styles.rodape}>
            <button
              type="button"
              className={styles.secundario}
              disabled={pendente}
              onClick={fechar}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.primario} disabled={pendente}>
              {pendente && (
                <LoaderCircle size={17} className={styles.carregando} aria-hidden="true" />
              )}
              {pendente ? 'Salvando…' : 'Agendar ação'}
            </button>
          </footer>
        </form>
      </ModalOperacao>
    </section>
  );
}
