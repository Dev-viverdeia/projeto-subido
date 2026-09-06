import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Coins,
  CreditCard,
  Layers3,
  ShieldCheck,
} from 'lucide-react';
import { abrirPortalCobranca, iniciarAssinatura } from '@/lib/billing/actions';
import { apresentarAssinatura, type AssinaturaResumo } from '@/lib/billing/assinatura';
import type { obterCatalogoBilling } from '@/lib/billing/catalogo';
import {
  PLANOS_SUBIDO,
  RECURSOS_BASE_PLANO,
  RECURSOS_COMERCIAIS_PLANO,
  type PlanoSubido,
} from '@/lib/planos/acessos';
import { BotaoBilling } from './BotaoBilling';
import styles from './page.module.css';

export function PainelAssinatura({
  plano,
  saldo,
  assinatura,
  indisponivel,
  catalogo,
  creditos,
}: {
  plano: PlanoSubido;
  saldo: number | null;
  assinatura: AssinaturaResumo | null;
  indisponivel: boolean;
  catalogo: Awaited<ReturnType<typeof obterCatalogoBilling>>;
  creditos: { starter: number | null; pro: number | null };
}) {
  const estado = apresentarAssinatura(assinatura);
  return (
    <>
      <header className={styles.intro}>
        <h1>Plano e créditos</h1>
        <p>Seu acesso e sua cobrança, em um só lugar.</p>
      </header>
      <section className={styles.resumo} aria-label="Resumo da conta">
        <div className={styles.acesso}>
          <span className={styles.iconeResumo} aria-hidden="true">
            <Layers3 size={24} strokeWidth={1.6} />
          </span>
          <div>
            <p>Plano atual</p>
            <h2>{PLANOS_SUBIDO[plano].nome}</h2>
          </div>
          <a href="#planos" className={styles.linkDiscreto}>
            Comparar planos
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.cobranca} data-tom={indisponivel ? 'atencao' : estado.tom}>
          <span className={styles.estadoIcone} aria-hidden="true">
            {indisponivel || estado.tom === 'atencao' ? (
              <CircleAlert size={20} />
            ) : (
              <ShieldCheck size={20} />
            )}
          </span>
          <div role={indisponivel || estado.tom === 'atencao' ? 'status' : undefined}>
            <h3>{indisponivel ? 'Não conseguimos consultar sua assinatura.' : estado.titulo}</h3>
            <p>
              {indisponivel
                ? 'Tente atualizar a página antes de iniciar uma compra.'
                : estado.descricao}
            </p>
          </div>
          {estado.gerenciavel && !indisponivel ? (
            <form action={abrirPortalCobranca}>
              <BotaoBilling
                texto={estado.acao}
                processando="Abrindo cobrança..."
                variante={estado.tom === 'atencao' ? 'primario' : 'secundario'}
              />
            </form>
          ) : null}
          {indisponivel ? (
            <a className={styles.botaoContato} href="/conta/assinatura">
              Atualizar
            </a>
          ) : null}
        </div>
        <div className={styles.saldoAtual}>
          <Coins size={23} strokeWidth={1.6} aria-hidden="true" />
          <p>Saldo disponível</p>
          <strong>
            {saldo === null ? '—' : new Intl.NumberFormat('pt-BR').format(saldo)}
            <span>créditos</span>
          </strong>
          <Link href="/conta/creditos">
            {saldo === null ? 'Consultar saldo' : 'Ver extrato'}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section id="planos" className={styles.secaoPlanos} aria-labelledby="titulo-planos">
        <header className={styles.cabecalhoSecao}>
          <h2 id="titulo-planos">Um plano para cada momento</h2>
          <span>Pagamento seguro pela Stripe</span>
        </header>
        {!catalogo.planos.starter && !catalogo.planos.pro ? (
          <p className={styles.indisponivel}>
            Novas assinaturas indisponíveis por enquanto. <span>Seu acesso atual não muda.</span>
          </p>
        ) : null}
        <div className={styles.planos}>
          {(['starter', 'pro'] as const).map((item) => {
            const preco = catalogo.planos[item];
            const atual = item === plano;
            const recursos =
              item === 'starter'
                ? RECURSOS_BASE_PLANO
                : ['Tudo do Starter', ...RECURSOS_COMERCIAIS_PLANO];
            return (
              <article
                className={styles.plano}
                id={`plano-${item}`}
                data-atual={atual || undefined}
                key={item}
              >
                <div className={styles.topoPlano}>
                  <h3>{PLANOS_SUBIDO[item].nome}</h3>
                  {atual ? (
                    <span className={styles.seloAtual}>
                      <Check size={14} aria-hidden="true" />
                      Seu plano
                    </span>
                  ) : null}
                </div>
                <p>
                  {item === 'starter' ? 'Aprender e construir com IA.' : 'Da prospecção à entrega.'}
                </p>
                {preco ? (
                  <div className={styles.preco}>
                    <strong>{preco}</strong>
                    <span>/ mês</span>
                  </div>
                ) : null}
                {preco && creditos[item] !== null ? (
                  <p className={styles.franquia}>
                    <Coins size={17} aria-hidden="true" />
                    {creditos[item]} créditos por ciclo
                  </p>
                ) : null}
                <ul>
                  {recursos.map((recurso) => (
                    <li key={recurso}>
                      <Check size={16} aria-hidden="true" />
                      {recurso}
                    </li>
                  ))}
                </ul>
                <div className={styles.acaoPlano}>
                  {estado.gerenciavel && !indisponivel ? (
                    <form action={abrirPortalCobranca}>
                      <BotaoBilling
                        texto={atual ? 'Gerenciar plano' : `Mudar para ${PLANOS_SUBIDO[item].nome}`}
                        processando="Abrindo cobrança..."
                        variante="secundario"
                      />
                    </form>
                  ) : preco && !indisponivel ? (
                    <form action={iniciarAssinatura}>
                      <input type="hidden" name="plano" value={item} />
                      <BotaoBilling
                        texto={`Escolher ${PLANOS_SUBIDO[item].nome}`}
                        processando="Abrindo pagamento..."
                        variante={item === 'pro' ? 'primario' : 'secundario'}
                      />
                    </form>
                  ) : (
                    <span className={styles.estadoAtual}>
                      {atual ? 'Plano atual' : 'Indisponível para contratação'}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <div className={styles.enterprise} id="plano-enterprise">
          <div>
            <h3>Enterprise</h3>
            <p>Uma estrutura para sua equipe.</p>
          </div>
          <a href="mailto:suporte@viverdeia.ai?subject=Plano%20Enterprise%20Subido">
            Falar com a equipe
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
      <footer className={styles.rodapeSeguro}>
        <CreditCard size={19} aria-hidden="true" />
        <span>O pagamento é concluído fora da Subido, em ambiente seguro.</span>
        <Link href="/conta/creditos">
          Ver pacotes de créditos
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </>
  );
}
