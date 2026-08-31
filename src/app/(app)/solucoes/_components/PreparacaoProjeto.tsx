'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  CalendarDays,
  Check,
  ClipboardList,
  KeyRound,
  PencilLine,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import {
  atualizarAcaoPlano,
  salvarDependenciaProjeto,
} from '@/lib/projetos-execucao/plano-actions';
import type { AcaoPlanoProjeto } from '@/lib/projetos-execucao/queries';
import { prazoEstaAtrasado, rotuloPrazoOperacional } from '@/lib/projetos-execucao/prazo';
import styles from './PreparacaoProjeto.module.css';

const INICIAL: EstadoProjetoExecucao = {};
const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

function FormularioDependencia({
  projetoId,
  acao,
}: {
  projetoId: string;
  acao?: AcaoPlanoProjeto;
}) {
  const [estado, salvar, pendente] = useActionState(salvarDependenciaProjeto, INICIAL);
  const sufixo = acao?.id ?? 'nova';

  return (
    <form action={salvar} className={styles.formulario}>
      <input type="hidden" name="projeto" value={projetoId} />
      <input type="hidden" name="acao" value={acao?.id ?? ''} />
      <label htmlFor={`dependencia-titulo-${sufixo}`}>
        O que precisa acontecer
        <input
          id={`dependencia-titulo-${sufixo}`}
          name="titulo"
          defaultValue={acao?.titulo}
          minLength={3}
          maxLength={500}
          required
        />
      </label>
      <div className={styles.camposCurtos}>
        <label htmlFor={`dependencia-categoria-${sufixo}`}>
          Tipo
          <select
            id={`dependencia-categoria-${sufixo}`}
            name="categoria"
            defaultValue={acao?.categoria ?? 'dependencia'}
          >
            <option value="dependencia">Próximo passo</option>
            <option value="acesso">Acesso ou permissão</option>
          </select>
        </label>
        <label htmlFor={`dependencia-responsavel-${sufixo}`}>
          Quem resolve
          <select
            id={`dependencia-responsavel-${sufixo}`}
            name="responsavelTipo"
            defaultValue={acao?.responsavelTipo ?? 'cliente'}
          >
            <option value="cliente">Cliente</option>
            <option value="prestador">Implementação</option>
          </select>
        </label>
        <label htmlFor={`dependencia-prazo-${sufixo}`}>
          Prazo
          <input
            id={`dependencia-prazo-${sufixo}`}
            name="prazo"
            type="date"
            defaultValue={acao?.prazoEm?.slice(0, 10) ?? ''}
          />
        </label>
      </div>
      {estado.erro && <p role="alert">{estado.erro}</p>}
      {estado.sucesso && <p role="status">{estado.sucesso}</p>}
      <button type="submit" disabled={pendente}>
        {pendente ? 'Salvando…' : acao ? 'Salvar ajustes' : 'Adicionar à lista'}
      </button>
    </form>
  );
}

