import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Coins,
  ContactRound,
  LockKeyhole,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react';
import { comprarPacoteCreditos } from '@/lib/billing/actions';
import { obterCatalogoBilling } from '@/lib/billing/catalogo';
import { createClient } from '@/lib/supabase/server';
import { obterCarteiraCreditos } from '@/lib/creditos/queries';
import { apresentarMovimentoCredito, formatarMovimentoCredito } from '@/lib/creditos/modelo';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import { PACOTES_CREDITOS, planoDosMetadados } from '@/lib/planos/acessos';
import { BotaoBilling } from '../assinatura/BotaoBilling';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Créditos' };

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export default async function CreditosPage({ searchParams }: PageProps<'/conta/creditos'>) {
  const supabase = await createClient();
  const [{ data }, carteira, catalogo, parametros] = await Promise.all([
    supabase.auth.getClaims(),
    obterCarteiraCreditos(10),
    obterCatalogoBilling(),
    searchParams,
  ]);
  const plano = planoDosMetadados(data?.claims?.app_metadata);
  const comercialLiberado = plano !== 'starter';

  const usos = [
    {
      titulo: 'Encontrar empresas',
      detalhe: '1 crédito por empresa encontrada. O que não for usado volta para o saldo.',
      custo: '1',
      unidade: 'por empresa',
      href: comercialLiberado ? '/prospeccao' : '/conta?upgrade=prospeccao',
      bloqueado: !comercialLiberado,
      Icone: Search,
    },
    {
      titulo: 'Enriquecer uma oportunidade',
      detalhe: 'Reúne dados públicos e prepara perguntas para a conversa comercial.',
      custo: String(CUSTO_ENRIQUECIMENTO_OPORTUNIDADE),
      unidade: 'por análise',
      href: comercialLiberado ? '/vendas' : '/conta?upgrade=enriquecimento',
      bloqueado: !comercialLiberado,
      Icone: ContactRound,
    },
    {
      titulo: 'Participar de mentorias',
      detalhe: 'Cada sessão informa o custo antes do check-in. Ao cancelar, o valor volta.',
      custo: 'variável',
      unidade: 'por sessão',
      href: '/mentorias',
      bloqueado: false,
      Icone: Users,
    },
  ] as const;

  return (
    <div className={styles.pagina}>
      <Link href="/conta" className={styles.voltar}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Voltar para a conta
      </Link>

      <header className={styles.intro}>
        <div>
          <p className={styles.sobretitulo}>Créditos</p>
          <h1>Saldo e extrato de créditos</h1>
        </div>
        <p>Confira seu saldo, o custo de cada recurso e as movimentações recentes da sua conta.</p>
      </header>

      {parametros.checkout ? (
        <div
          className={styles.avisoCheckout}
          data-tom={parametros.checkout === 'sucesso' ? 'sucesso' : 'neutro'}
          role="status"
        >
          {parametros.checkout === 'sucesso' ? (
            <Check size={19} strokeWidth={2} aria-hidden="true" />
          ) : (
            <CircleAlert size={19} strokeWidth={1.8} aria-hidden="true" />
          )}
          <span>
            <strong>
              {parametros.checkout === 'sucesso'
                ? 'Pagamento recebido.'
                : parametros.checkout === 'cancelado'
                  ? 'Nenhuma cobrança foi feita.'
                  : 'Não foi possível abrir o pagamento.'}
            </strong>
            {parametros.checkout === 'sucesso'
              ? 'Os créditos entram no saldo assim que a Stripe confirmar o pagamento.'
              : parametros.checkout === 'cancelado'
                ? 'Seu saldo continua igual.'
                : 'Seu saldo não mudou. Tente novamente em alguns instantes.'}
          </span>
        </div>
      ) : null}

      <section className={styles.saldo} aria-labelledby="titulo-saldo">
        <div className={styles.saldoPrincipal}>
          <span className={styles.iconeSaldo} aria-hidden="true">
            <Coins size={24} strokeWidth={1.6} />
          </span>
          <div>
            <p id="titulo-saldo">Saldo disponível</p>
            <strong>{carteira.saldo ?? '—'}</strong>
            <small>créditos</small>
          </div>
        </div>
        <div className={styles.regraSaldo}>
          <p>Como funciona</p>
          <strong>Você confirma o custo antes de cada uso.</strong>
          <span>
            Quando uma operação falha ou é cancelada dentro da regra, os créditos são devolvidos
            automaticamente e aparecem no extrato.
          </span>
        </div>
      </section>

      <section className={styles.secao} aria-labelledby="titulo-pacotes">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p>Recarregar saldo</p>
            <h2 id="titulo-pacotes">Pacotes de créditos</h2>
          </div>
          <span>
            Escolha um pacote fechado. O saldo não expira enquanto sua conta estiver ativa.
          </span>
        </header>

        <div className={styles.pacotes}>
          {PACOTES_CREDITOS.map((pacote, indice) => {
            const preco = catalogo.pacotes[pacote.id];
            return (
              <article
                className={styles.pacote}
                data-destaque={indice === 1 || undefined}
                key={pacote.id}
              >
                <div className={styles.numeroPacote}>
                  <Coins size={18} strokeWidth={1.7} aria-hidden="true" />
                  <strong>{pacote.creditos}</strong>
                  <span>créditos</span>
                </div>
                <div className={styles.textoPacote}>
                  <p>{indice === 1 ? 'Mais escolhido' : 'Pacote'}</p>
                  <h3>{pacote.nome}</h3>
                  <span>{pacote.descricao}</span>
                </div>
                <div className={styles.precoPacote}>
                  <strong>{preco ?? 'Em breve'}</strong>
                  {preco ? <small>pagamento único</small> : null}
                </div>
                <div className={styles.acaoPacote}>
                  {catalogo.pronto && preco ? (
                    <form action={comprarPacoteCreditos}>
                      <input type="hidden" name="pacote" value={pacote.id} />
                      <BotaoBilling
                        texto={`Comprar ${pacote.nome}`}
                        processando="Abrindo pagamento..."
                        variante={indice === 1 ? 'primario' : 'secundario'}
                      />
                    </form>
                  ) : (
                    <span>Compra de pacotes será aberta em breve</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.secao} aria-labelledby="titulo-usar-creditos">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p>Onde usar</p>
            <h2 id="titulo-usar-creditos">Onde usar seus créditos</h2>
          </div>
          <span>O valor sempre aparece antes da confirmação.</span>
        </header>

        <div className={styles.usos}>
          {usos.map(({ titulo, detalhe, custo, unidade, href, bloqueado, Icone }) => (
            <Link
              href={href}
              className={styles.uso}
              data-bloqueado={bloqueado || undefined}
              key={titulo}
            >
              <span className={styles.iconeUso} aria-hidden="true">
                {bloqueado ? (
                  <LockKeyhole size={19} strokeWidth={1.7} />
                ) : (
                  <Icone size={19} strokeWidth={1.7} />
                )}
              </span>
              <div className={styles.custoUso}>
                <strong>{custo}</strong>
                <small>{unidade}</small>
              </div>
              <div className={styles.textoUso}>
                <h3>{titulo}</h3>
                <p>{detalhe}</p>
                {bloqueado ? <em>Disponível no plano Pro</em> : null}
              </div>
              <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.secao} aria-labelledby="titulo-extrato">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p>Extrato</p>
            <h2 id="titulo-extrato">Movimentações recentes</h2>
          </div>
          <span>Os registros mais novos aparecem primeiro.</span>
        </header>

        {carteira.movimentos.length > 0 ? (
          <ol className={styles.extrato}>
            {carteira.movimentos.map((movimento) => {
              const apresentacao = apresentarMovimentoCredito(movimento);
              const conteudo = (
                <>
                  <span
                    className={styles.iconeMovimento}
                    data-categoria={apresentacao.categoria}
                    aria-hidden="true"
                  >
                    {apresentacao.categoria === 'devolucao' ? (
                      <RotateCcw size={17} strokeWidth={1.8} />
                    ) : (
                      <Coins size={17} strokeWidth={1.8} />
                    )}
                  </span>
                  <span className={styles.detalheMovimento}>
                    <span>
                      <strong>{apresentacao.titulo}</strong>
                      <em data-categoria={apresentacao.categoria}>
                        {apresentacao.rotuloCategoria}
                      </em>
                    </span>
                    <small>{movimento.descricao}</small>
                  </span>
                  <time dateTime={movimento.criado_em}>
                    {DATA_HORA.format(new Date(movimento.criado_em))}
                  </time>
                  <span className={styles.valorMovimento} data-categoria={apresentacao.categoria}>
                    <strong>{formatarMovimentoCredito(movimento.movimento)}</strong>
                    <small>saldo {movimento.saldo_apos}</small>
                  </span>
                  {apresentacao.href ? (
                    <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                  ) : null}
                </>
              );

              return (
                <li key={movimento.id}>
                  {apresentacao.href ? (
                    <Link href={apresentacao.href}>{conteudo}</Link>
                  ) : (
                    <div>{conteudo}</div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className={styles.extratoVazio}>
            <Coins size={20} strokeWidth={1.6} aria-hidden="true" />
            <div>
              <strong>Nenhuma movimentação por aqui ainda.</strong>
              <p>Faça um check-in para criar o primeiro registro no seu extrato.</p>
              <Link href="/mentorias">
                Ver mentorias
                <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
