import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  ContactRound,
  DraftingCompass,
  FileSignature,
  FolderKanban,
  GraduationCap,
  LockKeyhole,
  Search,
  Users,
  Video,
} from 'lucide-react';
import {
  destinoDeUpgrade,
  PLANOS_SUBIDO,
  planoTemRecurso,
  RECURSOS_SUBIDO,
  type PlanoSubido,
  type RecursoPlano,
} from '@/lib/planos/acessos';
import styles from './MapaJornada.module.css';

type Props = {
  nome: string | null;
  plano: PlanoSubido;
};

type Atalho = {
  titulo: string;
  contexto: string;
  descricao: string;
  acao: string;
  href: string;
  recurso: RecursoPlano;
  icone: ReactNode;
};

const ICONE = 25;
const TRACO = 1.65;

const ATALHOS: readonly Atalho[] = [
  {
    titulo: 'Formações',
    contexto: 'Aprender',
    descricao: 'Domine os fundamentos para vender e entregar com segurança.',
    acao: 'Ver formações',
    href: '/formacoes',
    recurso: 'aprendizado',
    icone: <GraduationCap size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Projetos',
    contexto: 'Construir',
    descricao: 'Aprenda um projeto de IA completo, do escopo à entrega.',
    acao: 'Ver projetos',
    href: '/solucoes',
    recurso: 'projetos',
    icone: <BriefcaseBusiness size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Estúdio',
    contexto: 'Personalizar',
    descricao: 'Adapte um projeto ao contexto real do seu cliente.',
    acao: 'Abrir Estúdio',
    href: '/builder',
    recurso: 'estudio',
    icone: <DraftingCompass size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Mentorias',
    contexto: 'Destravar',
    descricao: 'Leve sua dúvida para uma sessão ao vivo com especialistas.',
    acao: 'Ver mentorias',
    href: '/mentorias',
    recurso: 'mentorias',
    icone: <Users size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Prospecção',
    contexto: 'Encontrar clientes',
    descricao: 'Encontre empresas e contatos com potencial para abordar.',
    acao: 'Buscar empresas',
    href: '/prospeccao',
    recurso: 'prospeccao',
    icone: <Search size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Vendas',
    contexto: 'Avançar negócios',
    descricao: 'Organize oportunidades e saiba qual ação fazer agora.',
    acao: 'Abrir vendas',
    href: '/vendas',
    recurso: 'vendas',
    icone: <ContactRound size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Reuniões',
    contexto: 'Conversar',
    descricao: 'Prepare, conduza e registre cada conversa com o cliente.',
    acao: 'Ver reuniões',
    href: '/reunioes',
    recurso: 'reunioes',
    icone: <Video size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Propostas',
    contexto: 'Fechar',
    descricao: 'Crie e acompanhe propostas conectadas às oportunidades.',
    acao: 'Ver propostas',
    href: '/propostas',
    recurso: 'propostas',
    icone: <FileSignature size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Entregas',
    contexto: 'Executar',
    descricao: 'Conduza o projeto aprovado até a entrega ao cliente.',
    acao: 'Ver entregas',
    href: '/entregas',
    recurso: 'projetos',
    icone: <FolderKanban size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
];

function saudacaoAtual() {
  const hora = Number(
    new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date()),
  );
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}

/**
 * Guia direto das áreas da plataforma. Cada card leva ao trabalho em um clique
 * e explica o acesso ao plano antes de qualquer tentativa frustrada.
 */
export function MapaJornada({ nome, plano }: Props) {
  const data = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  });
  const saudacao = saudacaoAtual();

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <header className={styles.abertura}>
        <span className={styles.data}>{data}</span>
        <h1>
          {saudacao}
          {nome ? `, ${nome}` : ''}.
        </h1>
        <p>Escolha o que precisa fazer agora.</p>
      </header>

      <section className={styles.areas} aria-labelledby="titulo-areas-inicio">
        <div className={styles.cabecalhoAreas}>
          <div>
            <span>Áreas da plataforma</span>
            <h2 id="titulo-areas-inicio">Um clique para continuar.</h2>
          </div>
          <p>Aprenda, venda e entregue projetos de IA.</p>
        </div>

        <nav className={styles.grade} aria-label="Atalhos da plataforma">
          {ATALHOS.map((atalho, indice) => {
            const bloqueado = !planoTemRecurso(plano, atalho.recurso);
            const planoNecessario = PLANOS_SUBIDO[RECURSOS_SUBIDO[atalho.recurso].planoMinimo].nome;
            const destino = bloqueado ? destinoDeUpgrade(atalho.recurso, '/inicio') : atalho.href;

            return (
              <Link
                key={atalho.titulo}
                href={destino}
                className={styles.cartao}
                data-bloqueado={bloqueado || undefined}
                aria-label={
                  bloqueado
                    ? `${atalho.titulo}: conhecer plano ${planoNecessario}`
                    : `${atalho.acao}: ${atalho.titulo}`
                }
              >
                <div className={styles.cartaoTopo}>
                  <span className={styles.icone}>{atalho.icone}</span>
                  <span className={styles.numero}>{String(indice + 1).padStart(2, '0')}</span>
                </div>
                <span className={styles.contexto}>{atalho.contexto}</span>
                <h3>{atalho.titulo}</h3>
                <p>{atalho.descricao}</p>
                <span className={styles.acao}>
                  {bloqueado ? (
                    <>
                      <LockKeyhole size={15} strokeWidth={1.8} aria-hidden="true" />
                      Conhecer plano {planoNecessario}
                    </>
                  ) : (
                    <>
                      {atalho.acao}
                      <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
                    </>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      </section>
    </div>
  );
}
