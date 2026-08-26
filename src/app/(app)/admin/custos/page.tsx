import type { Metadata } from 'next';
// eslint-disable-next-line no-restricted-imports -- Server Component dentro da área administrativa
import { createAdminClient } from '@/lib/supabase/admin';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import { CalculadoraCustos } from './CalculadoraCustos';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Custos e margem' };
export const dynamic = 'force-dynamic';

const DIAS_ANALISE = 30;

export default async function CustosPage() {
  const admin = createAdminClient();
  // eslint-disable-next-line react-hooks/purity -- janela móvel calculada por requisição no Server Component dinâmico
  const desde = new Date(Date.now() - DIAS_ANALISE * 86_400_000).toISOString();
  const [custos, listas] = await Promise.all([
    admin
      .from('prospeccao_custos_provedores')
      .select(
        'provedor, operacao, status, unidades, unidade, creditos_provedor, custo_usd_micros, latencia_ms, cache_hit',
      )
      .gte('criado_em', desde),
    admin
      .from('prospeccao_listas')
      .select('status, quantidade_solicitada, creditos_consumidos')
      .gte('criado_em', desde),
  ]);

  if (custos.error) console.error('[admin:custos]', custos.error.code, custos.error.message);
  if (listas.error) console.error('[admin:custos-listas]', listas.error.code, listas.error.message);

  const porProvedor = new Map<
    string,
    {
      provedor: string;
      chamadas: number;
      unidades: number;
      creditosProvedor: number;
      custoUsdMicros: number;
      latenciaTotalMs: number;
      falhas: number;
    }
  >();

  for (const item of custos.data ?? []) {
    const atual = porProvedor.get(item.provedor) ?? {
      provedor: item.provedor,
      chamadas: 0,
      unidades: 0,
      creditosProvedor: 0,
      custoUsdMicros: 0,
      latenciaTotalMs: 0,
      falhas: 0,
    };
    atual.chamadas += 1;
    atual.unidades += Number(item.unidades);
    atual.creditosProvedor += Number(item.creditos_provedor);
    atual.custoUsdMicros += Number(item.custo_usd_micros);
    atual.latenciaTotalMs += item.latencia_ms ?? 0;
    if (item.status === 'falhou') atual.falhas += 1;
    porProvedor.set(item.provedor, atual);
  }

  const registrosListas = listas.data ?? [];
  const resumo = {
    periodoDias: DIAS_ANALISE,
    listas: registrosListas.length,
    listasConcluidas: registrosListas.filter((item) => item.status === 'concluida').length,
    empresasSolicitadas: registrosListas.reduce(
      (total, item) => total + item.quantidade_solicitada,
      0,
    ),
    leadsEntregues: registrosListas.reduce((total, item) => total + item.creditos_consumidos, 0),
    provedores: [...porProvedor.values()],
  };

  return (
    <>
      <CabecalhoPagina titulo="Custos e margem" oculto />
      <div className={styles.pagina}>
        <header className={styles.hero}>
          <div>
            <p>Economia do produto</p>
            <h1>Quanto custa entregar um lead útil?</h1>
            <span>
              Acompanhe o consumo real das integrações e simule pacotes de créditos antes de definir
              preços.
            </span>
          </div>
          <dl>
            <div>
              <dt>Janela analisada</dt>
              <dd>{DIAS_ANALISE} dias</dd>
            </div>
            <div>
              <dt>Leads entregues</dt>
              <dd>{resumo.leadsEntregues}</dd>
            </div>
          </dl>
        </header>

        <CalculadoraCustos resumo={resumo} />
      </div>
    </>
  );
}
