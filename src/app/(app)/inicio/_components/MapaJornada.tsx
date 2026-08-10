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
  cliente: ReactNode;
  contato: ReactNode;
  proximaAcao?: ReactNode;
  proximaMentoria?: ReactNode;
  oferta: string | null;
  nicho: string | null;
  diagnosticoSobral: ReactNode;
  focoSobral: ReactNode;
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
  const etapaAtual = plano.etapas.find((item) => item.id === plano.etapaAtual) ?? plano.etapas[0]!;
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
        <div className={styles.topoPrincipal}>
          <span className={styles.estadoOperacao}>
            <i aria-hidden="true" /> Sua operação hoje
          </span>
          <p className={styles.saudacao}>Bom dia{nome ? `, ${nome}` : ''}.</p>
          <p className={styles.data}>{dataLonga}</p>
        </div>

        <div className={styles.espaco}>
          <span>Operação acompanhada</span>
          <strong>{espacoDeTrabalho}</strong>
        </div>
      </header>

      <section className={styles.comando} aria-label="Direção de hoje">
        <article className={styles.prioridade}>
          <div className={styles.prioridadeTopo}>
            <span>Sobral AI recomenda</span>
            <em>{etapaAtual.titulo}</em>
          </div>
          <h1>{plano.proximoPasso.titulo}</h1>
          <p>{plano.proximoPasso.detalhe}</p>
          <Link href={plano.proximoPasso.destino} className={styles.botaoPrimario}>
            {plano.proximoPasso.acao}
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
          <div className={styles.evidenciaPrioridade}>
            <CheckCircle2 size={15} strokeWidth={1.9} aria-hidden="true" />
            <span>Avança quando houver evidência:</span>
            <strong>{plano.proximoPasso.evidencia}</strong>
          </div>
        </article>

        <aside className={styles.pulso} aria-label="Pulso da operação">
          <div className={styles.pulsoTopo}>
            <div>
              <span>Ciclo profissional</span>
              <strong>{etapaAtual.titulo}</strong>
            </div>
            <b>{plano.percentual}%</b>
          </div>
          <div className={styles.progressoTrilho} aria-hidden="true">
            <span style={{ width: `${plano.percentual}%` }} />
          </div>
          <p className={styles.progressoTexto}>
            {plano.evidenciasConcluidas} de {plano.totalEvidencias} evidências comprovadas
          </p>

          <dl className={styles.pulsoFatos}>
            <div>
              <dt>
                <Building2 size={15} strokeWidth={1.8} aria-hidden="true" /> Lead em foco
              </dt>
              <dd>{cliente}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" /> Próximo encontro
              </dt>
              <dd>{proximaMentoria ?? 'Mentoria de implementação'}</dd>
            </div>
          </dl>

          <Link href="/consultor" className={styles.revisarPlano}>
            Revisar plano no Sobral AI
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      {configuracao}

      <section className={styles.mapa} aria-labelledby="titulo-mapa-jornada">
        <div className={styles.mapaTopo}>
          <div className={styles.mapaCabecalho}>
            <p>Seu ciclo</p>
            <h2 id="titulo-mapa-jornada">Jornada de operação</h2>
            <span>Escolha uma etapa para ver o que já foi comprovado e o que falta.</span>
          </div>
          <div className={styles.marcoAtual}>
            <span>{etapa.id === plano.etapaAtual ? 'Você está aqui' : 'Etapa consultada'}</span>
            <strong>{etapa.marco}</strong>
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
                  <span className={styles.etapaIcone} aria-hidden="true">
                    {item.status === 'concluida' ? (
                      <Check size={15} strokeWidth={2.6} />
                    ) : (
                      <Icone size={17} strokeWidth={1.7} />
                    )}
                  </span>
                  <span className={styles.etapaTexto}>
                    <small>{item.numero}</small>
                    <strong>{item.titulo}</strong>
                    <em>{item.resumo}</em>
                  </span>
                  <span className={styles.etapaContagem}>
                    {item.concluidos}/{item.passos.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.detalhes} aria-label={`Evidências para ${etapa.titulo}`}>
        <article className={styles.checklist}>
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
          <div className={styles.cartaoCabecalho}>
            <div>
              <p>Execução</p>
              <h2>Fila de hoje</h2>
            </div>
          </div>
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
        </aside>
      </section>

      <section className={styles.sobral} aria-labelledby="titulo-sobral-inicio">
        <div className={styles.sobralIntroducao}>
          <span className={styles.botIcone} aria-hidden="true">
            <Bot size={21} strokeWidth={1.8} />
          </span>
          <div>
            <p>Sobral AI · leitura operacional</p>
            <h2 id="titulo-sobral-inicio">{diagnosticoSobral}</h2>
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
              <Building2 size={14} aria-hidden="true" /> Lead
            </dt>
            <dd>{cliente}</dd>
          </div>
          <div>
            <dt>
              <UserRound size={14} aria-hidden="true" /> Contato
            </dt>
            <dd>{contato}</dd>
          </div>
        </dl>

        <div className={styles.sobralFoco}>
          <span>Foco agora</span>
          <strong>{focoSobral}</strong>
          <Link href="/consultor">
            Abrir consultoria
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className={styles.ajuda}>
        <HelpCircle size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Dúvidas sobre esta etapa? Consulte o guia:</span>
        <Link href="/consultor">
          {etapa.guia}
          <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
