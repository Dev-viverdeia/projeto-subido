'use client';

import { useMemo, useState } from 'react';
import { Calculator, CircleDollarSign, DatabaseZap, Gauge } from 'lucide-react';
import styles from './page.module.css';

type Provedor = {
  provedor: string;
  chamadas: number;
  unidades: number;
  creditosProvedor: number;
  custoUsdMicros: number;
  latenciaTotalMs: number;
  falhas: number;
};

type Resumo = {
  periodoDias: number;
  listas: number;
  listasConcluidas: number;
  empresasSolicitadas: number;
  leadsEntregues: number;
  provedores: Provedor[];
};

const PLANOS_FIRECRAWL = [
  { id: 'free', nome: 'Free · US$ 0 / 1.000 créditos', usdPorCredito: 0 },
  { id: 'hobby', nome: 'Hobby · US$ 16 / 5.000 créditos', usdPorCredito: 16 / 5_000 },
  { id: 'standard', nome: 'Standard · US$ 83 / 100.000 créditos', usdPorCredito: 83 / 100_000 },
  { id: 'growth', nome: 'Growth · US$ 333 / 500.000 créditos', usdPorCredito: 333 / 500_000 },
] as const;

const PACOTES = [
  { nome: 'Essencial', creditos: 50 },
  { nome: 'Crescimento', creditos: 150 },
  { nome: 'Escala', creditos: 500 },
] as const;

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const usd = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });

function numero(valor: string, fallback = 0) {
  const convertido = Number(valor.replace(',', '.'));
  return Number.isFinite(convertido) && convertido >= 0 ? convertido : fallback;
}

function nomeProvedor(provedor: string) {
  return (
    {
      apify: 'Apify',
      firecrawl: 'Firecrawl',
      perplexity: 'Perplexity',
      serpapi: 'SerpAPI',
      openai: 'OpenAI',
    }[provedor] ?? provedor
  );
}

