import Link from 'next/link';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';
import styles from './JornadaEntradaLead.module.css';

export type EstadoContextoLead = 'pendente' | 'processando' | 'pronto' | 'falhou';

export function JornadaEntradaLead({
  oportunidadeId,
  empresaNome,
  dominio,
  linkedin,
  estadoContexto,
  totalCalls,
}: {
  oportunidadeId: string;
  empresaNome: string;
  dominio: string | null;
  linkedin: string | null;
  estadoContexto: EstadoContextoLead;
  totalCalls: number;
}) {
  const contextoPronto = estadoContexto === 'pronto';
  const contextoEmAndamento = estadoContexto === 'processando';
  const callPronta = totalCalls > 0;
  const precisaContexto = estadoContexto === 'pendente' || estadoContexto === 'falhou';
  const etapaAtual = !contextoPronto ? 2 : callPronta ? null : 3;

  return (
    <section className={styles.jornada} aria-labelledby="entrada-lead-titulo">
      <header className={styles.topo}>
        <div>
          <p>Lead adicionado</p>
          <h2 id="entrada-lead-titulo">Prepare a primeira conversa.</h2>
          <span>
            A oportunidade de {empresaNome} já está no CRM. Agora complete o contexto ou crie a
            primeira call.
          </span>
        </div>
        <Link href={`/crm/${oportunidadeId}`}>Continuar depois</Link>
      </header>

      <div className={styles.rodape}>
        <div>
          <strong>
            {precisaContexto
              ? 'Comece pelo contexto que você já possui.'
              : callPronta
                ? 'A preparação inicial está completa.'
                : 'Enquanto a leitura acontece, você já pode preparar a conversa.'}
          </strong>
          <p>Nada se perde: cada etapa alimenta o mesmo histórico comercial.</p>
        </div>
        <div className={styles.acoes}>
          {precisaContexto && (
            <FormularioEnriquecimento
              oportunidadeId={oportunidadeId}
              dominioInicial={dominio}
              linkedinInicial={linkedin}
              temDossie={false}
              rotulo={estadoContexto === 'falhou' ? 'Revisar contexto' : 'Completar contexto'}
            />
          )}
          {!callPronta && (
            <Link
              href={`/calls?nova=1&oportunidade=${oportunidadeId}`}
              className={`via-btn ${precisaContexto ? 'via-btn--secondary' : 'via-btn--primary'} via-btn--md`}
            >
              Agendar primeira call
            </Link>
          )}
          {contextoPronto && callPronta && (
            <Link href={`/crm/${oportunidadeId}`} className="via-btn via-btn--primary via-btn--md">
              Abrir dossiê
            </Link>
          )}
        </div>
      </div>

      <ol className={styles.passos} aria-label="Preparação do novo lead">
        <li data-estado="concluido">
          <span className={styles.numero}>01</span>
          <div>
            <strong>Lead no pipeline</strong>
            <p>Empresa, contato e oportunidade já estão conectados.</p>
          </div>
          <small>Concluído</small>
        </li>
        <li
          data-estado={contextoPronto ? 'concluido' : contextoEmAndamento ? 'processando' : 'atual'}
          aria-current={etapaAtual === 2 ? 'step' : undefined}
        >
          <span className={styles.numero}>02</span>
          <div>
            <strong>Completar contexto</strong>
            <p>Site, histórico e informações que ajudam na abordagem.</p>
          </div>
          <small>
            {contextoPronto
              ? 'Concluído'
              : contextoEmAndamento
                ? 'Em análise'
                : estadoContexto === 'falhou'
                  ? 'Revisar fontes'
                  : 'Próximo'}
          </small>
        </li>
        <li
          data-estado={callPronta ? 'concluido' : etapaAtual === 3 ? 'atual' : 'pendente'}
          aria-current={etapaAtual === 3 ? 'step' : undefined}
        >
          <span className={styles.numero}>03</span>
          <div>
            <strong>Preparar a call</strong>
            <p>Crie o link já conectado ao CRM e ao Live Coach.</p>
          </div>
          <small>{callPronta ? 'Concluído' : 'Pendente'}</small>
        </li>
      </ol>
    </section>
  );
}
