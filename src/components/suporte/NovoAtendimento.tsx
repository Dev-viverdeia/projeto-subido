'use client';
import { LinkAcao } from '@/components/suporte/LinkAcao';
import { useState, useSyncExternalStore, useTransition } from 'react';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { Button } from '@/design-system/via';
import { criarAtendimento } from '@/lib/suporte/actions';
import {
  CATEGORIAS,
  ErroSuporteSchema,
  categoriaDaPagina,
  buscarArtigos,
  type Artigo,
  type ArquivoSuporte,
} from '@/lib/suporte/contrato';
import { useRascunho } from './useRascunho';
import { AnexosSuporte } from './AnexosSuporte';
import s from './suporte.module.css';

export const CHAVE_RASCUNHO_SUPORTE = 'subido-pedido-ajuda';
const assinar = () => () => {};
const lerRascunho = () => {
  try {
    return sessionStorage.getItem(CHAVE_RASCUNHO_SUPORTE) ?? '';
  } catch {
    return '';
  }
};
export function NovoAtendimento({
  publico = false,
  pagina = null,
  renovarId,
  linkInvalido = false,
  usuario = 'publico',
  artigos = [],
}: {
  publico?: boolean;
  pagina?: string | null;
  renovarId?: string;
  linkInvalido?: boolean;
  usuario?: string;
  artigos?: Artigo[];
}) {
  const router = useRouter();
  const rascunho = useSyncExternalStore(assinar, lerRascunho, () => '');
  const [salvo, salvar] = useRascunho(`suporte-rascunho:${usuario}:novo`);
  const [texto, setTexto] = useState<string | null>(null);
  const [assuntoSalvo, salvarAssunto] = useRascunho(`suporte-rascunho:${usuario}:novo:assunto`);
  const [emailSalvo, salvarEmail] = useRascunho(`suporte-rascunho:${usuario}:novo:email`);
  const [assuntoLocal, setAssuntoLocal] = useState<string | null>(null);
  const [emailLocal, setEmailLocal] = useState<string | null>(null);
  const assunto = assuntoLocal ?? assuntoSalvo;
  const email = emailLocal ?? emailSalvo;
  const setAssunto = (v: string) => {
    setAssuntoLocal(v);
    salvarAssunto(v);
  };
  const setEmail = (v: string) => {
    setEmailLocal(v);
    salvarEmail(v);
  };
  const [categoria, setCategoria] = useState<string>(categoriaDaPagina(pagina));
  const [arquivos, setArquivos] = useState<ArquivoSuporte[]>([]);
  const [upload, setUpload] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [pendente, iniciar] = useTransition();
  const [id, setId] = useState('');
  const conteudo = texto ?? salvo ?? rascunho;
  const descricao = conteudo || (texto === null ? rascunho : '');
  const guias = assunto.trim().length > 3 ? buscarArtigos(artigos, assunto).slice(0, 2) : [];
  function enviar(form: FormData) {
    if (pendente || upload) return;
    iniciar(async () => {
      setErro('');
      try {
        const pedidoId = id || crypto.randomUUID();
        setId(pedidoId);
        if (publico) {
          const response = await fetch('/api/suporte/publico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: pedidoId,
              email,
              assunto: renovarId ? 'Reenviar acesso ao atendimento' : assunto,
              texto: renovarId ? 'Solicito um novo link de acesso ao atendimento.' : descricao,
              site: form.get('site') ?? '',
              atendimento: renovarId,
            }),
          });
          const result: unknown = await response.json();
          if (!response.ok || !z.object({ ok: z.literal(true) }).safeParse(result).success) {
            setErro(
              ErroSuporteSchema.safeParse(result).data?.erro ||
                'Não foi possível enviar. Tente novamente.',
            );
            return;
          }
          setEnviado(true);
          salvar('');
          salvarAssunto('');
          salvarEmail('');
          try {
            sessionStorage.removeItem(CHAVE_RASCUNHO_SUPORTE);
          } catch {
            /* O pedido já está salvo. */
          }
        } else {
          const result = await criarAtendimento({
            id: pedidoId,
            assunto,
            categoria,
            texto: descricao,
            pagina,
            anexos: arquivos.map((a) => a.id),
          });
          if (!result.ok) {
            setErro(result.erro);
            return;
          }
          try {
            sessionStorage.removeItem(CHAVE_RASCUNHO_SUPORTE);
          } catch {
            /* O pedido já está salvo. */
          }
          salvar('');
          salvarAssunto('');
          salvarEmail('');
          router.push(`/suporte/${result.id}?novo=1`);
        }
      } catch {
        setErro('A conexão falhou. Seu texto continua aqui para tentar novamente.');
      }
    });
  }
  return (
    <div className={s.pagina}>
      <Link href={publico ? '/ajuda' : '/suporte'} className={s.atalho}>
        <ArrowLeft size={18} />
        Central de ajuda
      </Link>
      <header>
        <h1 className={s.titulo}>
          {renovarId ? 'Acessar atendimento' : publico ? 'Problema de acesso' : 'Pedir ajuda'}
        </h1>
        <p className={s.subtitulo}>
          {publico
            ? 'Confirme seu e-mail para conversar com a equipe, mesmo sem entrar na conta.'
            : 'Conte o que aconteceu. A resposta fica salva no seu atendimento.'}
        </p>
      </header>
      {enviado ? (
        <div className={s.form} role="status">
          <Check size={28} />
          <h2 className={s.secaoTitulo}>Confira seu e-mail</h2>
          <p>
            Enviaremos um link para confirmar e acompanhar o pedido. Ele pode levar alguns minutos.
            Confira também o spam.
          </p>
          <p className={s.meta}>Só depois da confirmação o pedido entra na fila da equipe.</p>
          <LinkAcao href="/ajuda" variant="secondary">
            Voltar à ajuda
          </LinkAcao>
        </div>
      ) : (
        <form className={s.form} action={enviar}>
          {linkInvalido && (
            <p className={s.erro} role="alert">
              O link expirou ou não é válido. Envie o pedido para receber um novo acesso.
            </p>
          )}
          {publico && (
            <label className={s.campo}>
              Seu e-mail
              <input
                className={s.input}
                type="email"
                disabled={pendente}
                autoComplete="email"
                required
                value={email}
                maxLength={254}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {!renovarId && (
            <>
              <label className={s.campo}>
                O que você precisa resolver?
                <input
                  className={s.input}
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="Ex.: não consegui conectar minha agenda"
                  disabled={pendente}
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                />
              </label>
              {!publico && (
                <details className={s.detalhesCompactos}>
                  <summary>
                    {CATEGORIAS[categoria as keyof typeof CATEGORIAS]} · Alterar assunto
                  </summary>
                  <label className={s.campo}>
                    Área do produto
                    <select
                      className={s.select}
                      aria-label="Assunto"
                      value={categoria}
                      disabled={pendente}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      {Object.entries(CATEGORIAS).map(([id, rotulo]) => (
                        <option value={id} key={id}>
                          {rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                </details>
              )}
              <label className={s.campo}>
                Descreva o que aconteceu
                <textarea
                  className={s.textarea}
                  required
                  minLength={10}
                  maxLength={6000}
                  value={descricao}
                  disabled={pendente}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    salvar(e.target.value);
                  }}
                  placeholder="O que você tentou fazer e o que apareceu?"
                />
              </label>
            </>
          )}
          {!publico && (
            <AnexosSuporte
              arquivos={arquivos}
              onChange={setArquivos}
              onBusy={setUpload}
              disabled={pendente}
            />
          )}
          {!!guias.length && (
            <details className={s.detalhesCompactos}>
              <summary>Orientações relacionadas</summary>
              {guias.map((g) => (
                <Link
                  key={g.slug}
                  className={s.atalho}
                  href={`/ajuda/${g.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {g.titulo}
                </Link>
              ))}
            </details>
          )}
          {publico && (
            <label className={s.oculto} aria-hidden="true">
              Seu site
              <input name="site" tabIndex={-1} autoComplete="off" />
            </label>
          )}
          <p className={s.meta}>
            {pagina ? 'A página de origem será compartilhada com a equipe. ' : ''}Não envie senhas,
            códigos ou dados de clientes que não sejam necessários.
          </p>
          {erro && (
            <p className={s.erro} role="alert">
              {erro}
            </p>
          )}
          <div className={s.acoes}>
            <Button
              type="submit"
              loading={pendente}
              disabled={upload}
              iconLeft={<Send size={17} />}
            >
              {publico ? 'Receber link por e-mail' : 'Enviar pedido'}
            </Button>
            <span className={s.meta}>Sem consumo de créditos</span>
          </div>
        </form>
      )}
    </div>
  );
}
