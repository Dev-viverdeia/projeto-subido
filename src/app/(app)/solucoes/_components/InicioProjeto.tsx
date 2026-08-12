'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  KeyRound,
  Save,
  Video,
} from 'lucide-react';
import { definirPrazoProjeto, type EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_CALL, callPodeAbrir } from '@/lib/calls/tipos';
import styles from './InicioProjeto.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
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
      : `/calls/${kickoff.id}`
    : `/calls?nova=1&oportunidade=${projeto.oportunidadeId}&tipo=kickoff`;

  return (
    <section className={styles.inicio} aria-labelledby="inicio-projeto-titulo">
      <header className={styles.cabecalho}>
        <div>
          <p>Antes de construir</p>
          <h2 id="inicio-projeto-titulo">Prepare o início</h2>
        </div>
        <span>4 decisões para sair do papel</span>
      </header>

      <ol className={styles.passos}>
        <li>
          <span className={styles.numero}>01</span>
          <div className={styles.icone}>
            <ClipboardCheck size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Acordo operacional</p>
            <strong>{briefingConfirmado ? 'Combinado confirmado' : 'Revisar o briefing'}</strong>
            <small>Objetivo, sucesso, responsáveis, acessos e limites em um único lugar.</small>
          </div>
          <a className={styles.acaoSecundaria} href="#briefing-kickoff">
            {briefingConfirmado ? 'Revisar' : 'Completar'}{' '}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </li>

        <li>
          <span className={styles.numero}>02</span>
          <div className={styles.icone}>
            <Video size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Kickoff do projeto</p>
            <strong>{kickoff ? ROTULO_STATUS_CALL[kickoff.status] : 'Ainda não agendado'}</strong>
            <small>
              {kickoff
                ? DATA_HORA.format(new Date(kickoff.agendadaPara)).replace('.', '')
                : 'Alinhe escopo, responsáveis, prazo e acessos.'}
            </small>
          </div>
          <Link className={styles.acaoSecundaria} href={hrefKickoff}>
            {kickoff ? (kickoffPodeAbrir ? 'Abrir sala' : 'Ver registro') : 'Agendar kickoff'}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </li>

        <li>
          <span className={styles.numero}>03</span>
          <div className={styles.icone}>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Prazo da entrega</p>
            <strong>{projeto.prazoEm ? 'Prazo definido' : 'Defina uma data realista'}</strong>
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
            {projeto.prazoEm ? <Check size={14} aria-label="Definido" /> : 'Pendente'}
          </span>
        </li>

        <li className={styles.primeiroPasso}>
          <span className={styles.numero}>04</span>
          <div className={styles.icone}>
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className={styles.conteudo}>
            <p>Primeiro passo executável</p>
            <strong>{primeiraTarefa || 'Revise o escopo do projeto'}</strong>
            <small>Abra o método e registre a evidência conforme executar.</small>
          </div>
          <button type="button" className={styles.acaoPrincipal} onClick={onComecar}>
            Começar agora <ArrowRight size={15} aria-hidden="true" />
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
