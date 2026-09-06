import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Coins,
  ContactRound,
  LockKeyhole,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react';
import { comprarPacoteCreditos } from '@/lib/billing/actions';
import type { obterCatalogoBilling } from '@/lib/billing/catalogo';
import type { CarteiraCreditos } from '@/lib/creditos/queries';
import { apresentarMovimentoCredito, formatarMovimentoCredito } from '@/lib/creditos/modelo';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import {
  PACOTES_CREDITOS,
  destinoDeUpgrade,
  planoTemRecurso,
  type PlanoSubido,
} from '@/lib/planos/acessos';
import { BotaoBilling } from '../assinatura/BotaoBilling';
import styles from './page.module.css';

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function PainelCreditos({
  plano,
  carteira,
  catalogo,
}: {
  plano: PlanoSubido;
  carteira: CarteiraCreditos;
  catalogo: Awaited<ReturnType<typeof obterCatalogoBilling>>;
}) {
  const prospeccaoLiberada = planoTemRecurso(plano, 'prospeccao');
  const enriquecimentoLiberado = planoTemRecurso(plano, 'enriquecimento');

  const usos = [
    {
      titulo: 'Encontrar empresas',
      detalhe: 'O que não for usado volta ao saldo.',
      custo: '1',
      unidade: 'por empresa',
      href: prospeccaoLiberada ? '/prospeccao' : destinoDeUpgrade('prospeccao', '/prospeccao'),
      bloqueado: !prospeccaoLiberada,
      Icone: Search,
    },
    {
      titulo: 'Enriquecer oportunidade',
      detalhe: 'Dados e contexto para a próxima conversa.',
      custo: String(CUSTO_ENRIQUECIMENTO_OPORTUNIDADE),
      unidade: 'por análise',
      href: enriquecimentoLiberado ? '/vendas' : destinoDeUpgrade('enriquecimento', '/vendas'),
      bloqueado: !enriquecimentoLiberado,
      Icone: ContactRound,
    },
    {
      titulo: 'Participar de mentorias',
      detalhe: 'Custo informado antes do check-in.',
      custo: 'variável',
      unidade: 'por sessão',
      href: '/mentorias',
      bloqueado: false,
      Icone: Users,
    },
  ] as const;

  return (
    <>
      <Link href="/conta" className={styles.voltar}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
        Minha conta
      </Link>

      <header className={styles.intro}>
        <div>
          <h1>Seus créditos</h1>
        </div>
        <p>Saldo, uso e movimentações.</p>
      </header>

      <section className={styles.saldo} aria-labelledby="titulo-saldo">
        <div className={styles.saldoPrincipal}>
          <span className={styles.iconeSaldo} aria-hidden="true">
            <Coins size={24} strokeWidth={1.6} />
          </span>
          <div>
            <p id="titulo-saldo">Saldo disponível</p>
            <strong>
              {carteira.saldo === null
                ? '—'
                : new Intl.NumberFormat('pt-BR').format(carteira.saldo)}
            </strong>
            <small>créditos</small>
          </div>
        </div>
        <div className={styles.regraSaldo}>
          <strong>
            {carteira.saldo === null
              ? 'Saldo indisponível no momento.'
              : 'O custo aparece antes de confirmar.'}
          </strong>
          {carteira.saldo === null ? (
            <a href="/conta/creditos">Atualizar saldo</a>
          ) : (
            <Link href="/conta/assinatura">
              Ver meu plano
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section className={styles.secao} aria-labelledby="titulo-usar-creditos">
        <header className={styles.cabecalhoSecao}>
          <div>
            <h2 id="titulo-usar-creditos">Onde usar</h2>
          </div>
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
                {bloqueado ? <em>Plano Pro</em> : null}
              </div>
              <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.secao} aria-labelledby="titulo-extrato">
        <header className={styles.cabecalhoSecao}>
          <div>
            <h2 id="titulo-extrato">Extrato recente</h2>
          </div>
          <span>Últimas 10 movimentações</span>
        </header>

        {!carteira.extratoDisponivel ? (
          <div className={styles.extratoVazio} role="status">
            <RotateCcw size={20} aria-hidden="true" />
            <div>
              <strong>Não conseguimos carregar o extrato.</strong>
              <a href="/conta/creditos">
                Tentar novamente
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : carteira.movimentos.length > 0 ? (
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
              <p>Usos e devoluções aparecerão aqui.</p>
            </div>
          </div>
        )}
      </section>

      <section className={styles.secao} aria-labelledby="titulo-pacotes">
        <header className={styles.cabecalhoSecao}>
          <div>
            <h2 id="titulo-pacotes">Pacotes de créditos</h2>
          </div>
        </header>

        {Object.values(catalogo.pacotes).some(Boolean) ? (
          <div className={styles.pacotes}>
            {PACOTES_CREDITOS.map((pacote, indice) => {
              const preco = catalogo.pacotes[pacote.id];
              if (!preco) return null;
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
                    <h3>{pacote.nome}</h3>
                    <span>{pacote.descricao}</span>
                  </div>
                  <div className={styles.precoPacote}>
                    <strong>{preco}</strong>
                    <small>pagamento único</small>
                  </div>
                  <div className={styles.acaoPacote}>
                    <form action={comprarPacoteCreditos}>
                      <input type="hidden" name="pacote" value={pacote.id} />
                      <BotaoBilling
                        texto={`Comprar ${pacote.nome}`}
                        processando="Abrindo pagamento..."
                        variante={indice === 1 ? 'primario' : 'secundario'}
                      />
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.pacotesAviso} role="status">
            <span className={styles.iconeUso} aria-hidden="true">
              <Coins size={19} strokeWidth={1.7} />
            </span>
            <div>
              <strong>Compra de créditos indisponível por enquanto.</strong>
              <p>Você pode continuar usando seu saldo atual.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
