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
import styles from './MapaJornadaPremium.module.css';

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

type Grupo = {
  titulo: string;
  descricao: string;
  variante: 'construir' | 'vender' | 'entregar';
  atalhos: readonly Atalho[];
};

const ICONE = 22;
const TRACO = 1.65;

const GRUPOS: readonly Grupo[] = [
  {
    titulo: 'Aprender e construir',
    descricao: 'Domine o método.',
    variante: 'construir',
    atalhos: [
      {
        titulo: 'Formações',
        descricao: 'Aprender',
        acao: 'Ver formações',
        href: '/formacoes',
        recurso: 'aprendizado',
        icone: <GraduationCap size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
      {
        titulo: 'Projetos',
        descricao: 'Implementar',
        acao: 'Ver projetos',
        href: '/solucoes',
        recurso: 'projetos',
        icone: <BriefcaseBusiness size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
      {
        titulo: 'Estúdio',
        descricao: 'Personalizar',
        acao: 'Abrir Estúdio',
        href: '/builder',
        recurso: 'estudio',
        icone: <DraftingCompass size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
      {
        titulo: 'Mentorias',
        descricao: 'Destravar',
        acao: 'Ver mentorias',
        href: '/mentorias',
        recurso: 'mentorias',
        icone: <Users size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
    ],
  },
  {
    titulo: 'Vender',
    descricao: 'Do lead ao contrato.',
    variante: 'vender',
    atalhos: [
      {
        titulo: 'Prospecção',
        descricao: 'Encontrar clientes',
        acao: 'Buscar empresas',
        href: '/prospeccao',
        recurso: 'prospeccao',
        icone: <Search size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
      {
        titulo: 'Vendas',
        descricao: 'Avançar oportunidades',
        acao: 'Abrir vendas',
        href: '/vendas',
        recurso: 'vendas',
        icone: <ContactRound size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
      {
        titulo: 'Reuniões',
        descricao: 'Conduzir calls',
        acao: 'Ver reuniões',
        href: '/reunioes',
        recurso: 'reunioes',
        icone: <Video size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
      {
        titulo: 'Propostas',
        descricao: 'Fechar',
        acao: 'Ver propostas',
        href: '/propostas',
        recurso: 'propostas',
        icone: <FileSignature size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
    ],
  },
  {
    titulo: 'Entregar',
    descricao: 'Execute com método.',
    variante: 'entregar',
    atalhos: [
      {
        titulo: 'Entregas',
        descricao: 'Executar projetos',
        acao: 'Ver entregas',
        href: '/entregas',
        recurso: 'projetos',
        icone: <FolderKanban size={ICONE} strokeWidth={TRACO} aria-hidden="true" />,
      },
    ],
  },
] as const;

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

function AtalhoJornada({ atalho, plano }: { atalho: Atalho; plano: PlanoSubido }) {
  const bloqueado = !planoTemRecurso(plano, atalho.recurso);
  const planoNecessario = PLANOS_SUBIDO[RECURSOS_SUBIDO[atalho.recurso].planoMinimo].nome;
  const destino = bloqueado ? destinoDeUpgrade(atalho.recurso, '/inicio') : atalho.href;

  return (
    <Link
      href={destino}
      className={styles.atalho}
      data-bloqueado={bloqueado || undefined}
      aria-label={
        bloqueado
          ? `${atalho.titulo}: conhecer plano ${planoNecessario}`
          : `${atalho.acao}: ${atalho.titulo}`
      }
    >
      <span className={styles.icone}>{atalho.icone}</span>
      <span className={styles.conteudoAtalho}>
        <strong>{atalho.titulo}</strong>
        <span>{atalho.descricao}</span>
      </span>
      <span className={styles.destino} aria-hidden="true">
        {bloqueado ? (
          <>
            <LockKeyhole size={15} strokeWidth={1.8} />
            <span>{planoNecessario}</span>
          </>
        ) : (
          <ArrowUpRight size={19} strokeWidth={1.7} />
        )}
      </span>
    </Link>
  );
}

/** Painel de entrada: um clique para aprender, vender ou entregar um projeto de IA. */
export function MapaJornada({ nome, plano }: Props) {
  const saudacao = saudacaoAtual();

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <header className={styles.abertura}>
        <span className={styles.saudacao}>
          {saudacao}
          {nome ? `, ${nome}` : ''}.
        </span>
        <h1>Qual é o próximo movimento?</h1>
      </header>

      <nav className={styles.painel} aria-label="Atalhos da plataforma">
        {GRUPOS.map((grupo) => (
          <section
            key={grupo.titulo}
            className={`${styles.etapa} ${styles[grupo.variante]}`}
            data-on-dark={grupo.variante === 'vender' || undefined}
            aria-labelledby={`titulo-${grupo.variante}`}
          >
            <header className={styles.cabecalhoEtapa}>
              <h2 id={`titulo-${grupo.variante}`}>{grupo.titulo}</h2>
              <p>{grupo.descricao}</p>
            </header>

            <div className={styles.listaAtalhos}>
              {grupo.atalhos.map((atalho) => (
                <AtalhoJornada key={atalho.titulo} atalho={atalho} plano={plano} />
              ))}
            </div>
          </section>
        ))}
      </nav>
    </div>
  );
}
