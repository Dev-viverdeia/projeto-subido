import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, CheckCircle2, Clock3, RefreshCw, TriangleAlert } from 'lucide-react';
import { obterPainelOperacoes, type FiltroOperacoes } from '@/lib/admin/operacoes';
import { tentarNovamenteOperacao } from '@/lib/admin/operacoes-actions';
import type { Json } from '@/lib/supabase/types.generated';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Operações do sistema' };
export const dynamic = 'force-dynamic';

const STATUS_VALIDOS = ['pendente', 'processando', 'concluida', 'falhou', 'cancelada'] as const;
const TIPOS_VALIDOS = ['prospeccao', 'enriquecimento', 'pos_call'] as const;

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function parametro<T extends readonly string[]>(valor: string | string[] | undefined, opcoes: T) {
  return typeof valor === 'string' && opcoes.includes(valor) ? (valor as T[number]) : undefined;
}

function textoTipo(tipo: string) {
  return { prospeccao: 'Prospecção', enriquecimento: 'Enriquecimento', pos_call: 'Pós-reunião' }[
    tipo
  ];
}

function textoStatus(status: string) {
  return {
    pendente: 'Aguardando',
    processando: 'Em andamento',
    concluida: 'Concluída',
    falhou: 'Precisa de atenção',
    cancelada: 'Cancelada',
  }[status];
}

function valorPayload(payload: Json, chave: string) {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') return null;
  const valor = payload[chave];
  return typeof valor === 'string' ? valor : null;
}

function destino(tipo: string, referenciaId: string, payload: Json) {
  if (tipo === 'prospeccao') return `/prospeccao?lista=${referenciaId}`;
  if (tipo === 'pos_call') return `/reunioes/${referenciaId}`;
  const oportunidade = valorPayload(payload, 'oportunidadeId');
  return oportunidade ? `/vendas/${oportunidade}` : null;
}

export default async function OperacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtros: FiltroOperacoes = {
    status: parametro(params.status, STATUS_VALIDOS),
    tipo: parametro(params.tipo, TIPOS_VALIDOS),
  };
  const painel = await obterPainelOperacoes(filtros);

  return (
    <>
      <CabecalhoPagina titulo="Operações do sistema" oculto />
      <main className={styles.pagina}>
        <header className={styles.hero}>
          <div>
            <p>
              <Activity size={14} aria-hidden="true" /> Bastidores da plataforma
            </p>
            <h1>O trabalho continua, mesmo quando uma execução cai.</h1>
            <span>
              Acompanhe buscas, enriquecimentos e análises de reunião. Tentativas transitórias são
              retomadas automaticamente.
            </span>
          </div>
          <div className={styles.sinal} data-ok={painel.resumo.falhas24h === 0}>
            <span>Saúde nas últimas 24h</span>
            <strong>{painel.resumo.falhas24h === 0 ? 'Tudo certo' : 'Revisar falhas'}</strong>
          </div>
        </header>

        <section className={styles.indicadores} aria-label="Resumo operacional">
          <article>
            <Clock3 size={18} aria-hidden="true" />
            <span>Agora</span>
            <strong>{painel.resumo.emAndamento}</strong>
            <small>aguardando ou em andamento</small>
          </article>
          <article>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Últimas 24h</span>
            <strong>{painel.resumo.concluidas24h}</strong>
            <small>operações concluídas</small>
          </article>
          <article>
            <RefreshCw size={18} aria-hidden="true" />
            <span>Recuperação automática</span>
            <strong>{painel.resumo.retomadas24h}</strong>
            <small>precisaram de nova tentativa</small>
          </article>
          <article data-alerta={painel.resumo.falhas24h > 0}>
            <TriangleAlert size={18} aria-hidden="true" />
            <span>Últimas 24h</span>
            <strong>{painel.resumo.falhas24h}</strong>
            <small>não concluídas após as tentativas</small>
          </article>
        </section>

        <section className={styles.painel} aria-labelledby="titulo-fila-operacional">
          <header>
            <div>
              <p>Histórico recente</p>
              <h2 id="titulo-fila-operacional">O que o sistema está processando?</h2>
            </div>
            <form action="/admin/operacoes" method="get" className={styles.filtros}>
              <label>
                <span className="sr-only">Tipo de operação</span>
                <select name="tipo" defaultValue={filtros.tipo ?? ''}>
                  <option value="">Todos os tipos</option>
                  <option value="prospeccao">Prospecção</option>
                  <option value="enriquecimento">Enriquecimento</option>
                  <option value="pos_call">Pós-reunião</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Estado da operação</span>
                <select name="status" defaultValue={filtros.status ?? ''}>
                  <option value="">Todos os estados</option>
                  <option value="pendente">Aguardando</option>
                  <option value="processando">Em andamento</option>
                  <option value="concluida">Concluídas</option>
                  <option value="falhou">Precisam de atenção</option>
                </select>
              </label>
              <button type="submit">Aplicar</button>
            </form>
          </header>

          {painel.operacoes.length ? (
            <div className={styles.lista}>
              {painel.operacoes.map((operacao) => {
                const href = destino(operacao.tipo, operacao.referencia_id, operacao.payload);
                return (
                  <article key={operacao.id}>
                    <div className={styles.identidade}>
                      <span className={styles.tipo}>{textoTipo(operacao.tipo)}</span>
                      <strong>{operacao.conta}</strong>
                      <small>{DATA.format(new Date(operacao.criado_em))}</small>
                    </div>
                    <div className={styles.estado} data-status={operacao.status}>
                      <span>{textoStatus(operacao.status)}</span>
                      <small>
                        {operacao.tentativas}/{operacao.max_tentativas}{' '}
                        {operacao.max_tentativas === 1 ? 'tentativa' : 'tentativas'}
                      </small>
                    </div>
                    <div className={styles.detalhe}>
                      {operacao.erro_mensagem ? (
                        <p>{operacao.erro_mensagem}</p>
                      ) : (
                        <p>
                          {operacao.status === 'concluida'
                            ? 'Resultado salvo e disponível para o usuário.'
                            : 'O sistema cuida das próximas tentativas automaticamente.'}
                        </p>
                      )}
                    </div>
                    <div className={styles.acoes}>
                      {href ? <Link href={href}>Abrir no produto</Link> : null}
                      {operacao.tipo === 'pos_call' && operacao.status === 'falhou' ? (
                        <form action={tentarNovamenteOperacao}>
                          <input type="hidden" name="operacao" value={operacao.id} />
                          <button type="submit">Tentar novamente</button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.vazio}>
              <CheckCircle2 size={24} aria-hidden="true" />
              <strong>Nada para mostrar com estes filtros.</strong>
              <span>Quando uma operação entrar na fila, ela aparecerá aqui.</span>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
