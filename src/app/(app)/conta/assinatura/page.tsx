import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Coins,
  CreditCard,
  Layers3,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { abrirPortalCobranca, iniciarAssinatura } from '@/lib/billing/actions';
import { obterCatalogoBilling } from '@/lib/billing/catalogo';
import { obterAssinaturaAtual } from '@/lib/billing/queries';
import { obterConfiguracaoBilling } from '@/lib/billing/stripe';
import { obterSaldoCreditos } from '@/lib/creditos/queries';
import {
  PLANOS_SUBIDO,
  RECURSOS_BASE_PLANO,
  RECURSOS_COMERCIAIS_PLANO,
  RECURSOS_SUBIDO,
  planoDosMetadados,
  planoTemRecurso,
  recursoPlanoValido,
} from '@/lib/planos/acessos';
import { createClient } from '@/lib/supabase/server';
import { BotaoBilling } from './BotaoBilling';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Plano e cobrança' };

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

const STATUS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Período de teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Pagamento não concluído',
  incomplete: 'Cadastro incompleto',
  incomplete_expired: 'Cadastro expirado',
  paused: 'Pausada',
};

export default async function AssinaturaPage({ searchParams }: PageProps<'/conta/assinatura'>) {
  const supabase = await createClient();
  const [{ data }, assinatura, catalogo, saldo, parametros] = await Promise.all([
    supabase.auth.getClaims(),
    obterAssinaturaAtual(),
    obterCatalogoBilling(),
    obterSaldoCreditos(),
    searchParams,
  ]);
  const plano = planoDosMetadados(data?.claims?.app_metadata);
  const configuracao = obterConfiguracaoBilling();
  const recursoSolicitado = recursoPlanoValido(parametros.upgrade) ? parametros.upgrade : null;
  const recursoBloqueado =
    recursoSolicitado && !planoTemRecurso(plano, recursoSolicitado)
      ? RECURSOS_SUBIDO[recursoSolicitado]
      : null;
  const planoNecessario = recursoBloqueado ? PLANOS_SUBIDO[recursoBloqueado.planoMinimo] : null;
  const origem =
    typeof parametros.origem === 'string' &&
    parametros.origem.startsWith('/') &&
    !parametros.origem.startsWith('//')
      ? parametros.origem
      : null;
  const possuiAssinaturaGerenciavel = Boolean(
    assinatura && ['active', 'trialing', 'past_due'].includes(assinatura.status),
  );
  const aviso =
    parametros.checkout === 'sucesso'
      ? {
          tom: 'sucesso',
          titulo: 'Pagamento recebido.',
          texto: 'A Stripe está confirmando o acesso. A atualização aparece aqui em instantes.',
        }
      : parametros.checkout === 'cancelado'
        ? {
            tom: 'neutro',
            titulo: 'Nenhuma cobrança foi feita.',
            texto: 'Você pode escolher um plano quando quiser.',
          }
        : parametros.checkout
          ? {
              tom: 'erro',
              titulo: 'Não foi possível abrir o pagamento.',
              texto: 'Seu acesso atual não mudou. Tente novamente em alguns instantes.',
            }
          : parametros.portal === 'indisponivel'
            ? {
                tom: 'erro',
                titulo: 'A cobrança não abriu agora.',
                texto: 'Seu plano continua ativo. Tente novamente em alguns instantes.',
              }
            : null;

  return (
    <div className={styles.pagina}>
      <Link href="/conta" className={styles.voltar}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Voltar para a conta
      </Link>

      {aviso ? (
        <div className={styles.aviso} data-tom={aviso.tom} role="status">
          {aviso.tom === 'sucesso' ? (
            <ShieldCheck size={19} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <CircleAlert size={19} strokeWidth={1.8} aria-hidden="true" />
          )}
          <span>
            <strong>{aviso.titulo}</strong>
            {aviso.texto}
          </span>
        </div>
      ) : null}

      {recursoBloqueado && planoNecessario ? (
        <section className={styles.avisoUpgrade} aria-labelledby="titulo-upgrade-contextual">
          <span className={styles.iconeUpgrade} aria-hidden="true">
            <LockKeyhole size={21} strokeWidth={1.7} />
          </span>
          <div>
            <p>Recurso do {planoNecessario.nome}</p>
            <h2 id="titulo-upgrade-contextual">
              {recursoBloqueado.nome} não está no seu plano atual.
            </h2>
            <span>{recursoBloqueado.descricao}</span>
          </div>
          <div className={styles.acoesUpgrade}>
            <a href={`#plano-${recursoBloqueado.planoMinimo}`}>
              Ver {planoNecessario.nome}
              <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
            </a>
            {origem ? <Link href={origem}>Voltar para {recursoBloqueado.nome}</Link> : null}
          </div>
        </section>
      ) : null}

      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <p>Plano e cobrança</p>
          <h1>Seu acesso, sem letras miúdas.</h1>
          <span>
            Veja o que está liberado, acompanhe os créditos e gerencie sua assinatura em um só
            lugar.
          </span>
        </div>
        <div className={styles.resumoAtual}>
          <span className={styles.iconeResumo} aria-hidden="true">
            <Layers3 size={21} strokeWidth={1.7} />
          </span>
          <div>
            <p>Plano atual</p>
            <strong>{PLANOS_SUBIDO[plano].nome}</strong>
            <small>
              {assinatura ? (STATUS[assinatura.status] ?? 'Em atualização') : 'Acesso liberado'}
            </small>
          </div>
          <div className={styles.creditosResumo}>
            <Coins size={16} strokeWidth={1.8} aria-hidden="true" />
            <strong>{saldo ?? '—'}</strong>
            <span>créditos</span>
          </div>
        </div>
      </header>

      {assinatura ? (
        <section className={styles.assinatura} aria-labelledby="titulo-assinatura">
          <div>
            <p>Sua assinatura</p>
            <h2 id="titulo-assinatura">
              {assinatura.cancela_ao_fim_do_periodo ? 'Cancelamento agendado' : 'Tudo em dia'}
            </h2>
            <span>
              {assinatura.periodo_atual_termina_em
                ? `${assinatura.cancela_ao_fim_do_periodo ? 'Acesso até' : 'Próxima renovação em'} ${DATA.format(new Date(assinatura.periodo_atual_termina_em))}.`
                : 'A data do próximo ciclo aparecerá assim que a cobrança for confirmada.'}
            </span>
          </div>
          {possuiAssinaturaGerenciavel ? (
            <form action={abrirPortalCobranca}>
              <BotaoBilling
                texto="Gerenciar cobrança"
                processando="Abrindo cobrança..."
                variante="secundario"
              />
            </form>
          ) : null}
        </section>
      ) : null}

      <section className={styles.secaoPlanos} aria-labelledby="titulo-planos">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p>Escolha simples</p>
            <h2 id="titulo-planos">O plano certo para o seu momento</h2>
          </div>
          <span>Você confirma o valor e a forma de pagamento na tela segura da Stripe.</span>
        </header>

        <div className={styles.planos}>
          {(['starter', 'pro'] as const).map((item) => {
            const atual = plano === item;
            const recursos =
              item === 'pro'
                ? [...RECURSOS_BASE_PLANO, ...RECURSOS_COMERCIAIS_PLANO]
                : RECURSOS_BASE_PLANO;
            const preco = catalogo.planos[item];
            const creditos = configuracao?.planos[item].creditos ?? (item === 'pro' ? 100 : 30);
            return (
              <article
                id={`plano-${item}`}
                className={styles.plano}
                data-destaque={item === 'pro' || undefined}
                key={item}
              >
                <div className={styles.topoPlano}>
                  <span>
                    {atual ? 'Seu plano' : item === 'pro' ? 'Operação completa' : 'Para começar'}
                  </span>
                  <h3>{PLANOS_SUBIDO[item].nome}</h3>
                  <p>{PLANOS_SUBIDO[item].descricao}</p>
                  <div className={styles.preco}>
                    <strong>{preco ?? 'Valor em breve'}</strong>
                    {preco ? <small>por mês</small> : null}
                  </div>
                </div>
                <div className={styles.franquia}>
                  <Coins size={17} strokeWidth={1.8} aria-hidden="true" />
                  <strong>{creditos} créditos</strong>
                  <span>incluídos a cada ciclo</span>
                </div>
                <ul>
                  {recursos.map((recurso) => (
                    <li key={recurso}>
                      <Check size={15} strokeWidth={2.1} aria-hidden="true" />
                      {recurso}
                    </li>
                  ))}
                </ul>
                <div className={styles.acaoPlano}>
                  {atual && !possuiAssinaturaGerenciavel ? (
                    <span className={styles.estadoAtual}>Plano atual</span>
                  ) : catalogo.pronto && preco ? (
                    <form
                      action={possuiAssinaturaGerenciavel ? abrirPortalCobranca : iniciarAssinatura}
                    >
                      {!possuiAssinaturaGerenciavel ? (
                        <input type="hidden" name="plano" value={item} />
                      ) : null}
                      <BotaoBilling
                        texto={
                          possuiAssinaturaGerenciavel
                            ? 'Alterar pelo portal'
                            : `Escolher ${PLANOS_SUBIDO[item].nome}`
                        }
                        processando="Abrindo pagamento..."
                        variante={item === 'pro' ? 'primario' : 'secundario'}
                      />
                    </form>
                  ) : (
                    <span className={styles.estadoAtual}>Novas assinaturas em breve</span>
                  )}
                </div>
              </article>
            );
          })}

          <article id="plano-enterprise" className={styles.plano}>
            <div className={styles.topoPlano}>
              <span>Para equipes</span>
              <h3>Enterprise</h3>
              <p>Todos os recursos, governança e acompanhamento para uma operação maior.</p>
              <div className={styles.preco}>
                <strong>Conversa personalizada</strong>
              </div>
            </div>
            <div className={styles.franquia}>
              <ShieldCheck size={17} strokeWidth={1.8} aria-hidden="true" />
              <strong>Estrutura sob medida</strong>
              <span>para times e volume maior</span>
            </div>
            <ul>
              <li>
                <Check size={15} strokeWidth={2.1} aria-hidden="true" />
                Tudo do plano Pro
              </li>
              <li>
                <Check size={15} strokeWidth={2.1} aria-hidden="true" />
                Controles e acompanhamento para equipes
              </li>
            </ul>
            <div className={styles.acaoPlano}>
              <a
                href="mailto:suporte@viverdeia.ai?subject=Plano%20Enterprise%20Subido"
                className={styles.botaoContato}
              >
                Falar com a equipe
                <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.rodapeSeguro}>
        <span aria-hidden="true">
          <CreditCard size={20} strokeWidth={1.7} />
        </span>
        <div>
          <strong>Pagamento processado pela Stripe</strong>
          <p>Os dados do cartão não passam pela plataforma Subido.</p>
        </div>
        <Link href="/conta/creditos">
          Ver pacotes de créditos
          <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