export function CalculadoraCustos({ resumo }: { resumo: Resumo }) {
  const [cambio, setCambio] = useState('5,15');
  const [margem, setMargem] = useState('70');
  const [planoFirecrawl, setPlanoFirecrawl] = useState('standard');
  const [apifyPorLead, setApifyPorLead] = useState('0');
  const [serpPorBuscaUsd, setSerpPorBuscaUsd] = useState('0,01');
  const [openAiPorMilhaoUsd, setOpenAiPorMilhaoUsd] = useState('0');

  const calculo = useMemo(() => {
    const cotacao = numero(cambio, 5.15);
    const margemAlvo = Math.min(95, numero(margem, 70)) / 100;
    const firecrawl = PLANOS_FIRECRAWL.find((item) => item.id === planoFirecrawl)!;
    const porNome = new Map(resumo.provedores.map((item) => [item.provedor, item]));
    const custoConhecidoUsd = resumo.provedores.reduce(
      (total, item) => total + item.custoUsdMicros / 1_000_000,
      0,
    );
    const custoFirecrawlUsd =
      (porNome.get('firecrawl')?.creditosProvedor ?? 0) * firecrawl.usdPorCredito;
    const custoSerpUsd = (porNome.get('serpapi')?.unidades ?? 0) * numero(serpPorBuscaUsd);
    const custoOpenAiUsd =
      ((porNome.get('openai')?.unidades ?? 0) / 1_000_000) * numero(openAiPorMilhaoUsd);
    const custoApifyEstimadoBrl = resumo.leadsEntregues * numero(apifyPorLead);
    const totalUsd = custoConhecidoUsd + custoFirecrawlUsd + custoSerpUsd + custoOpenAiUsd;
    const totalBrl = totalUsd * cotacao + custoApifyEstimadoBrl;
    const custoPorLead = resumo.leadsEntregues > 0 ? totalBrl / resumo.leadsEntregues : 0;
    return {
      cotacao,
      margemAlvo,
      totalUsd,
      totalBrl,
      custoPorLead,
      pacotes: PACOTES.map((pacote) => {
        const custo = custoPorLead * pacote.creditos;
        return {
          ...pacote,
          custo,
          precoMinimo: margemAlvo < 1 ? custo / (1 - margemAlvo) : 0,
        };
      }),
    };
  }, [apifyPorLead, cambio, margem, openAiPorMilhaoUsd, planoFirecrawl, resumo, serpPorBuscaUsd]);

  return (
    <div className={styles.conteudo}>
      <section className={styles.indicadores} aria-label="Resumo dos custos">
        <article>
          <span>
            <DatabaseZap size={18} aria-hidden="true" />
          </span>
          <p>Listas concluídas</p>
          <strong>
            {resumo.listasConcluidas}
            <small> / {resumo.listas}</small>
          </strong>
        </article>
        <article>
          <span>
            <Gauge size={18} aria-hidden="true" />
          </span>
          <p>Aproveitamento</p>
          <strong>
            {resumo.empresasSolicitadas
              ? Math.round((resumo.leadsEntregues / resumo.empresasSolicitadas) * 100)
              : 0}
            <small>%</small>
          </strong>
        </article>
        <article>
          <span>
            <CircleDollarSign size={18} aria-hidden="true" />
          </span>
          <p>Custo observado</p>
          <strong>{brl.format(calculo.totalBrl)}</strong>
        </article>
        <article>
          <span>
            <Calculator size={18} aria-hidden="true" />
          </span>
          <p>Custo por lead útil</p>
          <strong>
            {resumo.leadsEntregues ? brl.format(calculo.custoPorLead) : 'Sem amostra'}
          </strong>
        </article>
      </section>

      <section className={styles.painel}>
        <header>
          <div>
            <p>Premissas editáveis</p>
            <h2>Ajuste a conta ao contrato real</h2>
          </div>
          <span>O histórico não é alterado.</span>
        </header>
        <div className={styles.campos}>
          <label>
            <span>Câmbio USD → BRL</span>
            <input value={cambio} onChange={(e) => setCambio(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <span>Margem bruta desejada</span>
            <div className={styles.comSufixo}>
              <input
                value={margem}
                onChange={(e) => setMargem(e.target.value)}
                inputMode="decimal"
              />
              <em>%</em>
            </div>
          </label>
          <label>
            <span>Plano Firecrawl</span>
            <select value={planoFirecrawl} onChange={(e) => setPlanoFirecrawl(e.target.value)}>
              {PLANOS_FIRECRAWL.map((plano) => (
                <option value={plano.id} key={plano.id}>
                  {plano.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Apify adicional por lead, em R$</span>
            <input
              value={apifyPorLead}
              onChange={(e) => setApifyPorLead(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label>
            <span>SerpAPI por busca · plano Production</span>
            <input
              value={serpPorBuscaUsd}
              onChange={(e) => setSerpPorBuscaUsd(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label>
            <span>OpenAI por 1 milhão de tokens, em US$</span>
            <input
              value={openAiPorMilhaoUsd}
              onChange={(e) => setOpenAiPorMilhaoUsd(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
      </section>

      <section className={styles.gradeInferior}>
        <article className={styles.painel}>
          <header>
            <div>
              <p>Telemetria</p>
              <h2>Consumo por fornecedor</h2>
            </div>
            <span>{resumo.periodoDias} dias</span>
          </header>
          {resumo.provedores.length ? (
            <ul className={styles.provedores}>
              {resumo.provedores.map((item) => (
                <li key={item.provedor}>
                  <div>
                    <strong>{nomeProvedor(item.provedor)}</strong>
                    <span>
                      {item.chamadas} chamadas · {item.falhas} falhas
                    </span>
                  </div>
                  <div>
                    <strong>
                      {item.creditosProvedor
                        ? `${item.creditosProvedor} créditos`
                        : `${Math.round(item.unidades)} ${item.provedor === 'openai' ? 'tokens' : 'unidades'}`}
                    </strong>
                    <span>{usd.format(item.custoUsdMicros / 1_000_000)} registrado</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.vazio}>A primeira busca publicada começa a formar esta base.</p>
          )}
        </article>

        <article className={styles.painel}>
          <header>
            <div>
              <p>Simulação</p>
              <h2>Preço mínimo por pacote</h2>
            </div>
            <span>{Math.round(calculo.margemAlvo * 100)}% de margem</span>
          </header>
          <div className={styles.pacotes}>
            {calculo.pacotes.map((pacote) => (
              <div key={pacote.nome}>
                <span>{pacote.nome}</span>
                <strong>
                  {pacote.creditos}
                  <small> créditos</small>
                </strong>
                <dl>
                  <div>
                    <dt>Custo estimado</dt>
                    <dd>{brl.format(pacote.custo)}</dd>
                  </div>
                  <div>
                    <dt>Preço mínimo</dt>
                    <dd>{brl.format(pacote.precoMinimo)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <p className={styles.nota}>
            O cálculo usa o custo médio por lead entregue. Mentorias e enriquecimento do CRM terão
            suas próprias linhas de custo em uma próxima leitura.
          </p>
        </article>
      </section>
    </div>
  );
}
