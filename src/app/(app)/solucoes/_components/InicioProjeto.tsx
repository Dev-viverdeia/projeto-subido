'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  FileSignature,
  KeyRound,
  Save,
  Video,
} from 'lucide-react';
import { definirPrazoProjeto, type EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_CALL, callPodeAbrir } from '@/lib/calls/tipos';
import { formatarReais } from '@/lib/propostas/schema';
import styles from './InicioProjeto.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const DATA_ACEITE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

function dataParaCampo(valor: string | null): string {
  return valor ? new Date(valor).toISOString().slice(0, 10) : '';
}

export function InicioProjeto({
  projeto,
  briefingConfirmado,
  primeiraTarefa,
  onComecar,
}: {
  projeto: ProjetoExecucaoCompleto;
  briefingConfirmado: boolean;
  primeiraTarefa: string | null;
  onComecar: () => void;
}) {
  const [estadoPrazo, definirPrazo, salvandoPrazo] = useActionState(
    definirPrazoProjeto,
    ESTADO_INICIAL,
  );
  const kickoff = projeto.kickoff;
  const kickoffPodeAbrir = kickoff ? callPodeAbrir(kickoff.status) : false;
  const hrefKickoff = kickoff
    ? kickoffPodeAbrir
      ? `/sala/${kickoff.codigoPublico}`
      : `/reunioes/${kickoff.id}`
    : `/reunioes?nova=1&oportunidade=${projeto.oportunidadeId}&tipo=kickoff`;
  const prazoDefinido = Boolean(projeto.prazoEm);
  const prazoLiberado = briefingConfirmado && Boolean(kickoff);
  const preparacaoCompleta = briefingConfirmado && Boolean(kickoff) && prazoDefinido;
  const etapasProntas = [Boolean(kickoff), briefingConfirmado, prazoDefinido].filter(
    Boolean,
  ).length;
  const pendencias = 3 - etapasProntas;
  const etapaAtual = !kickoff
    ? 'kickoff'
    : !briefingConfirmado
      ? 'briefing'
      : !prazoDefinido
        ? 'prazo'
        : 'execucao';

  return (
    <section className={styles.inicio} aria-labelledby="inicio-projeto-titulo">
      <header className={styles.cabecalho}>
        <div>
          <p>Passagem da venda</p>
          <h2 id="inicio-projeto-titulo">Da proposta aprovada à primeira tarefa</h2>
        </div>
        <span>{etapasProntas}/3 etapas prontas</span>
      </header>

      <div className={styles.vendaConfirmada}>
        <span className={styles.iconeVenda} aria-hidden="true">
          <BadgeCheck size={22} strokeWidth={1.7} />
        </span>
        <div className={styles.vendaTexto}>
          <p>Venda confirmada</p>
          <strong>Proposta V{projeto.aceiteVenda.versao.toString().padStart(2, '0')} aceita</strong>
          <small>
            {projeto.aceiteVenda.aceitoPor
              ? `${projeto.aceiteVenda.aceitoPor} aprovou em `
              : 'Aprovação registrada em '}
            {DATA_ACEITE.format(new Date(projeto.aceiteVenda.aceitoEm))}.
          </small>
        </div>
        <dl className={styles.vendaResumo}>
          <div>
            <dt>Cliente</dt>
            <dd>{projeto.empresa}</dd>
          </div>
          <div>
            <dt>Investimento</dt>
            <dd>{formatarReais(projeto.documento.investimento.valorCentavos)}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{projeto.documento.entregaveis.length} itens combinados</dd>
          </div>
        </dl>
        <Link href={`/propostas/${projeto.propostaId}`} className={styles.verProposta}>
          <FileSignature size={15} aria-hidden="true" /> Ver versão aceita
        </Link>
      </div>

      <p className={styles.explicacao}>
        O escopo aprovado já está aqui. Agora alinhe o início do projeto com o cliente e transforme
        o combinado na primeira tarefa.
      </p>

      <ol className={styles.passos}>
        <li
          data-pronto={Boolean(kickoff) || undefined}
          data-atual={etapaAtual === 'kickoff' || undefined}
        >
          <span className={styles.numero}>
            {kickoff ? <Check size={13} aria-label="Concluído" /> : '01'}
          </span>
          <div className={styles.icone}>
            <Video size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Kickoff do projeto</p>
            <strong>{kickoff ? ROTULO_STATUS_CALL[kickoff.status] : 'Ainda não agendado'}</strong>
            <small>
              {kickoff
                ? DATA_HORA.format(new Date(kickoff.agendadaPara)).replace('.', '')
                : 'Abra o projeto com o cliente e alinhe resultado, responsáveis e acessos.'}
            </small>
          </div>
          <Link className={styles.acaoSecundaria} href={hrefKickoff}>
            {kickoff ? (kickoffPodeAbrir ? 'Abrir sala' : 'Ver registro') : 'Agendar kickoff'}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </li>

        <li
          data-pronto={briefingConfirmado || undefined}
          data-atual={etapaAtual === 'briefing' || undefined}
        >
          <span className={styles.numero}>
            {briefingConfirmado ? <Check size={13} aria-label="Concluído" /> : '02'}
          </span>
          <div className={styles.icone}>
            <ClipboardCheck size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Acordo do projeto</p>
            <strong>
              {briefingConfirmado ? 'Combinado confirmado' : 'Revise o que ficou combinado'}
            </strong>
            <small>Resultado, responsáveis, acessos e limites organizados em quatro partes.</small>
          </div>
          {kickoff || briefingConfirmado ? (
            <a className={styles.acaoSecundaria} href="#briefing-kickoff">
              {briefingConfirmado ? 'Revisar acordo' : 'Completar acordo'}
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          ) : (
            <span className={styles.estado}>Depois do kickoff</span>
          )}
        </li>

        <li
          data-pronto={prazoDefinido || undefined}
          data-atual={etapaAtual === 'prazo' || undefined}
        >
          <span className={styles.numero}>
            {prazoDefinido ? <Check size={13} aria-label="Concluído" /> : '03'}
          </span>
          <div className={styles.icone}>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Prazo da entrega</p>
            <strong>
              {projeto.prazoEm
                ? 'Prazo definido'
                : prazoLiberado
                  ? 'Defina uma data realista'
                  : 'Disponível depois do acordo'}
            </strong>
            {prazoLiberado && (
              <form action={definirPrazo} className={styles.formPrazo}>
                <input type="hidden" name="projeto" value={projeto.id} />
                <input
                  type="date"
                  name="prazo"
                  defaultValue={dataParaCampo(projeto.prazoEm)}
                  aria-label="Prazo da entrega"
                  required
                />
                <button type="submit" disabled={salvandoPrazo}>
                  <Save size={14} aria-hidden="true" /> {salvandoPrazo ? 'Salvando…' : 'Salvar'}
                </button>
              </form>
            )}
            {estadoPrazo.erro && (
              <small className={styles.retorno} role="alert">
                {estadoPrazo.erro}
              </small>
            )}
            {estadoPrazo.sucesso && (
              <small className={styles.retorno} role="status">
                {estadoPrazo.sucesso}
              </small>
            )}
          </div>
          <span className={styles.estado} data-pronto={Boolean(projeto.prazoEm) || undefined}>
            {prazoDefinido ? (
              <Check size={14} aria-label="Definido" />
            ) : prazoLiberado ? (
              'Pendente'
            ) : (
              'Depois do acordo'
            )}
          </span>
        </li>

        <li
          className={styles.primeiroPasso}
          data-pronto={preparacaoCompleta || undefined}
          data-atual={etapaAtual === 'execucao' || undefined}
        >
          <span className={styles.numero}>04</span>
          <div className={styles.icone}>
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Primeiro passo executável</p>
            <strong>{primeiraTarefa || 'Revise o escopo do projeto'}</strong>
            <small>
              {preparacaoCompleta
                ? 'Abra o passo a passo e registre o resultado de cada tarefa.'
                : `${pendencias} ${pendencias === 1 ? 'pendência precisa' : 'pendências precisam'} ser resolvida${pendencias === 1 ? '' : 's'} antes de executar.`}
            </small>
          </div>
          <button
            type="button"
            className={styles.acaoPrincipal}
            onClick={onComecar}
            disabled={!preparacaoCompleta}
          >
            {preparacaoCompleta ? 'Abrir primeira tarefa' : 'Conclua a preparação'}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </li>
      </ol>

      <div className={styles.aviso}>
        <KeyRound size={16} strokeWidth={1.8} aria-hidden="true" />
        <p>
          O acordo registra quem autoriza cada acesso e quais permissões serão liberadas. Senhas,
          tokens e chaves continuam sempre fora do projeto.
        </p>
      </div>
    </section>
  );
}
