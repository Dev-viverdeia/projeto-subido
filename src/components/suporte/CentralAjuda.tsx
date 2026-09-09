'use client';
import { LinkAcao } from '@/components/suporte/LinkAcao';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Headphones,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';
import { buscarArtigos, CATEGORIAS, type Artigo } from '@/lib/suporte/contrato';
import { FAQ } from '@/lib/suporte/guias-iniciais';
import s from './suporte.module.css';

export function CentralAjuda({
  artigos,
  autenticado = false,
  equipe = false,
}: {
  artigos: Artigo[];
  autenticado?: boolean;
  equipe?: boolean;
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
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <div>
          <h1 className={s.titulo}>Central de ajuda</h1>
          <p className={s.subtitulo}>Encontre uma resposta ou fale com a equipe.</p>
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
      <section aria-label="Buscar ajuda">
        <div className={s.busca}>
          <Search size={22} />
          <input
            aria-label="Buscar nos guias"
            placeholder="Busque pelo que você precisa fazer"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button className={s.chip} aria-label="Limpar busca" onClick={() => setBusca('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className={s.categorias} aria-label="Assuntos">
          <button className={s.chip} aria-pressed={!categoria} onClick={() => setCategoria('')}>
            Todos
          </button>
          {Object.entries(CATEGORIAS)
            .filter(([id]) => id !== 'outros')
            .map(([id, nome]) => (
              <button
                key={id}
                className={s.chip}
                aria-pressed={categoria === id}
                onClick={() => setCategoria(categoria === id ? '' : id)}
              >
                {nome}
              </button>
            ))}
        </div>
      </section>
      <div className={s.principal}>
        <section aria-labelledby="guias-titulo">
          <h2 id="guias-titulo" className={s.secaoTitulo}>
            {busca || categoria ? 'Resultados' : 'Guias para o dia a dia'}
          </h2>
          <div aria-live="polite">
            <span className={s.oculto}>{encontrados.length} guias encontrados</span>
          </div>
          {encontrados.length ? (
            <div className={s.guias}>
              {visiveis.map((a) => (
                <Link key={a.slug} href={`/ajuda/${a.slug}`} className={s.guia}>
                  <BookOpen size={21} />
                  <span>
                    <strong>{a.titulo}</strong>
                    <span className={s.meta}>{CATEGORIAS[a.categoria]}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={s.vazio}>
              Não encontramos um guia com esses termos. Tente uma palavra diferente ou envie sua
              dúvida à equipe.
            </div>
          )}
          {!busca && !categoria && encontrados.length > 6 && (
            <button className={`${s.chip} ${s.maisGuias}`} onClick={() => setExpandido(!expandido)}>
              {expandido ? 'Mostrar menos' : `Ver todos os guias (${encontrados.length})`}
            </button>
          )}
        </section>
        <aside className={s.assistente}>
          <MessageCircle size={30} strokeWidth={1.5} />
          <h2>Prefere perguntar?</h2>
          <p>A IA de ajuda consulta os guias e explica como usar o Subido.</p>
          <LinkAcao variant="secondary" href={`${base}/ia`}>
            Perguntar à IA <ArrowUpRight size={17} />
          </LinkAcao>
          <span className={s.meta}>Sem consumo de créditos.</span>
          <Link href="/ajuda/acesso" className={s.atalho}>
            Problema de acesso
          </Link>
        </aside>
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
