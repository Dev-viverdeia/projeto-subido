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
  LockKeyhole,
  Search,
  UsersRound,
  Video,
} from 'lucide-react';
import { planoTemRecurso, type PlanoSubido, type RecursoPlano } from '@/lib/planos/acessos';
import styles from './MapaJornada.module.css';

type Props = {
  nome: string | null;
  plano?: PlanoSubido;
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
    recurso: 'modulo_comercial',
  },
  {
    href: '/vendas',
    rotulo: 'Conduzir a venda',
    titulo: 'Vendas',
    descricao: 'Trabalhe cada oportunidade com uma próxima ação clara.',
    acao: 'Abrir oportunidades',
    Icone: ContactRound,
    recurso: 'modulo_comercial',
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
    recurso: 'modulo_comercial',
  },
] as const;

type Area = (typeof AREAS_APRENDER)[number] | (typeof AREAS_OPERAR)[number];

function CartoesAreas({
  titulo,
  sobretitulo,
  areas,
  plano,
}: {
  titulo: string;
  sobretitulo: string;
  areas: readonly Area[];
  plano: PlanoSubido;
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
        {areas.map(({ href, rotulo, titulo: nomeArea, descricao, acao, Icone, ...area }) => {
          const recurso = 'recurso' in area ? (area.recurso as RecursoPlano) : null;
          const bloqueado = Boolean(recurso && !planoTemRecurso(plano, recurso));
          const destino = bloqueado
            ? `/conta?upgrade=${recurso}&origem=${encodeURIComponent(href)}`
            : href;

          return (
            <Link
              href={destino}
              className={styles.cartaoArea}
              data-bloqueado={bloqueado || undefined}
              aria-label={bloqueado ? `${nomeArea}, disponível no Pro` : undefined}
              key={href}
            >
              <span className={styles.areaTopo}>
                <small>{rotulo}</small>
                {bloqueado ? (
                  <span className={styles.seloPro} aria-hidden="true">
                    <LockKeyhole size={11} strokeWidth={1.9} /> Pro
                  </span>
                ) : (
                  <Icone size={18} strokeWidth={1.7} aria-hidden="true" />
                )}
              </span>
              <strong>{nomeArea}</strong>
              <p>{descricao}</p>
              <span className={styles.areaAcao}>
                {bloqueado ? 'Ver acesso do plano' : acao}{' '}
                <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MapaJornada({ nome, plano = 'pro', proximaMentoria }: Props) {
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
            {planoTemRecurso(plano, 'modulo_comercial')
              ? 'Aprenda, encontre clientes, venda e entregue seus projetos de IA em um só lugar.'
              : 'Aprenda, prepare e entregue projetos de IA com orientação em cada etapa.'}
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

      <CartoesAreas
        titulo="Aprenda e prepare o que você vai entregar."
        sobretitulo="Aprender e construir"
        areas={AREAS_APRENDER}
        plano={plano}
      />
      <CartoesAreas
        titulo="Encontre clientes e conduza cada venda."
        sobretitulo="Operação comercial"
        areas={AREAS_OPERAR}
        plano={plano}
      />
    </div>
  );
}
