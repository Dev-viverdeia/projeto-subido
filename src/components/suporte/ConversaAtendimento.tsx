'use client';
import { LinkAcao } from '@/components/suporte/LinkAcao';
import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/design-system/via';
import {
  atualizarAtendimento,
  marcarLido,
  responderAtendimento,
  responderPublico,
  prepararRespostaSuporte,
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
import { useRascunho } from './useRascunho';
import { MensagemAtendimento } from './MensagemAtendimento';
import { SugestaoResposta } from './SugestaoResposta';

export function ConversaAtendimento({
  caso,
  mensagens,
  equipe = false,
  publico = false,
  agentes = [],
  preview = false,
  pagina = 0,
  totalMensagens = mensagens.length,
  usuario = 'publico',
  novo = false,
}: {
  caso: CasoSuporte;
  mensagens: MensagemSuporte[];
  equipe?: boolean;
  publico?: boolean;
  agentes?: AgenteSuporte[];
  preview?: boolean;
  pagina?: number;
  totalMensagens?: number;
  usuario?: string;
  novo?: boolean;
}) {
  const router = useRouter();
  const [interna, setInterna] = useState(false);
  const [rascunho, salvarRascunho] = useRascunho(
    `suporte-rascunho:${usuario}:${caso.id}:${interna ? 'nota' : 'resposta'}`,
  );
  const [textos, setTextos] = useState<{ nota?: string; resposta?: string }>({});
  const modo = interna ? 'nota' : 'resposta';
  const texto = textos[modo] ?? rascunho;
  const setTexto = (t: string) => {
    setTextos((v) => ({ ...v, [modo]: t }));
    salvarRascunho(t);
    mensagemId.current = '';
  };
  const [sugestao, setSugestao] = useState<{ texto: string; fontes: string[] } | null>(null);
  const [preparando, preparar] = useTransition();
  const [resultado, setResultado] = useState<'em_atendimento' | 'aguardando_voce' | 'resolvido'>(
    'em_atendimento',
  );
  const [arquivos, setArquivos] = useState<ArquivoSuporte[]>([]);
  const [upload, setUpload] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [pendente, iniciar] = useTransition();
  const mensagemId = useRef('');
  const ultimaRecebida = mensagens.findLast(
    (m) => !m.interna && m.papel === (equipe ? 'usuario' : 'equipe'),
  )?.id;
  useEffect(() => {
    if (preview || pagina > 0) return;
    if (!publico && ultimaRecebida) void marcarLido(caso.id, ultimaRecebida);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !pendente && !upload) router.refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [caso.id, ultimaRecebida, router, publico, preview, pendente, upload, pagina]);
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
          resultado: equipe ? resultado : 'em_atendimento',
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
  function alternarModo(nota: boolean) {
    setInterna(nota);
    mensagemId.current = '';
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
      {novo && (
        <div className={s.avisoResposta} role="status">
          <strong>Pedido recebido · #{caso.numero}</strong>
          <span>A resposta fica nesta conversa. Você também recebe um aviso por e-mail.</span>
        </div>
      )}
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
            {mensagens.map((m) => (
              <MensagemAtendimento
                key={m.id}
                mensagem={m}
                equipe={equipe}
                publico={publico}
                atendimento={caso.id}
              />
            ))}
          </div>
          {pagina === 0 ? (
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                enviar();
              }}
            >
              {equipe && (
                <div className={s.modoResposta} role="group" aria-label="Tipo de mensagem">
                  <button
                    type="button"
                    aria-pressed={!interna}
                    disabled={pendente || upload || arquivos.length > 0}
                    onClick={() => alternarModo(false)}
                  >
                    Responder ao cliente
                  </button>
                  <button
                    type="button"
                    aria-pressed={interna}
                    disabled={pendente || upload || arquivos.length > 0}
                    onClick={() => alternarModo(true)}
                  >
                    Nota interna
                  </button>
                </div>
              )}
              {interna && <p className={s.meta}>Só a equipe vê. Não envia e-mail ao cliente.</p>}
              {equipe && !interna && (
                <Button
                  variant="secondary"
                  type="button"
                  loading={preparando}
                  disabled={pendente || preview}
                  onClick={() =>
                    preparar(async () => {
                      setErro('');
                      try {
                        const r = await prepararRespostaSuporte(caso.id);
                        if (r.ok) setSugestao(r.sugestao);
                        else setErro(r.erro);
                      } catch {
                        setErro(
                          'Não foi possível preparar a sugestão. Você pode responder normalmente.',
                        );
                      }
                    })
                  }
                >
                  Preparar sugestão com IA
                </Button>
              )}
              {sugestao && !interna && (
                <SugestaoResposta
                  sugestao={sugestao}
                  ocupado={!!texto.trim()}
                  usar={() => {
                    setTexto(sugestao.texto);
                    setSugestao(null);
                  }}
                  descartar={() => setSugestao(null)}
                />
              )}
              <label className={s.campo}>
                <span id="suporte-rotulo-mensagem">
                  {interna
                    ? 'Nota interna'
                    : caso.status === 'resolvido'
                      ? 'Precisa de mais ajuda?'
                      : 'Sua mensagem'}
                </span>
                <textarea
                  aria-labelledby="suporte-rotulo-mensagem"
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
              {equipe && !interna && (
                <label className={s.campo}>
                  Depois de responder
                  <select
                    className={s.select}
                    value={resultado}
                    disabled={pendente}
                    onChange={(e) => setResultado(e.target.value as typeof resultado)}
                  >
                    <option value="em_atendimento">Continuar em atendimento</option>
                    <option value="aguardando_voce">Aguardar resposta do cliente</option>
                    <option value="resolvido">Marcar como resolvido</option>
                  </select>
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
                {caso.status === 'resolvido' &&
                  !interna &&
                  (!equipe || resultado !== 'resolvido') && (
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
