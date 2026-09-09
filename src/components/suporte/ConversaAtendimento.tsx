'use client';
import { LinkAcao } from '@/components/suporte/LinkAcao';
import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/design-system/via';
import {
  atualizarAtendimento,
  marcarLido,
  responderAtendimento,
  responderPublico,
} from '@/lib/suporte/actions';
import {
  CATEGORIAS,
  MENSAGENS_POR_PAGINA,
  type CasoSuporte,
  type MensagemSuporte,
  type ArquivoSuporte,
  type AgenteSuporte,
  type ResultadoSuporte,
} from '@/lib/suporte/contrato';
import { EstadoAtendimento } from './ListaAtendimentos';
import { AnexosSuporte } from './AnexosSuporte';
import { DetalhesAtendimento } from './DetalhesAtendimento';
import s from './suporte.module.css';

export function ConversaAtendimento({
  caso,
  mensagens,
  equipe = false,
  publico = false,
  agentes = [],
  preview = false,
  pagina = 0,
  totalMensagens = mensagens.length,
}: {
  caso: CasoSuporte;
  mensagens: MensagemSuporte[];
  equipe?: boolean;
  publico?: boolean;
  agentes?: AgenteSuporte[];
  preview?: boolean;
  pagina?: number;
  totalMensagens?: number;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [interna, setInterna] = useState(false);
  const [arquivos, setArquivos] = useState<ArquivoSuporte[]>([]);
  const [upload, setUpload] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [pendente, iniciar] = useTransition();
  const mensagemId = useRef('');
  useEffect(() => {
    if (preview || pagina > 0) return;
    if (!publico) void marcarLido(caso.id);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !pendente && !upload) router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [caso.id, caso.atualizado_em, router, publico, preview, pendente, upload, pagina]);
  const caminho = publico
    ? `/ajuda/atendimento/${caso.id}`
    : equipe
      ? `/suporte/equipe/${caso.id}`
      : `/suporte/${caso.id}`;
  function acao(fn: () => Promise<ResultadoSuporte>, mensagem = 'Atendimento atualizado.') {
    iniciar(async () => {
      setErro('');
      setSucesso('');
      try {
        const result = await fn();
        if (!result.ok) {
          setErro(result.erro);
          return;
        }
        setSucesso(mensagem);
        router.refresh();
      } catch {
        setErro(
          'Não foi possível confirmar a atualização. Confira a conversa antes de tentar novamente.',
        );
      }
    });
  }
  function mudarEstado(status: CasoSuporte['status']) {
    if (preview) {
      setSucesso('Demonstração: nenhum dado foi alterado.');
      return;
    }
    if (publico)
      acao(() =>
        responderPublico({
          id: crypto.randomUUID(),
          atendimento: caso.id,
          texto:
            status === 'resolvido'
              ? 'Meu pedido foi resolvido.'
              : 'Preciso retomar este atendimento.',
          status,
        }),
      );
    else acao(() => atualizarAtendimento({ id: caso.id, status }));
  }
  function enviar() {
    if (preview) {
      setSucesso('Demonstração: nenhuma mensagem foi enviada.');
      return;
    }
    if (!texto.trim() || pendente || upload) return;
    iniciar(async () => {
      setErro('');
      setSucesso('');
      try {
        if (!mensagemId.current) mensagemId.current = crypto.randomUUID();
        const pedido = {
          id: mensagemId.current,
          atendimento: caso.id,
          texto,
          interna,
          anexos: arquivos.map((a) => a.id),
        };
        const result = publico
          ? await responderPublico(pedido)
          : await responderAtendimento(pedido);
        if (!result.ok) {
          setErro(result.erro);
          return;
        }
        setTexto('');
        setArquivos([]);
        mensagemId.current = '';
        setSucesso(interna ? 'Nota interna salva.' : 'Mensagem enviada.');
        router.refresh();
      } catch {
        setErro('A conexão falhou. Sua mensagem continua aqui para tentar novamente.');
      }
    });
  }
  return (
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <div>
          <Link
            className={s.atalho}
            href={publico ? '/ajuda' : equipe ? '/suporte/equipe' : '/suporte/atendimentos'}
          >
            <ArrowLeft size={18} />
            {equipe ? 'Fila de atendimento' : publico ? 'Central de ajuda' : 'Meus atendimentos'}
          </Link>
          <h1 className={s.titulo}>{caso.assunto}</h1>
          <p className={s.subtitulo}>
            Atendimento #{caso.numero} · {CATEGORIAS[caso.categoria]}
          </p>
        </div>
        <div className={s.acoes}>
          <EstadoAtendimento estado={caso.status} />
          <Button
            variant="ghost"
            aria-label="Atualizar conversa"
            onClick={() => router.refresh()}
            iconLeft={<RefreshCw size={18} />}
          >
            Atualizar
          </Button>
        </div>
      </header>
      <div className={s.conversa}>
        <div className={s.mensagens}>
          {totalMensagens > MENSAGENS_POR_PAGINA && (
            <nav className={s.acoes} aria-label="Histórico da conversa">
              {(pagina + 1) * MENSAGENS_POR_PAGINA < totalMensagens && (
                <Link className={s.atalho} href={`${caminho}?historico=${pagina + 1}`}>
                  Mensagens anteriores
                </Link>
              )}
              {pagina > 0 && (
                <>
                  <Link className={s.atalho} href={`${caminho}?historico=${pagina - 1}`}>
                    Mensagens mais recentes
                  </Link>
                  <Link className={s.atalho} href={caminho}>
                    Ir para a conversa atual
                  </Link>
                </>
              )}
            </nav>
          )}
          <div className={s.mensagens} aria-label="Mensagens do atendimento">
            {mensagens.map((m) =>
              m.papel === 'sistema' ? (
                <p className={s.sistema} key={m.id}>
                  {m.texto}
                </p>
              ) : (
                <article
                  key={m.id}
                  className={s.mensagem}
                  data-papel={m.papel}
                  data-interna={m.interna}
                >
                  <div className={s.acoes}>
                    <span className={s.meta}>
                      {m.interna
                        ? 'Nota interna · só a equipe vê'
                        : m.papel === 'equipe'
                          ? 'Equipe Subido'
                          : equipe
                            ? 'Usuário'
                            : 'Você'}
                    </span>
                    <time className={s.meta} dateTime={m.criado_em}>
                      {new Date(m.criado_em).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo',
                      })}
                    </time>
                  </div>
                  <p>{m.texto}</p>
                  {m.arquivos.length > 0 && (
                    <div className={s.anexos}>
                      {m.arquivos.map((a) => (
                        <a
                          className={s.arquivo}
                          key={a.id}
                          href={`/api/suporte/anexos/${a.id}${publico ? `?atendimento=${caso.id}` : ''}`}
                        >
                          <Download size={16} />
                          <span>{a.nome}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
          {pagina === 0 ? (
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                enviar();
              }}
            >
              <label className={s.campo}>
                {interna
                  ? 'Nota interna'
                  : caso.status === 'resolvido'
                    ? 'Precisa de mais ajuda?'
                    : 'Sua mensagem'}
                <textarea
                  className={s.textarea}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={
                    interna ? 'Informações para quem está atendendo' : 'Escreva sua resposta'
                  }
                  maxLength={6000}
                  required
                  disabled={pendente}
                />
              </label>
              {equipe && (
                <label className={s.checkbox}>
                  <input
                    type="checkbox"
                    checked={interna}
                    disabled={pendente || upload}
                    onChange={(e) => setInterna(e.target.checked)}
                  />
                  Nota interna, visível apenas à equipe
                </label>
              )}
              {!publico && !preview && (
                <AnexosSuporte
                  arquivos={arquivos}
                  onChange={setArquivos}
                  onBusy={setUpload}
                  disabled={pendente}
                />
              )}
              <div className={s.acoes}>
                <Button
                  type="submit"
                  disabled={!texto.trim() || upload}
                  loading={pendente}
                  iconLeft={<Send size={17} />}
                >
                  {interna ? 'Salvar nota' : 'Enviar mensagem'}
                </Button>
                {caso.status === 'resolvido' && !interna && (
                  <span className={s.meta}>Enviar uma mensagem reabre o atendimento.</span>
                )}
              </div>
              <span className={s.meta}>Não compartilhe senhas ou códigos de acesso.</span>
            </form>
          ) : (
            <LinkAcao href={caminho}>Voltar à conversa para responder</LinkAcao>
          )}
          {erro && (
            <p className={s.erro} role="alert">
              {erro}
            </p>
          )}
          {sucesso && (
            <p role="status" className={s.meta}>
              {sucesso}
            </p>
          )}
        </div>
        <DetalhesAtendimento
          caso={caso}
          equipe={equipe}
          publico={publico}
          preview={preview}
          pendente={pendente}
          agentes={agentes}
          acao={acao}
          mudarEstado={mudarEstado}
        />
      </div>
    </div>
  );
}
