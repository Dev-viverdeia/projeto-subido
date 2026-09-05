import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { IconeProduto } from '@/components/brand/IconeProduto';
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
  variante: 'construir' | 'vender' | 'entregar';
  atalhos: readonly Atalho[];
};

const ICONE = 30;

const GRUPOS: readonly Grupo[] = [
  {
    titulo: 'Aprender e construir',
    variante: 'construir',
    atalhos: [
      {
        titulo: 'Formações',
        descricao: 'Aulas práticas',
        acao: 'Ver formações',
        href: '/formacoes',
        recurso: 'aprendizado',
        icone: <IconeProduto nome="formacoes" tamanho={ICONE} />,
      },
      {
        titulo: 'Projetos',
        descricao: 'Guias de implementação',
        acao: 'Ver projetos',
        href: '/solucoes',
        recurso: 'projetos',
        icone: <IconeProduto nome="projetos" tamanho={ICONE} />,
      },
      {
        titulo: 'Estúdio',
        descricao: 'Projetos personalizados',
        acao: 'Abrir Estúdio',
        href: '/builder',
        recurso: 'estudio',
        icone: <IconeProduto nome="estudio" tamanho={ICONE} />,
      },
      {
        titulo: 'Mentorias',
        descricao: 'Encontros com especialistas',
        acao: 'Ver mentorias',
        href: '/mentorias',
        recurso: 'mentorias',
        icone: <IconeProduto nome="mentorias" tamanho={ICONE} />,
      },
    ],
  },
  {
    titulo: 'Vender',
    variante: 'vender',
    atalhos: [
      {
        titulo: 'Prospecção',
        descricao: 'Encontrar empresas',
        acao: 'Buscar empresas',
        href: '/prospeccao',
        recurso: 'prospeccao',
        icone: <IconeProduto nome="prospeccao" tamanho={ICONE} />,
      },
      {
        titulo: 'Vendas',
        descricao: 'Acompanhar oportunidades',
        acao: 'Abrir vendas',
        href: '/vendas',
        recurso: 'vendas',
        icone: <IconeProduto nome="vendas" tamanho={ICONE} />,
      },
      {
        titulo: 'Reuniões',
        descricao: 'Calls com Live Coach',
        acao: 'Ver reuniões',
        href: '/reunioes',
        recurso: 'reunioes',
        icone: <IconeProduto nome="reunioes" tamanho={ICONE} />,
      },
      {
        titulo: 'Propostas',
        descricao: 'Criar e enviar propostas',
        acao: 'Ver propostas',
        href: '/propostas',
        recurso: 'propostas',
        icone: <IconeProduto nome="propostas" tamanho={ICONE} />,
      },
    ],
  },
  {
    titulo: 'Entregar',
    variante: 'entregar',
    atalhos: [
      {
        titulo: 'Entregas',
        descricao: 'Acompanhar projetos de clientes',
        acao: 'Ver entregas',
        href: '/entregas',
        recurso: 'projetos',
        icone: <IconeProduto nome="entregas" tamanho={ICONE} />,
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
      prefetch={false}
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
        <h1>
          {saudacao}
          {nome ? `, ${nome}` : ''}.
        </h1>
      </header>

      <nav className={styles.painel} aria-label="Atalhos da plataforma">
        {GRUPOS.map((grupo) => (
          <section
            key={grupo.titulo}
            className={`${styles.etapa} ${grupo.variante === 'entregar' ? styles.entregar : ''}`}
            aria-labelledby={`titulo-${grupo.variante}`}
          >
            <header className={grupo.variante === 'entregar' ? 'sr-only' : styles.cabecalhoEtapa}>
              <h2 id={`titulo-${grupo.variante}`}>{grupo.titulo}</h2>
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
