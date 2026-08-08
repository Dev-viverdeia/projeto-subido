'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Flag,
  HelpCircle,
  Phone,
  Search,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import type { IdEtapaJornada, PlanoJornada } from '@/lib/jornada/motor';
import styles from './MapaJornada.module.css';

const ICONES = {
  aprender: Flag,
  prospectar: Search,
  vender: FileText,
  entregar: CheckCircle2,
  evoluir: TrendingUp,
} satisfies Record<IdEtapaJornada, typeof Flag>;

type Props = {
  configuracao?: ReactNode;
  nome: string | null;
  espacoDeTrabalho: string;
  cliente: string;
  contato: string;
  proximaAcao?: string | null;
  proximaMentoria?: string | null;
  oferta: string | null;
  nicho: string | null;
  diagnosticoSobral: string;
  focoSobral: string;
  plano: PlanoJornada;
};

export function MapaJornada({
  configuracao,
  nome,
  espacoDeTrabalho,
  cliente,
  contato,
  proximaAcao,
  proximaMentoria,
  oferta,
  nicho,
  diagnosticoSobral,
  focoSobral,
  plano,
}: Props) {
  const [etapaAtiva, setEtapaAtiva] = useState<IdEtapaJornada>(plano.etapaAtual);
  const etapa = plano.etapas.find((item) => item.id === etapaAtiva) ?? plano.etapas[0]!;
  const hoje = new Date();
  const dataLonga = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <header className={styles.topo}>
        <div>
          <p className={styles.saudacao}>Bom dia{nome ? `, ${nome}` : ''}.</p>
          <p className={styles.data}>{dataLonga}</p>
        </div>

        <div className={styles.espaco}>
          <span>Operação acompanhada</span>
          <strong>{espacoDeTrabalho}</strong>
        </div>
      </header>

      {configuracao}

      <section className={styles.mapa} aria-labelledby="titulo-mapa-jornada">
        <div className={styles.mapaTopo}>
          <div className={styles.mapaCabecalho}>
            <h1 id="titulo-mapa-jornada">Seu mapa da jornada</h1>
            <p>Cada avanço abaixo exige uma evidência registrada na plataforma.</p>
          </div>
          <div className={styles.progressoGeral} aria-label={`${plano.percentual}% da jornada`}>
            <span>
              <strong>{plano.evidenciasConcluidas}</strong> de {plano.totalEvidencias} evidências
            </span>
            <div className={styles.progressoTrilho} aria-hidden="true">
              <span style={{ width: `${plano.percentual}%` }} />
            </div>
            <small>{plano.percentual}% do primeiro ciclo</small>
          </div>
        </div>

        <ol className={styles.etapas} aria-label="Etapas da jornada profissional">
          {plano.etapas.map((item) => {
            const Icone = ICONES[item.id];
            const ativa = item.id === etapaAtiva;

            return (
              <li key={item.id} className={styles.etapaItem} data-status={item.status}>
                <button
                  type="button"
                  className={styles.etapaBotao}
                  aria-pressed={ativa}
                  onClick={() => setEtapaAtiva(item.id)}
                >
                  <span className={styles.etapaNumero}>{item.numero}</span>
                  <span className={styles.etapaTitulo}>{item.titulo}</span>
                  <span className={styles.etapaResumo}>{item.resumo}</span>
                  <span className={styles.etapaContagem}>
                    {item.concluidos}/{item.passos.length}
                  </span>
                  <span className={styles.etapaIcone}>
                    {item.status === 'concluida' ? (
                      <Check size={17} strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <Icone size={20} strokeWidth={1.65} aria-hidden="true" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={styles.marcoAtual}>
          <span>{etapa.id === plano.etapaAtual ? 'Você está aqui' : 'Etapa consultada'}</span>
          <strong>
            {etapa.titulo} · {etapa.marco}
          </strong>
        </div>
      </section>

      <section className={styles.paineis} aria-label={`Evidências para ${etapa.titulo}`}>
        <article className={`${styles.cartao} ${styles.assistente}`}>
          <div className={styles.assistenteTitulo}>
            <span className={styles.botIcone} aria-hidden="true">
              <Bot size={22} strokeWidth={1.8} />
            </span>
            <div>
              <div className={styles.linhaTitulo}>
                <h2>Sobral AI</h2>
                <span className={styles.selo}>Leitura factual</span>
              </div>
              <p>{diagnosticoSobral}</p>
            </div>
          </div>

          <dl className={styles.fatos}>
            <div>
              <dt>
                <BriefcaseBusiness size={14} aria-hidden="true" /> Oferta
              </dt>
              <dd>{oferta ?? 'Ainda não definida'}</dd>
            </div>
            <div>
              <dt>
                <Target size={14} aria-hidden="true" /> Nicho
              </dt>
              <dd>{nicho ?? 'Ainda não definido'}</dd>
            </div>
            <div>
              <dt>
                <Building2 size={14} aria-hidden="true" /> Lead em foco
              </dt>
              <dd>{cliente}</dd>
            </div>
            <div>
              <dt>
                <UserRound size={14} aria-hidden="true" /> Contato
              </dt>
              <dd>{contato}</dd>
            </div>
            <div>
              <dt>
                <Flag size={14} aria-hidden="true" /> Foco
              </dt>
              <dd>{focoSobral}</dd>
            </div>
          </dl>

          <div className={styles.assistenteAcao}>
            <p>Próximo passo da operação</p>
            <strong>{plano.proximoPasso.titulo}</strong>
            <span>{plano.proximoPasso.detalhe}</span>
            <Link href={plano.proximoPasso.destino} className={styles.botaoPrimario}>
              {plano.proximoPasso.acao}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <article className={`${styles.cartao} ${styles.checklist}`}>
          <div className={styles.cartaoCabecalho}>
            <div>
              <p>Etapa consultada</p>
              <h2>{etapa.titulo}</h2>
            </div>
            <span>
              {etapa.concluidos}/{etapa.passos.length} comprovados
            </span>
          </div>

          <p className={styles.contextoEtapa}>{etapa.contexto}</p>

          <ol className={styles.listaChecklist}>
            {etapa.passos.map((item) => (
              <li key={item.id} className={item.concluido ? styles.itemConcluido : undefined}>
                <span className={styles.estadoChecklist} aria-hidden="true">
                  {item.concluido ? <Check size={14} strokeWidth={2.5} /> : <Circle size={17} />}
                </span>
                <span>
                  <strong>{item.titulo}</strong>
                  <small>{item.detalhe}</small>
                  <em>{item.evidencia}</em>
                </span>
              </li>
            ))}
          </ol>
        </article>

        <aside className={styles.hoje}>
          <h2>Agora na operação</h2>
          <div className={styles.agenda}>
            <Link href={plano.proximoPasso.destino} className={styles.agendaItem}>
              <span className={styles.agendaIcone} aria-hidden="true">
                <CalendarDays size={18} strokeWidth={1.8} />
              </span>
              <span>
                <small>Ação prioritária</small>
                <strong>{plano.proximoPasso.titulo}</strong>
                <em>{plano.proximoPasso.evidencia}</em>
              </span>
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>

            <Link href="/crm" className={styles.agendaItem}>
              <span className={styles.agendaIcone} aria-hidden="true">
                <Building2 size={18} strokeWidth={1.8} />
              </span>
              <span>
                <small>Oportunidade em foco</small>
                <strong>{cliente}</strong>
                <em>{proximaAcao ?? 'Defina a próxima ação no CRM'}</em>
              </span>
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>

            <Link href="/mentorias" className={styles.agendaItem}>
              <span className={styles.agendaIcone} aria-hidden="true">
                <Phone size={18} strokeWidth={1.8} />
              </span>
              <span>
                <small>Próximo encontro</small>
                <strong>{proximaMentoria ?? 'Mentoria de implementação'}</strong>
                <em>Leve a evidência que está impedindo o avanço</em>
              </span>
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>

          <Link href="/consultor" className={styles.linkAgenda}>
            Revisar plano no Sobral AI
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <footer className={styles.ajuda}>
        <HelpCircle size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Dúvidas sobre esta etapa? Use o Sobral AI ou consulte o guia:</span>
        <Link href="/consultor">
          {etapa.guia}
          <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
