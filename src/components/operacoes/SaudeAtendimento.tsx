import Link from 'next/link';
import {
  Bot,
  Inbox,
  Send,
  CheckCheck,
  CircleHelp,
  TriangleAlert,
  ArrowUpRight,
  ChevronDown,
  Activity,
} from 'lucide-react';
import {
  avaliarAtendimento,
  ESTADOS_ATENDIMENTO,
  type EstadoAtendimento,
  type ResumoAtendimento,
} from '@/lib/operacoes/atendimento';
import s from './saude.module.css';

const data = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});
function Sinal({ nivel }: { nivel: EstadoAtendimento }) {
  return (
    <span className={s.estado} data-nivel={nivel}>
      {nivel === 'normal' ? (
        <CheckCheck size={17} aria-hidden />
      ) : nivel === 'desconhecido' ? (
        <CircleHelp size={17} aria-hidden />
      ) : (
        <TriangleAlert size={17} aria-hidden />
      )}
      {ESTADOS_ATENDIMENTO[nivel]}
    </span>
  );
}
export function SaudeAtendimento({ resumo }: { resumo: ResumoAtendimento | null }) {
  const saude = avaliarAtendimento(resumo);
  return (
    <section className={s.secao} aria-labelledby="saude-atendimento">
      <header className={s.cabecalho}>
        <div>
          <h2 id="saude-atendimento">IA e suporte</h2>
          <p>
            {resumo ? (
              <>
                Consultado às{' '}
                <time dateTime={resumo.verificado_em}>
                  {data.format(new Date(resumo.verificado_em))}
                </time>{' '}
                · Brasília
              </>
            ) : (
              'Não foi possível consultar os indicadores.'
            )}
          </p>
        </div>
        <Link className={s.link} href="/suporte/equipe">
          Painel de suporte <ArrowUpRight size={18} aria-hidden />
        </Link>
      </header>
      {!resumo ? (
        <div className={s.indisponivel} role="status">
          <CircleHelp size={24} aria-hidden />
          <div>
            <h3>O status ainda não foi confirmado.</h3>
            <p>Atualize o painel. Nenhuma execução foi alterada.</p>
          </div>
        </div>
      ) : (
        <>
          <div className={s.grade}>
            <article className={s.card} data-nivel={saude.ia}>
              <header>
                <Bot size={24} aria-hidden />
                <h3>Sobral AI</h3>
              </header>
              <Sinal nivel={saude.ia} />
              <div className={s.dado}>
                <strong>{resumo.ia.ativas}</strong>
                <span>respostas em andamento</span>
              </div>
              <p className={s.resumo}>
                {resumo.ia.expiradas
                  ? `${resumo.ia.expiradas} sem conclusão após o prazo.`
                  : resumo.ia.falhas
                    ? `${resumo.ia.falhas} perguntas recentes com falha.`
                    : resumo.ia.interrompidas
                      ? `${resumo.ia.interrompidas} respostas recentes interrompidas.`
                      : resumo.ia.concluidas
                        ? `${resumo.ia.concluidas} concluídas · perguntas das últimas 24h.`
                        : 'Sem conclusões para perguntas das últimas 24h.'}
              </p>
              <details className={s.detalhes}>
                <summary>
                  Ver diagnóstico <ChevronDown size={16} aria-hidden />
                </summary>
                <div>
                  <dl>
                    <div>
                      <dt>Sem conclusão no prazo</dt>
                      <dd>{resumo.ia.expiradas}</dd>
                    </div>
                    <div>
                      <dt>Com falha · 24h</dt>
                      <dd>{resumo.ia.falhas}</dd>
                    </div>
                    <div>
                      <dt>Interrompidas · 24h</dt>
                      <dd>{resumo.ia.interrompidas}</dd>
                    </div>
                  </dl>
                  <p>
                    Em falhas repetidas, confira a conexão com o provedor de IA e os logs da
                    aplicação. A pergunta continua salva; o usuário pode tentar novamente na
                    conversa.
                  </p>
                  <p>
                    Paradas solicitadas pelo usuário não entram nos alertas. Contagem da última
                    tentativa por pergunta.
                  </p>
                </div>
              </details>
            </article>
            <article className={s.card} data-nivel={saude.entrada}>
              <header>
                <Inbox size={24} aria-hidden />
                <h3>E-mails recebidos</h3>
              </header>
              <Sinal nivel={saude.entrada} />
              <div className={s.dado}>
                <strong>{resumo.entrada.aguardando}</strong>
                <span>aguardando processamento</span>
              </div>
              <p className={s.resumo}>
                {resumo.entrada.atrasadas
                  ? `${resumo.entrada.atrasadas} aguardam há mais de 5 minutos.`
                  : resumo.entrada.revisao
                    ? `${resumo.entrada.revisao} precisam de revisão da equipe.`
                    : resumo.entrada.falhas
                      ? `${resumo.entrada.falhas} recebimentos com falha.`
                      : saude.verificacoes[0]?.nivel !== 'normal'
                        ? 'Confira a rotina de recebimento nas verificações abaixo.'
                        : `${resumo.entrada.concluidas} incorporados · recebidos nas últimas 24h.`}
              </p>
              <Link className={s.acao} href="/suporte/equipe">
                Conferir recebimentos <ArrowUpRight size={17} aria-hidden />
              </Link>
            </article>
            <article className={s.card} data-nivel={saude.saida}>
              <header>
                <Send size={24} aria-hidden />
                <h3>Respostas por e-mail</h3>
              </header>
              <Sinal nivel={saude.saida} />
              <div className={s.dado}>
                <strong>{resumo.saida.aguardando}</strong>
                <span>aguardando envio</span>
              </div>
              <p className={s.resumo}>
                {resumo.saida.atrasadas
                  ? `${resumo.saida.atrasadas} aguardam há mais de 5 minutos.`
                  : resumo.saida.sem_confirmacao + resumo.saida.devolvidas
                    ? `${resumo.saida.sem_confirmacao + resumo.saida.devolvidas} envios precisam de conferência.`
                    : resumo.saida.falhas
                      ? `${resumo.saida.falhas} envios com falha.`
                      : saude.verificacoes[1]?.nivel !== 'normal'
                        ? 'Confira a rotina de envio nas verificações abaixo.'
                        : `${resumo.saida.entregues} entregues · pedidos das últimas 24h.`}
              </p>
              <details className={s.detalhes}>
                <summary>
                  Ver entregas <ChevronDown size={16} aria-hidden />
                </summary>
                <div>
                  <dl>
                    <div>
                      <dt>Aceitos, sem recibo de entrega · 24h</dt>
                      <dd>{resumo.saida.aceitas}</dd>
                    </div>
                    <div>
                      <dt>Entregues · 24h</dt>
                      <dd>{resumo.saida.entregues}</dd>
                    </div>
                    <div>
                      <dt>Devolvidos · 24h</dt>
                      <dd>{resumo.saida.devolvidas}</dd>
                    </div>
                    <div>
                      <dt>Envios expirados · 24h</dt>
                      <dd>{resumo.saida.sem_confirmacao}</dd>
                    </div>
                    <div>
                      <dt>Com falha na fila atual</dt>
                      <dd>{resumo.saida.falhas}</dd>
                    </div>
                  </dl>
                  <p>
                    Não reenvie uma mensagem expirada sem conferir o recebimento. Aceite pelo
                    provedor não confirma entrega. A janela de 24h considera a criação do pedido,
                    não o horário da entrega.
                  </p>
                  <Link className={s.link} href="/suporte/equipe">
                    Conferir atendimentos <ArrowUpRight size={17} aria-hidden />
                  </Link>
                </div>
              </details>
            </article>
          </div>
          <details className={s.rotinas} id="verificacoes-suporte">
            <summary>
              <Activity size={20} aria-hidden />
              <span>Verificações automáticas</span>
              <span className={s.contagem}>
                {saude.verificacoes.filter((p) => p.nivel !== 'normal').length
                  ? `${saude.verificacoes.filter((p) => p.nivel !== 'normal').length} para conferir`
                  : 'Em dia'}
              </span>
              <ChevronDown size={18} aria-hidden />
            </summary>
            <div className={s.verificacoes}>
              {saude.verificacoes.map((p) => (
                <div className={s.verificacao} key={p.fase}>
                  <div>
                    <strong>{p.nome}</strong>
                    <span>
                      {!p.conferido
                        ? 'Aguardando a primeira confirmação.'
                        : p.atrasado
                          ? 'Sem verificação recente. Confira o agendamento da rotina.'
                          : p.falhas
                            ? `${p.falhas} falha(s) seguida(s). Confira os logs desta rotina.`
                            : `Conferido às ${data.format(new Date(p.conferido))} · Brasília`}
                    </span>
                  </div>
                  <Sinal nivel={p.nivel} />
                </div>
              ))}
              <p>
                Rotinas a cada minuto. Alerta após 5 minutos sem confirmação ou uma falha; ação
                necessária após 10 minutos ou 3 falhas seguidas. Este painel não reinicia execuções.
              </p>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
