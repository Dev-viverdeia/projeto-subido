import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ContactRound,
  DraftingCompass,
  FileSignature,
  GraduationCap,
  Search,
  UserRound,
  UsersRound,
  Video,
} from 'lucide-react';
import styles from './MapaJornada.module.css';

type Props = {
  nome: string | null;
  cliente: ReactNode;
  contato: ReactNode;
  proximaAcao?: ReactNode;
  proximaMentoria?: ReactNode;
};

const AREAS_APRENDER = [
  {
    href: '/formacoes',
    rotulo: 'Aprendizado',
    titulo: 'Formações',
    descricao: 'Aprenda os fundamentos e avance no seu ritmo.',
    acao: 'Continuar aprendendo',
    Icone: GraduationCap,
  },
  {
    href: '/solucoes',
    rotulo: 'Implementação',
    titulo: 'Projetos',
    descricao: 'Escolha o que vender e siga a entrega passo a passo.',
    acao: 'Explorar projetos',
    Icone: BriefcaseBusiness,
  },
  {
    href: '/builder',
    rotulo: 'Personalização',
    titulo: 'Estúdio',
    descricao: 'Transforme uma dor real em um projeto sob medida.',
    acao: 'Criar um projeto',
    Icone: DraftingCompass,
  },
  {
    href: '/mentorias',
    rotulo: 'Ao vivo',
    titulo: 'Mentorias',
    descricao: 'Leve um desafio real e receba ajuda para avançar.',
    acao: 'Ver encontros',
    Icone: UsersRound,
  },
] as const;

const AREAS_OPERAR = [
  {
    href: '/prospeccao',
    rotulo: 'Encontrar clientes',
    titulo: 'Prospecção',
    descricao: 'Crie listas de empresas com contatos para abordar.',
    acao: 'Buscar empresas',
    Icone: Search,
  },
  {
    href: '/vendas',
    rotulo: 'Conduzir a venda',
    titulo: 'Vendas',
    descricao: 'Trabalhe cada oportunidade com uma próxima ação clara.',
    acao: 'Abrir oportunidades',
    Icone: ContactRound,
  },
  {
    href: '/reunioes',
    rotulo: 'Conversar',
    titulo: 'Reuniões',
    descricao: 'Agende, conduza e registre as conversas com seus clientes.',
    acao: 'Ver reuniões',
    Icone: Video,
  },
  {
    href: '/propostas',
    rotulo: 'Fechar o projeto',
    titulo: 'Propostas',
    descricao: 'Monte, apresente e acompanhe suas propostas comerciais.',
    acao: 'Abrir propostas',
    Icone: FileSignature,
  },
] as const;

type Area = (typeof AREAS_APRENDER)[number] | (typeof AREAS_OPERAR)[number];

function CartoesAreas({
  titulo,
  sobretitulo,
  areas,
}: {
  titulo: string;
  sobretitulo: string;
  areas: readonly Area[];
}) {
  const id = `area-${sobretitulo.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <section className={styles.areas} aria-labelledby={id}>
      <div className={styles.secaoCabecalho}>
        <div>
          <p>{sobretitulo}</p>
          <h2 id={id}>{titulo}</h2>
        </div>
      </div>
      <div className={styles.gradeAreas}>
        {areas.map(({ href, rotulo, titulo: nomeArea, descricao, acao, Icone }) => (
          <Link href={href} className={styles.cartaoArea} key={href}>
            <span className={styles.areaTopo}>
              <small>{rotulo}</small>
              <Icone size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <strong>{nomeArea}</strong>
            <p>{descricao}</p>
            <span className={styles.areaAcao}>
              {acao} <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MapaJornada({ nome, cliente, contato, proximaAcao, proximaMentoria }: Props) {
  const dataLonga = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <section className={styles.abertura} aria-label="Resumo do dia">
        <div className={styles.boasVindas}>
          <span className={styles.eyebrow}>{dataLonga}</span>
          <p>{nome ? `${nome},` : 'Olá,'}</p>
          <h1>bem-vindo.</h1>
          <strong>
            Aprenda, encontre clientes, venda e entregue seus projetos de IA em um só lugar.
          </strong>
        </div>

        <Link href="/mentorias" className={styles.mentoriaDestaque}>
          <span className={styles.mentoriaTopo}>
            <small>Próxima mentoria</small>
            <em>Ver agenda</em>
          </span>
          <CalendarDays size={22} strokeWidth={1.65} aria-hidden="true" />
          <strong>{proximaMentoria ?? 'Mentoria de implementação'}</strong>
          <p>Leve uma dúvida real da sua venda ou entrega.</p>
          <span className={styles.mentoriaAcao}>
            Ver próxima sessão <ArrowRight size={15} aria-hidden="true" />
          </span>
        </Link>
      </section>

      <section className={styles.emAndamento} aria-labelledby="titulo-andamento">
        <div className={styles.secaoCabecalho}>
          <div>
            <p>Em andamento</p>
            <h2 id="titulo-andamento">O que já está na sua mesa.</h2>
          </div>
        </div>
        <Link href="/vendas" className={styles.clienteEmFoco}>
          <span className={styles.clienteIcone}>
            <BriefcaseBusiness size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className={styles.clienteTexto}>
            <small>Oportunidade em foco</small>
            <strong>{cliente}</strong>
            <em>
              <UserRound size={13} aria-hidden="true" /> {contato}
            </em>
          </span>
          <span className={styles.clienteAcao}>
            <small>Próxima ação</small>
            <strong>{proximaAcao ?? 'Defina a próxima ação da venda'}</strong>
          </span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <CartoesAreas
        titulo="Aprenda e prepare o que você vai entregar."
        sobretitulo="Aprender e construir"
        areas={AREAS_APRENDER}
      />
      <CartoesAreas
        titulo="Encontre clientes e conduza cada venda."
        sobretitulo="Operação comercial"
        areas={AREAS_OPERAR}
      />
    </div>
  );
}
