import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
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
  descricao: string;
  acao: string;
  href: string;
  recurso: RecursoPlano;
  icone: ReactNode;
};

const ICONE = 23;
const TRACO = 1.65;

const ATALHOS_PRINCIPAIS: readonly Atalho[] = [
  {
    titulo: 'Formações',
    descricao: 'Aprenda o método.',
    acao: 'Ver formações',
    href: '/formacoes',
    recurso: 'aprendizado',
    icone: <GraduationCap size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Projetos',
    descricao: 'Implemente passo a passo.',
    acao: 'Ver projetos',
    href: '/solucoes',
    recurso: 'projetos',
    icone: <BriefcaseBusiness size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Prospecção',
    descricao: 'Encontre potenciais clientes.',
    acao: 'Buscar empresas',
    href: '/prospeccao',
    recurso: 'prospeccao',
    icone: <Search size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Vendas',
    descricao: 'Avance cada oportunidade.',
    acao: 'Abrir vendas',
    href: '/vendas',
    recurso: 'vendas',
    icone: <ContactRound size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Reuniões',
    descricao: 'Conduza conversas melhores.',
    acao: 'Ver reuniões',
    href: '/reunioes',
    recurso: 'reunioes',
    icone: <Video size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Entregas',
    descricao: 'Execute o projeto aprovado.',
    acao: 'Ver entregas',
    href: '/entregas',
    recurso: 'projetos',
    icone: <FolderKanban size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
];

const ATALHOS_RAPIDOS: readonly Atalho[] = [
  {
    titulo: 'Estúdio',
    descricao: 'Personalize um projeto.',
    acao: 'Abrir Estúdio',
    href: '/builder',
    recurso: 'estudio',
    icone: <DraftingCompass size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Mentorias',
    descricao: 'Fale com especialistas.',
    acao: 'Ver mentorias',
    href: '/mentorias',
    recurso: 'mentorias',
    icone: <Users size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
  },
  {
    titulo: 'Propostas',
    descricao: 'Crie e acompanhe.',
    acao: 'Ver propostas',
    href: '/propostas',
    recurso: 'propostas',
    icone: <FileSignature size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
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

function AtalhoJornada({
  atalho,
  plano,
  compacto = false,
}: {
  atalho: Atalho;
  plano: PlanoSubido;
  compacto?: boolean;
}) {
  const bloqueado = !planoTemRecurso(plano, atalho.recurso);
  const planoNecessario = PLANOS_SUBIDO[RECURSOS_SUBIDO[atalho.recurso].planoMinimo].nome;
  const destino = bloqueado ? destinoDeUpgrade(atalho.recurso, '/inicio') : atalho.href;

  return (
    <Link
      href={destino}
      className={`${styles.cartao} ${compacto ? styles.cartaoCompacto : ''}`}
      data-bloqueado={bloqueado || undefined}
      aria-label={
        bloqueado
          ? `${atalho.titulo}: conhecer plano ${planoNecessario}`
          : `${atalho.acao}: ${atalho.titulo}`
      }
    >
      <span className={styles.icone}>{atalho.icone}</span>
      <span className={styles.conteudoCartao}>
        <strong>{atalho.titulo}</strong>
        <span>{atalho.descricao}</span>
      </span>
      <span className={styles.destino} aria-hidden="true">
        {bloqueado ? (
          <>
            <LockKeyhole size={16} strokeWidth={1.8} />
            <span>{planoNecessario}</span>
          </>
        ) : (
          <ArrowUpRight size={19} strokeWidth={1.7} />
        )}
      </span>
    </Link>
  );
}

/** Guia direto das áreas da plataforma, com hierarquia e uma decisão por clique. */
export function MapaJornada({ nome, plano }: Props) {
  const saudacao = saudacaoAtual();

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <header className={`${styles.abertura} via-on-dark`} data-on-dark>
        <span className={styles.saudacao}>
          {saudacao}
          {nome ? `, ${nome}` : ''}.
        </span>
        <h1>O que você quer fazer agora?</h1>
      </header>

      <section className={styles.areas} aria-labelledby="titulo-areas-inicio">
        <h2 id="titulo-areas-inicio">Escolha uma área.</h2>

        <nav className={styles.navegacao} aria-label="Atalhos da plataforma">
          <div className={styles.gradePrincipal}>
            {ATALHOS_PRINCIPAIS.map((atalho) => (
              <AtalhoJornada key={atalho.titulo} atalho={atalho} plano={plano} />
            ))}
          </div>

          <div className={styles.gradeRapida}>
            {ATALHOS_RAPIDOS.map((atalho) => (
              <AtalhoJornada key={atalho.titulo} atalho={atalho} plano={plano} compacto />
            ))}
          </div>
        </nav>
      </section>
    </div>
  );
}
