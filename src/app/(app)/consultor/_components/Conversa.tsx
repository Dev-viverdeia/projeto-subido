'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowRight, ArrowUp, Bot, LoaderCircle, Mic, Paperclip, Square, X } from 'lucide-react';
import { responderPendente } from '@/lib/consultor/invocar';
import { adicionarMensagem, criarConversa } from '@/lib/consultor/criar';
import {
  categoriaDoAnexo,
  SOBRAL_ACCEPT_ANEXOS,
  tamanhoLegivel,
  validarAnexosSobral,
} from '@/lib/consultor/anexos-contrato';
import { AnexoIcone } from './AnexoIcone';
import { blocosDaResposta } from './resposta';
import { useGravadorAudio } from './useGravadorAudio';
import styles from './Conversa.module.css';

const MAXIMO = 8000;

export type ExemploDoConsultor = {
  rotulo: string;
  descricao?: string;
  texto: string;
};

type EtapaProcessamento = 'enviando' | 'lendo' | 'pensando' | null;

function descricaoDaEtapa(etapa: EtapaProcessamento, comArquivos: boolean): string {
  if (etapa === 'enviando') return 'Recebendo o material';
  if (etapa === 'lendo') return 'Lendo o que você enviou';
  if (comArquivos) return 'Preparando a resposta com seus dados';
  return 'Preparando uma resposta com seus dados';
}

