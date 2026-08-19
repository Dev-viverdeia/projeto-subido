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
  projetoSlug = null,
}: {
  oportunidadeId: string;
  empresaNome: string;
  dominio: string | null;
  linkedin: string | null;
  estadoContexto: EstadoContextoLead;
  totalCalls: number;
  projetoSlug?: string | null;
}) {
  const contextoPronto = estadoContexto === 'pronto';
  const contextoEmAndamento = estadoContexto === 'processando';
  const callPronta = totalCalls > 0;
  const precisaContexto = estadoContexto === 'pendente' || estadoContexto === 'falhou';
  const etapaAtual = !contextoPronto ? 2 : callPronta ? null : 3;
  const propostaPronta = Boolean(projetoSlug && contextoPronto && callPronta);
  const destinoProposta = projetoSlug
    ? `/propostas/nova?oportunidade=${oportunidadeId}&projeto=${encodeURIComponent(projetoSlug)}`
    : null;

  return (
    <section className={styles.jornada} aria-labelledby="entrada-lead-titulo">
      <header className={styles.topo}>
        <div>
          <p>Oportunidade adicionada</p>
          <h2 id="entrada-lead-titulo">
            {projetoSlug
              ? 'Pesquise a empresa e prepare a proposta.'
              : 'Prepare a primeira conversa.'}
          </h2>
          <span>
            A oportunidade de {empresaNome} já está no CRM. Agora pesquise a empresa ou agende a
            primeira call.
          </span>
        </div>
        <Link href={`/crm/${oportunidadeId}`}>Continuar depois</Link>
      </header>

      <div className={styles.rodape}>
        <div>
          <strong>
            {precisaContexto
              ? 'Comece pelas informações que você já possui.'
              : callPronta
                ? 'A preparação inicial está completa.'
                : 'Enquanto a pesquisa acontece, você já pode preparar a conversa.'}
          </strong>
          <p>Todas as ações ficam salvas no histórico desta oportunidade.</p>
        </div>
        <div className={styles.acoes}>
          {precisaContexto && (
            <FormularioEnriquecimento
              oportunidadeId={oportunidadeId}
              dominioInicial={dominio}
              linkedinInicial={linkedin}
              temDossie={false}
              rotulo={
                estadoContexto === 'falhou' ? 'Tentar pesquisa novamente' : 'Pesquisar empresa'
              }
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
          {propostaPronta && destinoProposta ? (
            <>
              <Link
                href={`/crm/${oportunidadeId}`}
                className="via-btn via-btn--secondary via-btn--md"
              >
                Abrir oportunidade
              </Link>
              <Link href={destinoProposta} className="via-btn via-btn--primary via-btn--md">
                Montar proposta
              </Link>
            </>
          ) : contextoPronto && callPronta ? (
            <Link href={`/crm/${oportunidadeId}`} className="via-btn via-btn--primary via-btn--md">
              Abrir oportunidade
            </Link>
          ) : null}
        </div>
      </div>

      <ol className={styles.passos} aria-label="Preparação do novo lead">
        <li data-estado="concluido">
          <span className={styles.numero}>01</span>
          <div>
            <strong>Oportunidade no pipeline</strong>
            <p>Empresa, contato e serviço de interesse foram salvos.</p>
          </div>
          <small>Concluído</small>
        </li>
        <li
          data-estado={contextoPronto ? 'concluido' : contextoEmAndamento ? 'processando' : 'atual'}
          aria-current={etapaAtual === 2 ? 'step' : undefined}
        >
          <span className={styles.numero}>02</span>
          <div>
            <strong>Pesquisar a empresa</strong>
            <p>Busque site e informações que ajudam na primeira abordagem.</p>
          </div>
          <small>
            {contextoPronto
              ? 'Concluído'
              : contextoEmAndamento
                ? 'Pesquisando'
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
        {projetoSlug ? (
          <li
            data-estado={propostaPronta ? 'atual' : 'pendente'}
            aria-current={propostaPronta ? 'step' : undefined}
          >
            <span className={styles.numero}>04</span>
            <div>
              <strong>Montar a proposta</strong>
              <p>O projeto escolhido e os dados do CRM entram no primeiro rascunho.</p>
            </div>
            <small>{propostaPronta ? 'Próximo' : 'Pendente'}</small>
          </li>
        ) : null}
      </ol>
    </section>
  );
}
