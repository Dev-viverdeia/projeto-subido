'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
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
import styles from './MapaJornada.module.css';

type IdEtapa = 'aprender' | 'prospectar' | 'vender' | 'entregar' | 'evoluir';

type Etapa = {
  id: IdEtapa;
  numero: string;
  titulo: string;
  resumo: string;
  marco: string;
  destino: string;
  acao: string;
  contexto: string;
  guia: string;
  icone: typeof Flag;
  checklist: Array<{ titulo: string; detalhe: string }>;
};

const ETAPAS: Etapa[] = [
  {
    id: 'aprender',
    numero: '01',
    titulo: 'Aprender',
    resumo: 'Fundamentos e mentalidade',
    marco: 'escolher seu primeiro projeto',
    destino: '/formacoes',
    acao: 'Continuar formação essencial',
    contexto:
      'Comece pela base necessária para conversar com clientes e reconhecer oportunidades reais de implementação.',
    guia: 'Como transformar aprendizado em serviço',
    icone: Flag,
    checklist: [
      {
        titulo: 'Concluir fundamentos de IA',
        detalhe: 'Domine conceitos, limites e boas práticas.',
      },
      {
        titulo: 'Escolher um nicho inicial',
        detalhe: 'Defina onde você vai concentrar sua prospecção.',
      },
      { titulo: 'Selecionar um projeto padrão', detalhe: 'Comece com uma entrega já estruturada.' },
      {
        titulo: 'Preparar seu posicionamento',
        detalhe: 'Explique com clareza o problema que você resolve.',
      },
    ],
  },
  {
    id: 'prospectar',
    numero: '02',
    titulo: 'Prospectar',
    resumo: 'Atrair e qualificar oportunidades',
    marco: 'realizar a chamada de descoberta',
    destino: '/consultor',
    acao: 'Preparar chamada de descoberta',
    contexto:
      'Organize as informações do lead, identifique sinais de oportunidade e chegue à conversa sabendo o que precisa descobrir.',
    guia: 'Roteiro da primeira conversa comercial',
    icone: Search,
    checklist: [
      { titulo: 'Definir o cliente ideal', detalhe: 'Escolha perfil, segmento e sinais de dor.' },
      { titulo: 'Criar a lista inicial', detalhe: 'Reúna leads aderentes ao projeto escolhido.' },
      { titulo: 'Enriquecer os contatos', detalhe: 'Adicione contexto útil antes da abordagem.' },
      { titulo: 'Agendar a descoberta', detalhe: 'Converta interesse em uma conversa objetiva.' },
    ],
  },
  {
    id: 'vender',
    numero: '03',
    titulo: 'Vender',
    resumo: 'Preparar e enviar propostas',
    marco: 'preparar sua primeira proposta',
    destino: '/builder',
    acao: 'Concluir diagnóstico do cliente',
    contexto:
      'Com base na chamada de descoberta, o Sobral AI organiza os fatos, as dores e os objetivos para transformar contexto em proposta.',
    guia: 'Como preparar uma proposta vencedora',
    icone: FileText,
    checklist: [
      {
        titulo: 'Concluir diagnóstico do cliente',
        detalhe: 'Entenda contexto, objetivos e restrições do projeto.',
      },
      {
        titulo: 'Definir escopo e entregáveis',
        detalhe: 'Transforme os objetivos em entregáveis claros.',
      },
      {
        titulo: 'Construir proposta comercial',
        detalhe: 'Inclua abordagem, cronograma e investimento.',
      },
      { titulo: 'Validar com o cliente', detalhe: 'Apresente a proposta e alinhe ajustes finais.' },
      { titulo: 'Enviar proposta', detalhe: 'Registre o envio e programe o acompanhamento.' },
    ],
  },
  {
    id: 'entregar',
    numero: '04',
    titulo: 'Entregar',
    resumo: 'Executar e gerar resultados',
    marco: 'iniciar a implementação guiada',
    destino: '/solucoes',
    acao: 'Abrir projeto de implementação',
    contexto:
      'Use o projeto vendido como plano de execução: etapas, ferramentas, validações e registros do cliente em um só lugar.',
    guia: 'Como conduzir uma implementação impecável',
    icone: CheckCircle2,
    checklist: [
      {
        titulo: 'Confirmar plano de entrega',
        detalhe: 'Congele objetivos, responsáveis e critérios de sucesso.',
      },
      { titulo: 'Configurar ferramentas', detalhe: 'Prepare acessos, ambientes e integrações.' },
      { titulo: 'Implementar passo a passo', detalhe: 'Execute o playbook e registre evidências.' },
      { titulo: 'Validar com o cliente', detalhe: 'Teste o resultado no cenário real.' },
    ],
  },
  {
    id: 'evoluir',
    numero: '05',
    titulo: 'Evoluir',
    resumo: 'Sistematizar e escalar',
    marco: 'transformar experiência em método',
    destino: '/mentorias',
    acao: 'Planejar o próximo ciclo',
    contexto:
      'Consolide aprendizados, resultados e ativos reutilizáveis para aumentar qualidade, velocidade e previsibilidade nas próximas entregas.',
    guia: 'Como criar uma operação de serviços escalável',
    icone: TrendingUp,
    checklist: [
      {
        titulo: 'Documentar os resultados',
        detalhe: 'Registre ganhos, aprendizados e depoimentos.',
      },
      { titulo: 'Refinar o playbook', detalhe: 'Melhore o método com fatos da entrega.' },
      { titulo: 'Ativar indicações', detalhe: 'Transforme satisfação em novas oportunidades.' },
      {
        titulo: 'Escolher o próximo marco',
        detalhe: 'Decida onde sua operação vai evoluir agora.',
      },
    ],
  },
];