function ItemDependencia({
  projetoId,
  acao,
  portalAtivo,
  portalCodigo,
}: {
  projetoId: string;
  acao: AcaoPlanoProjeto;
  portalAtivo: boolean;
  portalCodigo: string;
}) {
  const [estado, atualizar, pendente] = useActionState(atualizarAcaoPlano, INICIAL);
  const concluida = acao.status === 'concluida';
  const cliente = acao.responsavelTipo === 'cliente';
  const atrasada = !concluida && prazoEstaAtrasado(acao.prazoEm);

  return (
    <li data-concluida={concluida || undefined} data-atrasada={atrasada || undefined}>
      <span className={styles.marcador} aria-hidden="true">
        {concluida ? (
          <Check size={15} />
        ) : acao.categoria === 'acesso' ? (
          <KeyRound size={15} />
        ) : (
          <ClipboardList size={15} />
        )}
      </span>
      <div className={styles.itemConteudo}>
        <div className={styles.itemTitulo}>
          <strong>{acao.titulo}</strong>
          <span>
            {concluida ? 'Concluída' : cliente ? 'Aguardando cliente' : 'Com a implementação'}
          </span>
        </div>
        <div className={styles.metadados}>
          <span>
            {cliente ? <UserRound size={13} /> : <Wrench size={13} />}
            {acao.responsavelNome ?? (cliente ? 'Cliente' : 'Implementação')}
          </span>
          <span>
            <CalendarDays size={13} />
            {acao.prazoEm
              ? atrasada
                ? rotuloPrazoOperacional(acao.prazoEm)
                : DATA.format(new Date(acao.prazoEm))
              : 'Prazo a combinar'}
          </span>
          {cliente &&
            !concluida &&
            (portalAtivo ? (
              <Link href={`/portal/${portalCodigo}`} target="_blank">
                Disponível no portal
              </Link>
            ) : (
              <span>Ative o portal para solicitar</span>
            ))}
        </div>
        {estado.erro && <small role="alert">{estado.erro}</small>}
        {estado.sucesso && <small role="status">{estado.sucesso}</small>}
      </div>
      <div className={styles.itemAcoes}>
        <form action={atualizar}>
          <input type="hidden" name="projeto" value={projetoId} />
          <input type="hidden" name="acao" value={acao.id} />
          <button
            type="submit"
            name="status"
            value={concluida ? 'pendente' : 'concluida'}
            disabled={pendente}
          >
            {concluida ? <RotateCcw size={14} /> : <Check size={14} />}
            {concluida ? 'Reabrir' : 'Concluir'}
          </button>
        </form>
        <details className={styles.edicao}>
          <summary>
            <PencilLine size={14} /> Ajustar
          </summary>
          <div>
            <FormularioDependencia projetoId={projetoId} acao={acao} />
            <form action={atualizar} className={styles.remover}>
              <input type="hidden" name="projeto" value={projetoId} />
              <input type="hidden" name="acao" value={acao.id} />
              <button type="submit" name="status" value="cancelada" disabled={pendente}>
                <Trash2 size={14} /> Remover da lista
              </button>
            </form>
          </div>
        </details>
      </div>
    </li>
  );
}

export function PreparacaoProjeto({
  projetoId,
  acoes,
  portalAtivo,
  portalCodigo,
}: {
  projetoId: string;
  acoes: AcaoPlanoProjeto[];
  portalAtivo: boolean;
  portalCodigo: string;
}) {
  const dependencias = acoes.filter(
    (acao) => ['acesso', 'dependencia'].includes(acao.categoria) && acao.status !== 'cancelada',
  );
  const concluidas = dependencias.filter((acao) => acao.status === 'concluida').length;
  const percentual = dependencias.length ? Math.round((concluidas / dependencias.length) * 100) : 0;

  return (
    <section className={styles.preparacao} aria-labelledby="preparacao-titulo">
      <header>
        <div>
          <p>Preparação do projeto</p>
          <h2 id="preparacao-titulo">O que falta para começar sem bloqueios</h2>
          <span>Cada pendência tem uma pessoa responsável, um prazo e um estado claro.</span>
        </div>
        <div className={styles.progresso} aria-label={`${percentual}% da preparação concluída`}>
          <strong>
            {concluidas}/{dependencias.length}
          </strong>
          <span>resolvidas</span>
          <div aria-hidden="true">
            <i style={{ transform: `scaleX(${percentual / 100})` }} />
          </div>
        </div>
      </header>

      {dependencias.length ? (
        <ol className={styles.lista}>
          {dependencias.map((acao) => (
            <ItemDependencia
              key={acao.id}
              projetoId={projetoId}
              acao={acao}
              portalAtivo={portalAtivo}
              portalCodigo={portalCodigo}
            />
          ))}
        </ol>
      ) : (
        <div className={styles.vazio}>
          <Check size={18} aria-hidden="true" />
          <span>Nenhuma pendência de preparação registrada.</span>
        </div>
      )}

      <details className={styles.nova}>
        <summary>
          <Plus size={15} /> Adicionar pendência
        </summary>
        <FormularioDependencia projetoId={projetoId} />
      </details>
    </section>
  );
}
