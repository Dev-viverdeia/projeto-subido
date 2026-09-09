'use client';
import { LinkAcao } from '@/components/suporte/LinkAcao';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Headphones,
  MessageCircle,
  Search,
  UserRound,
  Waypoints,
  X,
} from 'lucide-react';
import {
  buscarArtigos,
  CATEGORIAS,
  temRespostaNova,
  type CasoSuporte,
  type Artigo,
} from '@/lib/suporte/contrato';
import { FAQ } from '@/lib/suporte/guias-iniciais';
import s from './suporte.module.css';

const iconesGuia = {
  conta: UserRound,
  vendas: Waypoints,
  reunioes: CalendarDays,
  projetos: GraduationCap,
  ia: MessageCircle,
};

export function CentralAjuda({
  artigos,
  autenticado = false,
  equipe = false,
  atendimentos = [],
  horario = '',
  aviso = '',
  emailAjuda = '',
}: {
  artigos: Artigo[];
  autenticado?: boolean;
  equipe?: boolean;
  atendimentos?: CasoSuporte[];
  horario?: string;
  aviso?: string;
  emailAjuda?: string;
}) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [expandido, setExpandido] = useState(false);
  const encontrados = buscarArtigos(artigos, busca).filter(
    (a) => !categoria || a.categoria === categoria,
  );
  const base = autenticado ? '/suporte' : '/ajuda';
  const visiveis = busca || categoria || expandido ? encontrados : encontrados.slice(0, 6);
  return (
    <div className={`${s.pagina} ${s.central}`}>
      <header className={s.cabecalho}>
        <div>
          <h1 className={s.titulo}>Central de ajuda</h1>
          <p className={s.subtitulo}>O que você precisa resolver?</p>
        </div>
        <div className={s.acoes}>
          {autenticado && (
            <Link href="/suporte/atendimentos" className={s.atalho}>
              Meus atendimentos
            </Link>
          )}
          <LinkAcao href={autenticado ? '/suporte/novo' : '/ajuda/acesso'}>
            <Headphones size={18} />
            Pedir ajuda
          </LinkAcao>
        </div>
      </header>
      {aviso && (
        <div className={s.avisoResposta} role="status">
          <strong>Aviso da equipe</strong>
          <span>{aviso}</span>
        </div>
      )}
      {atendimentos
        .filter(temRespostaNova)
        .slice(0, 2)
        .map((c) => (
          <Link className={s.avisoResposta} key={c.id} href={`/suporte/${c.id}`}>
            <span>
              <strong>Nova resposta</strong>
              <span>{c.assunto}</span>
            </span>
            <ArrowUpRight size={20} />
          </Link>
        ))}
      <section className={s.entradaAjuda} aria-label="Buscar ajuda">
        <div className={s.busca}>
          <Search size={22} />
          <input
            aria-label="Buscar nos guias"
            placeholder="Buscar uma orientação"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button className={s.chip} aria-label="Limpar busca" onClick={() => setBusca('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <Link className={s.entradaIA} href={`${base}/ia`}>
          <span className={s.iconeAjuda}>
            <MessageCircle size={23} />
          </span>
          <span>
            <strong>Perguntar à IA</strong>
            <span className={s.meta}>Ajuda com os guias · sem créditos</span>
          </span>
          <ArrowUpRight size={19} />
        </Link>
      </section>
      <div>
        <section aria-labelledby="guias-titulo">
          <div className={s.cabecalhoGuias}>
            <h2 id="guias-titulo" className={s.secaoTitulo}>
              {busca || categoria ? 'Resultados' : 'Guias para o dia a dia'}
            </h2>
            <label className={s.filtroGuias}>
              <span className={s.oculto}>Filtrar guias por área</span>
              <select
                className={s.select}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas as áreas</option>
                {Object.entries(CATEGORIAS)
                  .filter(([id]) => id !== 'outros')
                  .map(([id, nome]) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div aria-live="polite">
            <span className={s.oculto}>{encontrados.length} guias encontrados</span>
          </div>
          {encontrados.length ? (
            <div className={s.guias}>
              {visiveis.map((a) => {
                const Icone = iconesGuia[a.categoria as keyof typeof iconesGuia] || BookOpen;
                return (
                  <Link key={a.slug} href={`/ajuda/${a.slug}`} className={s.guia}>
                    <span className={s.iconeAjuda}>
                      <Icone size={21} />
                    </span>
                    <span>
                      <strong>{a.titulo}</strong>
                      <span className={s.meta}>{CATEGORIAS[a.categoria]}</span>
                    </span>
                    <ChevronRight size={17} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={s.vazio}>
              <Search size={24} aria-hidden="true" />
              <strong>Nenhum guia encontrado</strong>
              <span>Tente outra palavra ou consulte todas as áreas.</span>
              <button
                className={s.chip}
                onClick={() => {
                  setBusca('');
                  setCategoria('');
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
          {!busca && !categoria && encontrados.length > 6 && (
            <button className={`${s.chip} ${s.maisGuias}`} onClick={() => setExpandido(!expandido)}>
              {expandido ? 'Mostrar menos' : `Ver todos os guias (${encontrados.length})`}
            </button>
          )}
        </section>
      </div>
      <section aria-labelledby="faq-titulo">
        <h2 id="faq-titulo" className={s.secaoTitulo}>
          Perguntas frequentes
        </h2>
        <div className={s.faq}>
          {FAQ.map((f) => (
            <details className={s.pergunta} key={f.pergunta}>
              <summary>
                {f.pergunta}
                <ChevronDown size={18} />
              </summary>
              <p>{f.resposta}</p>
              <Link href={`/ajuda/${f.guia}`}>Ver orientação</Link>
            </details>
          ))}
        </div>
      </section>
      <footer className={s.rodape}>
        {emailAjuda && (
          <a className={s.atalho} href={`mailto:${emailAjuda}`}>
            {emailAjuda}
          </a>
        )}
        {horario && <span className={s.meta}>{horario}</span>}
        <Link href="/ajuda/acesso" className={s.atalho}>
          Problema de acesso
        </Link>
        <span className={s.meta}>Não compartilhe senhas ou códigos de acesso.</span>
        {equipe && (
          <Link href="/suporte/equipe" className={s.atalho}>
            Abrir painel de suporte
          </Link>
        )}
      </footer>
    </div>
  );
}
