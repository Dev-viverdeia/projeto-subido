'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system/via';
import { salvarArtigo } from '@/lib/suporte/actions';
import { CATEGORIAS, type Artigo } from '@/lib/suporte/contrato';
import s from './suporte.module.css';
const novo = (): Artigo => ({
  slug: '',
  titulo: '',
  resumo: '',
  categoria: 'outros',
  passos: [],
  dica: '',
  tags: '',
  destino: '/inicio',
  publicado: false,
  atualizado_em: new Date().toISOString(),
});
export function EditorGuias({ artigos }: { artigos: Artigo[] }) {
  const [artigo, setArtigo] = useState<Artigo>(artigos[0] ?? novo());
  const [novoGuia, setNovoGuia] = useState(!artigos.length);
  const [passos, setPassos] = useState(artigo.passos.join('\n'));
  const [retorno, setRetorno] = useState('');
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const atualizar = <K extends keyof Artigo>(campo: K, valor: Artigo[K]) =>
    setArtigo((a) => ({ ...a, [campo]: valor }));
  function escolher(a: Artigo) {
    if (pendente) return;
    setNovoGuia(!a.slug);
    setArtigo(a);
    setPassos(a.passos.join('\n'));
    setRetorno('');
  }
  return (
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <div>
          <Link className={s.atalho} href="/suporte/equipe">
            Painel de suporte
          </Link>
          <h1 className={s.titulo}>Guias de ajuda</h1>
        </div>
        <Button variant="secondary" onClick={() => escolher(novo())}>
          Novo guia
        </Button>
      </header>
      <div className={s.conversa}>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              try {
                if (novoGuia && artigos.some((a) => a.slug === artigo.slug)) {
                  setRetorno(
                    'Esse endereço já está em uso. Escolha outro ou abra o guia existente.',
                  );
                  return;
                }
                const r = await salvarArtigo({
                  ...artigo,
                  passos: passos
                    .split('\n')
                    .map((p) => p.trim())
                    .filter(Boolean),
                });
                setRetorno(
                  r.ok
                    ? artigo.publicado
                      ? 'Guia publicado. A IA já pode consultá-lo.'
                      : 'Rascunho salvo.'
                    : r.erro,
                );
                if (r.ok) setNovoGuia(false);
                router.refresh();
              } catch {
                setRetorno('Não foi possível salvar. Seu texto continua aqui.');
              }
            });
          }}
        >
          <label className={s.campo}>
            Título
            <input
              className={s.input}
              value={artigo.titulo}
              maxLength={120}
              disabled={pendente}
              required
              onChange={(e) => atualizar('titulo', e.target.value)}
            />
          </label>
          <label className={s.campo}>
            Endereço do guia
            <input
              className={s.input}
              value={artigo.slug}
              pattern="[a-z0-9-]{3,80}"
              required
              disabled={!novoGuia || pendente}
              onChange={(e) => atualizar('slug', e.target.value)}
            />
            <span className={s.meta}>Letras minúsculas e hífens. Ex.: conectar-agenda</span>
          </label>
          <label className={s.campo}>
            Assunto
            <select
              className={s.select}
              value={artigo.categoria}
              disabled={pendente}
              onChange={(e) => atualizar('categoria', e.target.value as Artigo['categoria'])}
            >
              {Object.entries(CATEGORIAS).map(([id, n]) => (
                <option value={id} key={id}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className={s.campo}>
            Resposta curta
            <textarea
              className={s.textarea}
              maxLength={800}
              disabled={pendente}
              value={artigo.resumo}
              onChange={(e) => atualizar('resumo', e.target.value)}
              required
            />
          </label>
          <label className={s.campo}>
            Passos, um por linha
            <textarea
              className={s.textarea}
              value={passos}
              disabled={pendente}
              onChange={(e) => setPassos(e.target.value)}
            />
            <span className={s.meta}>
              Até 8 passos de 600 caracteres. Deixe vazio para uma resposta rápida.
            </span>
          </label>
          <label className={s.campo}>
            Atenção ou dica
            <textarea
              className={s.textarea}
              maxLength={1200}
              disabled={pendente}
              value={artigo.dica}
              onChange={(e) => atualizar('dica', e.target.value)}
            />
          </label>
          <label className={s.campo}>
            Página da plataforma
            <input
              className={s.input}
              required
              value={artigo.destino}
              disabled={pendente}
              onChange={(e) => atualizar('destino', e.target.value)}
            />
          </label>
          <label className={s.campo}>
            Palavras usadas na busca
            <input
              className={s.input}
              maxLength={500}
              disabled={pendente}
              value={artigo.tags}
              onChange={(e) => atualizar('tags', e.target.value)}
            />
          </label>
          <label className={s.checkbox}>
            <input
              type="checkbox"
              checked={artigo.publicado}
              disabled={pendente}
              onChange={(e) => atualizar('publicado', e.target.checked)}
            />
            Publicado na central e disponível para a IA
          </label>
          <Button type="submit" loading={pendente}>
            Salvar guia
          </Button>
          {retorno && (
            <p role="status" className={s.meta}>
              {retorno}
            </p>
          )}
        </form>
        <aside className={s.lateral}>
          <h2>Conteúdo</h2>
          {artigos.map((a) => (
            <button
              className={s.chip}
              key={a.slug}
              aria-pressed={a.slug === artigo.slug}
              onClick={() => escolher(a)}
            >
              {a.titulo}
              {!a.publicado ? ' · Rascunho' : ''}
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