type Props = {
  nome: string | null;
  espacoDeTrabalho: string;
  cliente: string;
  lead: string;
  contato: string;
  proximaMentoria?: string | null;
};

export function MapaJornada({
  nome,
  espacoDeTrabalho,
  cliente,
  lead,
  contato,
  proximaMentoria,
}: Props) {
  const [etapaAtiva, setEtapaAtiva] = useState<IdEtapa>('vender');
  const etapa = ETAPAS.find((item) => item.id === etapaAtiva) ?? ETAPAS[2]!;
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

        <label className={styles.seletorLabel}>
          <span>Espaço de trabalho</span>
          <span className={styles.seletorCasca}>
            <select className={styles.seletor} defaultValue="principal">
              <option value="principal">{espacoDeTrabalho}</option>
            </select>
            <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </label>
      </header>

      <section className={styles.mapa} aria-labelledby="titulo-mapa-jornada">
        <div className={styles.mapaCabecalho}>
          <h1 id="titulo-mapa-jornada">Seu mapa da jornada</h1>
          <p>Siga o caminho completo para construir e escalar sua operação de IA.</p>
        </div>

        <ol className={styles.etapas} aria-label="Etapas da jornada profissional">
          {ETAPAS.map((item) => {
            const Icone = item.icone;
            const ativa = item.id === etapaAtiva;

            return (
              <li key={item.id} className={styles.etapaItem}>
                <button
                  type="button"
                  className={styles.etapaBotao}
                  aria-pressed={ativa}
                  onClick={() => setEtapaAtiva(item.id)}
                >
                  <span className={styles.etapaNumero}>{item.numero}</span>
                  <span className={styles.etapaTitulo}>{item.titulo}</span>
                  <span className={styles.etapaResumo}>{item.resumo}</span>
                  <span className={styles.etapaIcone}>
                    {ativa ? (
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
          <span>Você está aqui</span>
          <strong>
            {etapa.titulo} · {etapa.marco}
          </strong>
        </div>
      </section>

      <section className={styles.paineis} aria-label={`Próximos passos para ${etapa.titulo}`}>
        <article className={`${styles.cartao} ${styles.assistente}`}>
          <div className={styles.assistenteTitulo}>
            <span className={styles.botIcone} aria-hidden="true">
              <Bot size={22} strokeWidth={1.8} />
            </span>
            <div>
              <div className={styles.linhaTitulo}>
                <h2>Sobral AI</h2>
                <span className={styles.selo}>Seu assistente</span>
              </div>
              <p>{etapa.contexto}</p>
            </div>
          </div>

          <dl className={styles.fatos}>
            <div>
              <dt>
                <Building2 size={14} aria-hidden="true" /> Lead
              </dt>
              <dd>{lead}</dd>
            </div>
            <div>
              <dt>
                <UserRound size={14} aria-hidden="true" /> Contato
              </dt>
              <dd>{contato}</dd>
            </div>
            <div>
              <dt>
                <Target size={14} aria-hidden="true" /> Foco atual
              </dt>
              <dd>{etapa.marco}</dd>
            </div>
            <div>
              <dt>
                <Flag size={14} aria-hidden="true" /> Objetivo
              </dt>
              <dd>Avançar com clareza para o próximo marco</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={14} aria-hidden="true" /> Prazo desejado
              </dt>
              <dd>Concluir este ciclo na próxima semana</dd>
            </div>
          </dl>

          <div className={styles.assistenteAcao}>
            <p>Para avançar, seu próximo passo está pronto.</p>
            <Link href={etapa.destino} className={styles.botaoPrimario}>
              {etapa.acao}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <article className={`${styles.cartao} ${styles.checklist}`}>
          <div className={styles.cartaoCabecalho}>
            <h2>Checklist do marco atual</h2>
            <span>{etapa.titulo} · próximo passo</span>
          </div>

          <ol className={styles.listaChecklist}>
            {etapa.checklist.map((item, indice) => {
              const concluido = indice === 0 && etapa.id === 'vender';

              return (
                <li key={item.titulo} className={concluido ? styles.itemConcluido : undefined}>
                  <span className={styles.estadoChecklist} aria-hidden="true">
                    {concluido ? <Check size={14} strokeWidth={2.5} /> : <Circle size={17} />}
                  </span>
                  <span>
                    <strong>{item.titulo}</strong>
                    <small>{item.detalhe}</small>
                  </span>
                </li>
              );
            })}
          </ol>
        </article>

        <aside className={styles.hoje}>
          <h2>Em andamento hoje</h2>
          <div className={styles.agenda}>
            <Link href={etapa.destino} className={styles.agendaItem}>
              <span className={styles.agendaIcone} aria-hidden="true">
                <CalendarDays size={18} strokeWidth={1.8} />
              </span>
              <span>
                <small>09:30</small>
                <strong>{cliente}</strong>
                <em>{etapa.checklist[0]?.titulo}</em>
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
                <em>Tire dúvidas e destrave a execução</em>
              </span>
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>

            <Link href="/builder" className={styles.agendaItem}>
              <span className={styles.agendaIcone} aria-hidden="true">
                <FileText size={18} strokeWidth={1.8} />
              </span>
              <span>
                <small>14:00</small>
                <strong>Revisar escopo da proposta</strong>
                <em>Organize entregáveis e próximos passos</em>
              </span>
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>

          <Link href="/mentorias" className={styles.linkAgenda}>
            Ver agenda completa
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <footer className={styles.ajuda}>
        <HelpCircle size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Dúvidas sobre este passo? Pergunte para o Sobral AI ou consulte o guia:</span>
        <Link href="/consultor">
          {etapa.guia}
          <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
