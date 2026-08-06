import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { listarThreads } from '@/lib/consultor/queries';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { ICONES_CATEGORIAS, ICONE_CATEGORIA_PADRAO } from '../_components/iconesCategorias';
import entrada from '../_components/entrada.module.css';
import { ITENS_NAV } from '../_components/navegacao';
import { horaCurta, rotuloDoDia } from '../mentorias/_components/estadoMentoria';
import { CartaoSolucao } from '../solucoes/_components/CartaoSolucao';
import { FatosLocais } from './_components/FatosLocais';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Início' };

/**
 * O INÍCIO: saudação, o mapa da plataforma com o número real de cada pilar,
 * os dois gráficos de progresso e o trilho do agora (retomada + mentoria).
 *
 * SEM NÚMERO INVENTADO — a regra que este painel sempre carregou, agora com
 * mais números: aulas/etapas/certificados derivam do progresso local deste
 * navegador (cliente); projetos, conversas e a agenda vêm do banco via RLS.
 * Todo tile leva para a tela dona do número.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, solucoes, formacoes, agenda, projetos, conversas] = await Promise.all([
    supabase.auth.getClaims(),
    listarSolucoes(),
    listarFormacoes(),
    listarAgenda(),
    listarSolucoesDoBuilder(),
    listarThreads(),
  ]);

  const claims = data?.claims;
  const meta = (claims?.user_metadata ?? {}) as { nome?: string };
  const nome = meta.nome?.split(' ')[0] ?? null;

  const agora = new Date();
  const dataLonga = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  /* A agenda já vem ordenada por início; sobra descartar o que terminou. */
  const proximaMentoria = agenda.find((s) => new Date(s.fimIso).getTime() > agora.getTime());
  const mentoriaCurta = proximaMentoria
    ? `${rotuloDoDia(proximaMentoria.inicioIso, agora).principal === 'Hoje' ? 'HOJE' : rotuloDoDia(proximaMentoria.inicioIso, agora).mono} · ${horaCurta(proximaMentoria.inicioIso)}`
    : null;

  const recentes = solucoes.slice(0, 3);

  /* O ícone de cada destino é o MESMO elemento já renderizado do trilho de
     navegação — uma fonte só para a iconografia da plataforma. */
  const iconePorRota = new Map(ITENS_NAV.map((i) => [i.href, i.icone]));
  const sessoesFuturas = agenda.filter((s) => new Date(s.fimIso).getTime() > agora.getTime());

  const destinos = [
    {
      href: '/solucoes' as const,
      rotulo: 'Soluções de IA',
      descricao: 'O catálogo pronto para implantar no cliente.',
      dado: `${solucoes.length} ${solucoes.length === 1 ? 'solução publicada' : 'soluções publicadas'}`,
    },
    {
      href: '/formacoes' as const,
      rotulo: 'Formações',
      descricao: 'As trilhas que formam o implementador.',
      dado: `${formacoes.length} ${formacoes.length === 1 ? 'trilha' : 'trilhas'}`,
    },
    {
      href: '/builder' as const,
      rotulo: 'Builder',
      descricao: 'Do problema do cliente ao plano de implementação.',
      dado: `${projetos.length} ${projetos.length === 1 ? 'projeto formulado' : 'projetos formulados'}`,
    },
    {
      href: '/consultor' as const,
      rotulo: 'Consultor',
      descricao: 'Descreva o cenário e receba a solução certa.',
      dado: `${conversas.length} ${conversas.length === 1 ? 'conversa' : 'conversas'}`,
    },
    {
      href: '/mentorias' as const,
      rotulo: 'Mentorias',
      descricao: 'Sessões ao vivo com quem já implementou.',
      dado: mentoriaCurta
        ? `próxima ${mentoriaCurta}`
        : `${sessoesFuturas.length} ${sessoesFuturas.length === 1 ? 'sessão na agenda' : 'sessões na agenda'}`,
    },
    {
      href: '/certificados' as const,
      rotulo: 'Certificados',
      descricao: 'O registro do que você concluiu.',
      dado: 'formações e soluções',
    },
  ].map((d) => ({ ...d, icone: iconePorRota.get(d.href) }));

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Início" oculto />

      {/* O HERO: a única banda escura da tela — o momento. Saudação e os fatos
          reais à esquerda; a próxima mentoria como o AGORA à direita, composta
          nativamente sobre a navy (não um card claro pousado no escuro). */}
      <header className={`${entrada.bloco} ${styles.hero} via-mesh-navy via-noise`}>
        <div className={styles.heroEsquerda}>
          <p className={styles.data}>{dataLonga}</p>
          <h1 className={styles.ola}>{nome ? `Olá, ${nome}.` : 'Olá.'}</h1>
          <FatosLocais
            aulaIdsPorFormacao={formacoes.map((f) => f.aulaIds)}
            etapaIdsPorSolucao={solucoes.map((s) => s.etapaIds)}
          />
        </div>

        {proximaMentoria && (
          <Link href="/mentorias" className={styles.heroMentoria}>
            <span className={styles.heroMentoriaRotulo}>
              Próxima mentoria ·{' '}
              {rotuloDoDia(proximaMentoria.inicioIso, agora).principal === 'Hoje'
                ? 'hoje'
                : rotuloDoDia(proximaMentoria.inicioIso, agora).principal.toLowerCase()}{' '}
              · {horaCurta(proximaMentoria.inicioIso)}
            </span>
            <span className={styles.heroMentoriaTitulo}>{proximaMentoria.titulo}</span>
            <span className={styles.heroMentoriaMentor}>
              {proximaMentoria.mentor.nome}
              <span className={styles.heroMentoriaSeta} aria-hidden="true">
                <ArrowRight size={14} strokeWidth={2} />
              </span>
            </span>
          </Link>
        )}
      </header>

      {/* OS DESTINOS: um card por lugar da plataforma, logo abaixo do banner.
          Ícone quieto (o MESMO elemento server-rendered do trilho de
          navegação — nada de círculo decorativo), título, uma linha do que a
          tela faz e o dado real no rodapé. Sem gráfico: o número basta. */}
      <nav
        className={`${entrada.bloco} ${entrada.atraso1} ${styles.destinos}`}
        aria-label="Destinos da plataforma"
      >
        {destinos.map((d) => (
          <Link key={d.href} href={d.href} className={styles.destino}>
            <span className={styles.destinoTopo}>
              <span className={styles.destinoIcone}>{d.icone}</span>
              <span className={styles.destinoSeta} aria-hidden="true">
                <ArrowRight size={15} strokeWidth={2} />
              </span>
            </span>
            <span className={styles.destinoTitulo}>{d.rotulo}</span>
            <span className={styles.destinoDescricao}>{d.descricao}</span>
            <span className={styles.destinoDado}>{d.dado}</span>
          </Link>
        ))}
      </nav>

      {recentes.length > 0 && (
        <section
          className={`${entrada.bloco} ${entrada.atraso2} ${styles.secao}`}
          aria-labelledby="inicio-solucoes"
        >
          <div className={styles.secaoTopo}>
            <h2 id="inicio-solucoes" className={styles.secaoTitulo}>
              Últimas soluções
            </h2>
            <Link href="/solucoes" className={styles.verTodas}>
              Ver todas
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.grade}>
            {/* Mesma resolução do catálogo: categoria sem entrada no mapa cai no
                padrão. O ícone chega como ELEMENTO já renderizado do Server
                Component — passar a referência arrastaria o lucide para o cliente. */}
            {recentes.map((solucao) => (
              <CartaoSolucao
                key={solucao.id}
                solucao={solucao}
                icone={
                  (solucao.categoria && ICONES_CATEGORIAS[solucao.categoria]) ||
                  ICONE_CATEGORIA_PADRAO
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