export function Conversa({
  threadId,
  pendente = false,
  ultimaMensagemId,
  exemplos,
  textoInicial = '',
}: {
  threadId?: string;
  pendente?: boolean;
  ultimaMensagemId?: string;
  exemplos?: ExemploDoConsultor[];
  textoInicial?: string;
}) {
  const router = useRouter();
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const fimAncora = useRef<HTMLDivElement>(null);
  const versaoDoHistorico = useRef(ultimaMensagemId);

  const [texto, setTexto] = useState(textoInicial.slice(0, MAXIMO));
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arquivosEmVoo, setArquivosEmVoo] = useState<File[]>([]);
  const [threadEmUso, setThreadEmUso] = useState(threadId);
  const [threadPendente, setThreadPendente] = useState(pendente);
  const [emVoo, setEmVoo] = useState<string | null>(null);
  const [respostaEmVoo, setRespostaEmVoo] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<EtapaProcessamento>(pendente ? 'pensando' : null);
  const [erro, setErro] = useState<string | null>(null);
  const [navegando, iniciarNavegacao] = useTransition();

  const ocupado = etapa !== null || navegando;

  useEffect(() => {
    if (emVoo || respostaEmVoo || etapa) fimRef.current?.scrollIntoView({ block: 'end' });
  }, [emVoo, respostaEmVoo, etapa]);

  useEffect(() => {
    if (!ultimaMensagemId || ultimaMensagemId === versaoDoHistorico.current) return;
    versaoDoHistorico.current = ultimaMensagemId;
    setEmVoo(null);
    setArquivosEmVoo([]);
    setRespostaEmVoo(null);
    setEtapa(null);
  }, [ultimaMensagemId]);

  useEffect(() => {
    if (!pendente || !threadId) return;
    let ativo = true;
    void (async () => {
      const { dados, falha } = await responderPendente(threadId);
      if (!ativo) return;
      if (falha) {
        setErro(falha.mensagem);
        setEtapa(null);
        setThreadPendente(true);
        return;
      }
      setRespostaEmVoo(dados.resposta);
      setEtapa(null);
      iniciarNavegacao(() => {
        router.refresh();
        setThreadPendente(false);
      });
    })();
    return () => {
      ativo = false;
    };
    // A pendência pertence à montagem desta conversa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (threadEmUso) fimAncora.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [threadEmUso]);

  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = 'auto';
    campo.style.height = `${Math.min(campo.scrollHeight, 180)}px`;
  }, [texto]);

  function incluirArquivos(novos: readonly File[]) {
    const combinados = [...arquivos];
    for (const arquivo of novos) {
      const repetido = combinados.some(
        (atual) =>
          atual.name === arquivo.name &&
          atual.size === arquivo.size &&
          atual.lastModified === arquivo.lastModified,
      );
      if (!repetido) combinados.push(arquivo);
    }
    const falha = validarAnexosSobral(combinados);
    if (falha) {
      setErro(falha);
      return;
    }
    setErro(null);
    setArquivos(combinados);
  }

  const {
    gravando,
    segundos,
    alternar: alternarGravacao,
  } = useGravadorAudio({
    aoConcluir: (arquivo) => incluirArquivos([arquivo]),
    aoFalhar: setErro,
  });

  async function responder(conversaId: string, temArquivos: boolean, nova: boolean) {
    setEtapa(temArquivos ? 'lendo' : 'pensando');
    const { dados, falha } = await responderPendente(conversaId);
    if (falha) {
      setErro(falha.mensagem);
      setEtapa(null);
      setThreadPendente(true);
      return;
    }

    setRespostaEmVoo(dados.resposta);
    setEtapa(null);
    setThreadPendente(false);
    iniciarNavegacao(() => {
      if (nova) router.replace(`/consultor/${conversaId}`);
      else router.refresh();
    });
  }

  async function enviar() {
    const mensagem = texto.trim();
    if ((!mensagem && arquivos.length === 0) || ocupado || gravando) return;

    const anexosDaRodada = [...arquivos];
    const textoDaRodada =
      mensagem ||
      (anexosDaRodada.length === 1
        ? `Analise o arquivo ${anexosDaRodada[0]!.name}.`
        : `Analise estes ${anexosDaRodada.length} arquivos.`);
    setErro(null);
    setRespostaEmVoo(null);
    setEmVoo(textoDaRodada);
    setArquivosEmVoo(anexosDaRodada);
    setTexto('');
    setArquivos([]);
    setEtapa('enviando');

    const nova = !threadEmUso;
    const registro = nova
      ? await criarConversa(mensagem, anexosDaRodada)
      : await adicionarMensagem(threadEmUso, mensagem, anexosDaRodada);
    if (registro.falha || !registro.threadId) {
      setErro(registro.falha ?? 'Não foi possível enviar a mensagem.');
      setEmVoo(null);
      setArquivosEmVoo([]);
      setTexto(mensagem);
      setArquivos(anexosDaRodada);
      setEtapa(null);
      return;
    }

    setThreadEmUso(registro.threadId);
    setThreadPendente(true);
    await responder(registro.threadId, anexosDaRodada.length > 0, nova);
  }

  return (
    <div className={styles.conversa}>
      <div ref={fimAncora} aria-hidden="true" />

      {(emVoo !== null || etapa || respostaEmVoo !== null) && (
        <div className={styles.rodadaEmVoo} ref={fimRef}>
          {arquivosEmVoo.length > 0 ? (
            <ul className={styles.anexosEmVoo} aria-label="Arquivos enviados">
              {arquivosEmVoo.map((arquivo) => (
                <li key={`${arquivo.name}-${arquivo.size}`}>
                  <AnexoIcone categoria={categoriaDoAnexo(arquivo.type)} />
                  <span>{arquivo.name}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {emVoo !== null ? <p className={`${styles.balao} ${styles.doUsuario}`}>{emVoo}</p> : null}
          {etapa ? (
            <div className={styles.processando} role="status" aria-live="polite">
              <LoaderCircle
                className={styles.girando}
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span>
                <strong>{descricaoDaEtapa(etapa, arquivosEmVoo.length > 0)}</strong>
                <small>Você pode continuar aqui assim que eu terminar.</small>
              </span>
              <i aria-hidden="true" />
            </div>
          ) : null}
          {respostaEmVoo !== null ? (
            <div className={styles.respostaConsultor}>
              <span className={styles.autorResposta}>
                <Bot size={15} strokeWidth={1.9} aria-hidden="true" /> Sobral AI
              </span>
              <div className={`${styles.balao} ${styles.doConsultor}`}>
                {blocosDaResposta(respostaEmVoo).map((bloco, indice) => (
                  <p key={`resposta-em-voo-${indice}`}>{bloco}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {erro ? (
        <div className={styles.erro} role="alert">
          <span>{erro}</span>
          {threadPendente && threadEmUso ? (
            <button
              type="button"
              onClick={() => {
                setErro(null);
                void responder(threadEmUso, arquivosEmVoo.length > 0, !threadId);
              }}
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : null}

      <form
        className={styles.caixa}
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        {arquivos.length > 0 ? (
          <ul className={styles.arquivosSelecionados} aria-label="Arquivos prontos para enviar">
            {arquivos.map((arquivo, indice) => (
              <li key={`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`}>
                <span className={styles.iconeArquivo} aria-hidden="true">
                  <AnexoIcone categoria={categoriaDoAnexo(arquivo.type)} />
                </span>
                <span className={styles.dadosArquivo}>
                  <strong>{arquivo.name}</strong>
                  <small>{tamanhoLegivel(arquivo.size)}</small>
                </span>
                <button
                  type="button"
                  onClick={() => setArquivos((atuais) => atuais.filter((_, i) => i !== indice))}
                  aria-label={`Remover ${arquivo.name}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.linhaCompositor}>
          <label className="sr-only" htmlFor="mensagem-consultor">
            Sua pergunta para o Sobral AI
          </label>
          <textarea
            id="mensagem-consultor"
            ref={campoRef}
            className={styles.campo}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value.slice(0, MAXIMO))}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter' && !evento.shiftKey) {
                evento.preventDefault();
                void enviar();
              }
            }}
            disabled={ocupado}
            rows={2}
            placeholder="Conte o que você precisa resolver…"
          />
        </div>

        <div className={styles.barraCompositor}>
          <div className={styles.ferramentas}>
            <input
              ref={arquivoRef}
              className="sr-only"
              type="file"
              multiple
              accept={SOBRAL_ACCEPT_ANEXOS}
              onChange={(evento) => {
                incluirArquivos(Array.from(evento.target.files ?? []));
                evento.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => arquivoRef.current?.click()}
              disabled={ocupado || gravando}
              aria-label="Anexar documento, imagem ou áudio"
              title="Anexar arquivo"
            >
              <Paperclip size={17} strokeWidth={1.9} aria-hidden="true" />
              <span>Arquivo</span>
            </button>
            <button
              type="button"
              className={gravando ? styles.gravando : undefined}
              onClick={() => void alternarGravacao()}
              disabled={ocupado}
              aria-label={gravando ? 'Parar gravação' : 'Gravar áudio'}
              title={gravando ? 'Parar gravação' : 'Gravar áudio'}
            >
              {gravando ? (
                <Square size={14} fill="currentColor" aria-hidden="true" />
              ) : (
                <Mic size={17} strokeWidth={1.9} aria-hidden="true" />
              )}
              <span>{gravando ? 'Parar' : 'Gravar'}</span>
            </button>
            {gravando ? (
              <span className={styles.tempoGravacao} role="status">
                Gravando · {String(Math.floor(segundos / 60)).padStart(2, '0')}:
                {String(segundos % 60).padStart(2, '0')}
              </span>
            ) : (
              <span className={styles.dicaAtalho}>Enter envia · Shift + Enter cria uma linha</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.enviar}
            disabled={(!texto.trim() && arquivos.length === 0) || ocupado || gravando}
            aria-label={ocupado ? 'Aguardando o Sobral AI' : 'Enviar mensagem'}
          >
            <ArrowUp size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </form>

      {exemplos && exemplos.length > 0 && arquivos.length === 0 ? (
        <ul className={styles.chips} aria-label="Exemplos de perguntas">
          {exemplos.map((exemplo) => (
            <li key={exemplo.rotulo}>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => {
                  setTexto(exemplo.texto);
                  campoRef.current?.focus();
                }}
              >
                <span className={styles.chipTexto}>
                  <strong>{exemplo.rotulo}</strong>
                </span>
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
