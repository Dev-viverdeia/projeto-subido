'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp, BookOpen, LoaderCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/design-system/via';
import {
  RespostaAjudaSchema,
  ErroSuporteSchema,
  resumoTransferencia,
  type Artigo,
} from '@/lib/suporte/contrato';
import { CHAVE_RASCUNHO_SUPORTE } from './NovoAtendimento';
import { TextoAjuda } from './TextoAjuda';
import s from './suporte.module.css';

type Mensagem = { papel: 'usuario' | 'ia'; texto: string; fontes?: string[]; encaminhar?: boolean };
export function ChatAjuda({
  artigos,
  autenticado = false,
}: {
  artigos: Artigo[];
  autenticado?: boolean;
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();
  async function perguntar(pergunta = texto) {
    if (pendente || pergunta.trim().length < 3) return;
    setPendente(true);
    setErro('');
    try {
      const response = await fetch('/api/suporte/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          historico: mensagens.slice(-6).map(({ papel, texto }) => ({ papel, texto })),
        }),
      });
      const data: unknown = await response.json();
      const parsed = RespostaAjudaSchema.safeParse(data);
      if (!response.ok || !parsed.success) {
        setErro(
          ErroSuporteSchema.safeParse(data).data?.erro || 'A IA não conseguiu responder agora.',
        );
        return;
      }
      const resultado = parsed.data;
      setMensagens((m) => [
        ...m,
        { papel: 'usuario', texto: pergunta },
        {
          papel: 'ia',
          texto: resultado.resposta,
          fontes: resultado.fontes,
          encaminhar: resultado.encaminhar,
        },
      ]);
      setTexto('');
    } catch {
      setErro('A conexão falhou. Tente novamente ou peça ajuda à equipe.');
    } finally {
      setPendente(false);
    }
  }
  function pedirAjuda() {
    const resumo = resumoTransferencia(mensagens, texto);
    try {
      sessionStorage.setItem(CHAVE_RASCUNHO_SUPORTE, resumo);
    } catch {
      /* O usuário ainda pode escrever no formulário. */
    }
    router.push(autenticado ? '/suporte/novo' : '/ajuda/acesso');
  }
  return (
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <div>
          <Link href={autenticado ? '/suporte' : '/ajuda'} className={s.atalho}>
            <ArrowLeft size={18} />
            Central de ajuda
          </Link>
          <h1 className={s.titulo}>IA de ajuda</h1>
        </div>
        <Button variant="secondary" disabled={pendente} onClick={pedirAjuda}>
          Pedir ajuda à equipe
        </Button>
      </header>
      <div className={s.chat}>
        {!mensagens.length && !pendente && (
          <div className={s.inicioChat}>
            <MessageCircle size={36} strokeWidth={1.5} />
            <h2>O que você quer fazer no Subido?</h2>
            <p>Respostas com base nos guias. Sem acesso aos seus dados privados.</p>
            <div className={s.sugestoes}>
              {[
                'Como conecto o Google Agenda?',
                'Posso criar proposta sem reunião?',
                'Como concluo uma entrega?',
              ].map((t) => (
                <button
                  key={t}
                  className={s.chip}
                  disabled={pendente}
                  onClick={() => {
                    setTexto(t);
                    void perguntar(t);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={s.mensagens} aria-live="polite">
          {mensagens.map((m, i) => (
            <article
              key={i}
              className={s.mensagem}
              data-papel={m.papel === 'usuario' ? 'usuario' : 'equipe'}
            >
              <span className={s.meta}>{m.papel === 'usuario' ? 'Você' : 'IA de ajuda'}</span>
              {m.papel === 'ia' ? <TextoAjuda texto={m.texto} /> : <p>{m.texto}</p>}
              {m.fontes && (
                <div className={s.fontes}>
                  {m.fontes.map((slug) => {
                    const guia = artigos.find((a) => a.slug === slug);
                    return guia ? (
                      <Link key={slug} href={`/ajuda/${slug}`} className={s.arquivo}>
                        <BookOpen size={16} />
                        <span>{guia.titulo}</span>
                      </Link>
                    ) : null;
                  })}
                </div>
              )}
              {m.encaminhar && (
                <Button variant="secondary" onClick={pedirAjuda}>
                  Levar dúvida à equipe
                </Button>
              )}
            </article>
          ))}
        </div>
        {pendente && (
          <div className={s.mensagens}>
            <article className={s.mensagem} data-papel="usuario">
              <span className={s.meta}>Você</span>
              <p>{texto}</p>
            </article>
            <div className={s.aguardandoIA} role="status">
              <LoaderCircle size={20} aria-hidden="true" />
              <span>Consultando os guias do Subido…</span>
            </div>
          </div>
        )}
        <form
          className={s.compositor}
          onSubmit={(e) => {
            e.preventDefault();
            void perguntar();
          }}
        >
          <label className={s.oculto} htmlFor="pergunta-ia">
            Sua pergunta
          </label>
          <textarea
            id="pergunta-ia"
            className={s.textarea}
            value={pendente ? '' : texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Conte sua dúvida sobre a plataforma"
            maxLength={2000}
            minLength={3}
            required
            disabled={pendente}
          />
          <div className={s.acoes}>
            <span className={s.meta}>IA de ajuda · não consome créditos</span>
            <Button
              type="submit"
              loading={pendente}
              disabled={texto.trim().length < 3}
              iconRight={<ArrowUp size={18} />}
            >
              Perguntar
            </Button>
          </div>
          {erro && (
            <p role="alert" className={s.erro}>
              {erro}
            </p>
          )}
        </form>
        <p className={s.meta}>A IA pode errar. Confira os guias citados.</p>
      </div>
    </div>
  );
}
