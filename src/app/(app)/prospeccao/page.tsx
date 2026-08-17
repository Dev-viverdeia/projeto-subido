import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Coins, DatabaseZap, Search, SlidersHorizontal } from 'lucide-react';
import { prospeccaoEnv } from '@/lib/env';
import { carregarProspeccao } from '@/lib/prospeccao/queries';
import { FormularioBusca } from './_components/FormularioBusca';
import { ListaResultados } from './_components/ListaResultados';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Prospecção' };
export const maxDuration = 180;

const ROTULO_STATUS = {
  processando: 'Buscando',
  concluida: 'Concluída',
  falhou: 'Não concluída',
} as const;

function dataCurta(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(valor),
  );
}

export default async function ProspeccaoPage({ searchParams }: PageProps<'/prospeccao'>) {
  const parametros = await searchParams;
  const listaPreferida = typeof parametros.lista === 'string' ? parametros.lista : undefined;
  const [{ saldo, listas, listaAtual, leads }, integracoes] = await Promise.all([
    carregarProspeccao(listaPreferida),
    Promise.resolve(prospeccaoEnv()),
  ]);

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <div>
          <p className={styles.sobretitulo}>Prospecção</p>
          <h1>Encontre empresas. Escolha quais viram oportunidade.</h1>
          <p>
            Crie listas qualificadas com contatos, presença digital e possíveis decisores antes de
            enviar os melhores leads para o CRM.
          </p>
        </div>
        <div className={styles.saldo}>
          <Coins size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>
            Saldo disponível
            <strong>{saldo}</strong>
          </span>
          <small>1 empresa encontrada = 1 crédito</small>
        </div>
      </header>

      {parametros.busca === 'concluida' && (
        <div className={styles.confirmacao} role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          Lista qualificada. Abra os dossiês e envie para o CRM o que fizer sentido.
        </div>
      )}
      {parametros.busca === 'falhou' && (
        <div className={styles.aviso} role="alert">
          A busca não foi concluída. Os créditos reservados foram devolvidos automaticamente.
        </div>
      )}
      {parametros.crm === 'erro' && (
        <div className={styles.aviso} role="alert">
          Não foi possível enviar esse lead ao CRM agora. Tente novamente.
        </div>
      )}

      <FormularioBusca saldo={saldo} pronto={integracoes.pronto} />

      <section className={styles.areaListas} aria-labelledby="listas-titulo">
        <aside className={styles.historico}>
          <div className={styles.historicoTopo}>
            <div>
              <p className={styles.sobretitulo}>Suas buscas</p>
              <h2 id="listas-titulo">Listas</h2>
            </div>
            <span>{listas.length}</span>
          </div>
          {listas.length ? (
            <nav aria-label="Listas de prospecção">
              {listas.map((lista) => (
                <Link
                  href={`/prospeccao?lista=${lista.id}`}
                  key={lista.id}
                  aria-current={listaAtual?.id === lista.id ? 'page' : undefined}
                >
                  <span>
                    <strong>{lista.segmento}</strong>
                    <small>{lista.localizacao}</small>
                  </span>
                  <span>
                    <small>{dataCurta(lista.criado_em)}</small>
                    <em data-status={lista.status}>
                      {ROTULO_STATUS[lista.status as keyof typeof ROTULO_STATUS]}
                    </em>
                  </span>
                </Link>
              ))}
            </nav>
          ) : (
            <div className={styles.semListas}>
              <Search size={19} aria-hidden="true" />
              <p>Sua primeira busca aparecerá aqui.</p>
            </div>
          )}
        </aside>

        <div className={styles.resultados}>
          {listaAtual ? (
            <>
              <header className={styles.resultadosTopo}>
                <div>
                  <p className={styles.sobretitulo}>Lista selecionada</p>
                  <h2>{listaAtual.segmento}</h2>
                  <span>{listaAtual.localizacao}</span>
                </div>
                <div className={styles.metricasLista}>
                  <span>
                    <strong>{listaAtual.creditos_consumidos}</strong>
                    encontradas
                  </span>
                  <span>
                    <strong>{listaAtual.quantidade_solicitada}</strong>
                    solicitados
                  </span>
                </div>
              </header>
              {listaAtual.status === 'falhou' ? (
                <div className={styles.semResultados}>
                  <SlidersHorizontal size={24} aria-hidden="true" />
                  <h3>Esta busca não foi concluída.</h3>
                  <p>Revise o recorte e crie uma nova lista. O saldo já foi restaurado.</p>
                </div>
              ) : (
                <ListaResultados leads={leads} />
              )}
            </>
          ) : (
            <div className={styles.primeiraBusca}>
              <DatabaseZap size={28} strokeWidth={1.5} aria-hidden="true" />
              <p className={styles.sobretitulo}>Da busca ao pipeline</p>
              <h2>Comece com uma busca simples.</h2>
              <p>
                Diga o tipo de empresa e a região. Você revisa cada resultado antes de decidir o que
                merece virar oportunidade.
              </p>
              <ol>
                <li>
                  <span>01</span> Defina mercado e região
                </li>
                <li>
                  <span>02</span> Revise os resultados
                </li>
                <li>
                  <span>03</span> Envie os melhores para o CRM
                </li>
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
