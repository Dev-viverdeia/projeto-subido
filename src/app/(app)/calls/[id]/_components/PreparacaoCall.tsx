import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, AudioLines, ChevronDown, Clock3, Video } from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import { ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { podeAlterarHorario } from '@/lib/calls/agenda-modelo';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import { RoteiroPreparacao } from '@/components/calls/RoteiroPreparacao';
import styles from './PreparacaoCall.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});
const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function PreparacaoCall({ posCall }: { posCall: PosCall }) {
  const { reuniao, preparacao, empresa, contato, oportunidade, sincronizacao } = posCall;
  const plano = preparacao.plano;
  const data = new Date(reuniao.agendadaPara);
  const kickoff = reuniao.tipo === 'kickoff';
  const projeto = sincronizacao.projetoAtivo;

  return (
    <div className={styles.pagina}>
      <nav className={styles.navegacao} aria-label="Preparação da reunião">
        <Link href="/reunioes">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar às reuniões
        </Link>
        <span>
          <time dateTime={reuniao.agendadaPara}>
            {DATA.format(data)} · {HORA.format(data)}
          </time>{' '}
          · Brasília
        </span>
      </nav>
      <header className={styles.cabecalho}>
        <div className={styles.identificacao}>
          <p>{kickoff ? 'Preparar o kickoff' : 'Preparar a reunião'}</p>
          <h1>{reuniao.titulo}</h1>
          <p>
            {empresa.nome}
            {contato ? ` · ${contato.nome}` : ''}
          </p>
          <div className={styles.metadados}>
            <span>
              <Clock3 size={16} aria-hidden="true" />
              {reuniao.duracaoMinutos} min
            </span>
            <span>{ROTULO_TIPO_CALL[reuniao.tipo]}</span>
            <span>Venda: {ROTULO_ETAPA[oportunidade.etapa]}</span>
          </div>
        </div>
        <div className={styles.acoes}>
          <Link href={`/sala/${reuniao.codigoPublico}`} className={styles.entrar}>
            <Video size={19} aria-hidden="true" />
            {kickoff ? 'Entrar no kickoff' : 'Entrar na reunião'}
          </Link>
          <div className={styles.atalhos}>
            <Link href={`/vendas/${oportunidade.id}`}>Ficha do cliente</Link>
            {podeAlterarHorario(reuniao.status) && (
              <Link href={`/reunioes?editar=${reuniao.id}`}>Alterar reunião</Link>
            )}
          </div>
        </div>
      </header>
      <div className={styles.grade}>
        <div className={styles.conducao}>
          <section className={styles.objetivo} aria-labelledby="objetivo-call">
            <p>{kickoff ? 'Acordo que precisa sair da reunião' : 'Objetivo da reunião'}</p>
            <h2 id="objetivo-call">{plano.objetivo}</h2>
          </section>
          <RoteiroPreparacao
            key={reuniao.id}
            plano={{
              abertura: plano.abertura,
              perguntas: plano.perguntas,
              fechamento: plano.fechamento,
            }}
            kickoff={kickoff}
          />
        </div>
        <aside className={styles.cliente} aria-label="Informações do cliente para a reunião">
          <section aria-labelledby="cliente-call">
            <header>
              <h2 id="cliente-call">{kickoff ? 'Base do projeto' : 'Sobre o cliente'}</h2>
              <span>
                {plano.origem === 'enriquecimento' ? 'Ficha enriquecida' : 'Dados da ficha'}
              </span>
            </header>
            {contato?.cargo && (
              <p className={styles.contato}>
                {contato.nome}
                <span>{contato.cargo}</span>
              </p>
            )}
            {plano.fatos.length ? (
              <>
                <ul className={styles.fatos}>
                  {plano.fatos.slice(0, 2).map((fato, i) => (
                    <li key={i}>{fato}</li>
                  ))}
                </ul>
                {plano.fatos.length > 2 && (
                  <details className={styles.detalhe}>
                    <summary>
                      Mais informações <span>{plano.fatos.length - 2}</span>
                      <ChevronDown size={17} aria-hidden="true" />
                    </summary>
                    <ul className={styles.fatos}>
                      {plano.fatos.slice(2).map((fato, i) => (
                        <li key={i}>{fato}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <div className={styles.vazio}>
                <p>
                  {preparacao.temEnriquecimento
                    ? 'Ainda não há informações no roteiro.'
                    : 'A ficha ainda não foi enriquecida.'}
                </p>
                <Link href={`/vendas/${oportunidade.id}`}>
                  {preparacao.temEnriquecimento ? 'Consultar ficha' : 'Enriquecer na ficha'}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
          {plano.hipoteses.length > 0 && (
            <details className={styles.detalhe}>
              <summary>
                {kickoff ? 'Pontos a confirmar' : 'Hipóteses a confirmar'}
                <span>{plano.hipoteses.length}</span>
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <ul className={styles.fatos}>
                {plano.hipoteses.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </details>
          )}
          {plano.projetos.length > 0 && (
            <details className={styles.detalhe}>
              <summary>
                Projetos em análise<span>{plano.projetos.length}</span>
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <p className={styles.apoio}>Valide a necessidade antes de propor.</p>
              <ul className={styles.fatos}>
                {plano.projetos.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </details>
          )}
          {kickoff && projeto && (
            <section className={styles.projeto} aria-label="Continuidade do kickoff">
              <h2>Projeto em execução</h2>
              <p>{projeto.titulo}</p>
              <Link href={`/entregas/${projeto.id}`}>
                Abrir projeto
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </section>
          )}
          {reuniao.liveCoachAtivo && (
            <p className={styles.coach}>
              <AudioLines size={18} aria-hidden="true" />
              Live Coach ativado para esta reunião
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
