'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { ArrowRight, ArrowUp, Mic, Paperclip, Square } from 'lucide-react';
import { RespostaEmAndamento } from './RespostaEmAndamento';
import { useRespostaSobral } from './useRespostaSobral';
import { registrarEnvio } from '@/lib/consultor/registrar-envio';
import { SOBRAL_ACCEPT_ANEXOS, validarAnexosSobral } from '@/lib/consultor/anexos-contrato';
import { AnexosDaRodada } from './AnexosDaRodada';
import { useEnvioAnexos } from './useEnvioAnexos';
import { useGravadorAudio } from './useGravadorAudio';
import styles from './Conversa.module.css';

const MAXIMO = 8000;

export type ExemploDoConsultor = {
  rotulo: string;
  descricao?: string;
  texto: string;
};

export function Conversa({
  threadId,
  pendente = false,
  ultimaMensagemId,
  exemplos,
  textoInicial = '',
  historico,
  boasVindas,
}: {
  threadId?: string;
  pendente?: boolean;
  ultimaMensagemId?: string;
  exemplos?: ExemploDoConsultor[];
  textoInicial?: string;
  historico?: ReactNode;
  boasVindas?: ReactNode;
}) {
  const router = useRouter();
  const leituraRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const fimAncora = useRef<HTMLDivElement>(null);
  const versaoDoHistorico = useRef(ultimaMensagemId);
  const perguntaRef = useRef(ultimaMensagemId);
  const acompanhar = useRef(true);

  const [texto, setTexto] = useState(textoInicial.slice(0, MAXIMO));
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arquivosEmVoo, setArquivosEmVoo] = useState<File[]>([]);
  const [threadEmUso, setThreadEmUso] = useState(threadId);
  const [threadPendente, setThreadPendente] = useState(pendente);
  const [emVoo, setEmVoo] = useState<string | null>(null);
  const resposta = useRespostaSobral();
  const respostaEmVoo = resposta.texto;
  const [etapaEnvio, setEtapaEnvio] = useState<'enviando' | null>(null);
  const etapa = etapaEnvio ?? resposta.etapa;
  const [verificar, setVerificar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [navegando, iniciarNavegacao] = useTransition();

  const envioAnexos = useEnvioAnexos();
  const ocupado = etapa !== null || navegando || envioAnexos.pausado || verificar;

  useEffect(() => {
    if (acompanhar.current && (emVoo || respostaEmVoo || etapa))
      fimRef.current?.scrollIntoView({ block: 'end' });
  }, [emVoo, respostaEmVoo, etapa]);

  useEffect(() => {
    if (!fimRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        acompanhar.current = Boolean(entrada?.isIntersecting);
      },
      { root: leituraRef.current, rootMargin: '0px 0px 120px 0px' },
    );
    observer.observe(fimRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ultimaMensagemId || ultimaMensagemId === versaoDoHistorico.current) return;
    versaoDoHistorico.current = ultimaMensagemId;
    setEmVoo(null);
    setArquivosEmVoo([]);
    resposta.limpar();
    setEtapaEnvio(null);
    // A atualização do histórico substitui somente a rodada otimista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimaMensagemId]);

  useEffect(() => {
    if (pendente && threadId && ultimaMensagemId) void responder(threadId, ultimaMensagemId, false);
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

  async function responder(conversaId: string, mensagemId: string, nova: boolean, repetir = false) {
    setErro(null);
    const resultado = await resposta.responder(conversaId, mensagemId, repetir, verificar);
    if (!resultado) return;
    const { falha } = resultado;
    if (falha) {
      setErro(falha.mensagem);
      setVerificar(falha.tipo === 'pendente');
      setThreadPendente(true);
      if (nova && falha.tipo && ['interrompida', 'falhou'].includes(falha.tipo))
        iniciarNavegacao(() => router.replace(`/consultor/${conversaId}`));
      return;
    }
    setVerificar(false);
    setThreadPendente(false);
    iniciarNavegacao(() => {
      if (nova) router.replace(`/consultor/${conversaId}`);
      else router.refresh();
    });
  }

  async function enviar(retomar = false) {
    const mensagem = retomar ? (emVoo ?? '') : texto.trim();
    const anexosDaRodada = retomar ? arquivosEmVoo : [...arquivos];
    if ((!mensagem && anexosDaRodada.length === 0) || (!retomar && ocupado) || etapa || gravando)
      return;
    if (!navigator.onLine) {
      setErro('Sem conexão. Sua mensagem continua aqui. Reconecte para enviar.');
      return;
    }

    setErro(null);
    resposta.limpar();
    acompanhar.current = true;
    setEmVoo(mensagem || null);
    setArquivosEmVoo(anexosDaRodada);
    setTexto('');
    setArquivos([]);
    setEtapaEnvio('enviando');

    const nova = !threadEmUso;
    const registro =
      anexosDaRodada.length > 0
        ? await envioAnexos.enviar(mensagem, anexosDaRodada, threadEmUso)
        : await registrarEnvio(mensagem, anexosDaRodada, threadEmUso);
    if (registro.falha || !registro.threadId || !registro.mensagemId) {
      setErro(registro.falha ?? 'Não foi possível enviar a mensagem.');
      if (anexosDaRodada.length === 0) {
        setEmVoo(null);
        setTexto(mensagem);
      }
      setEtapaEnvio(null);
      return;
    }

    setThreadEmUso(registro.threadId);
    perguntaRef.current = registro.mensagemId;
    setThreadPendente(true);
    setEtapaEnvio(null);
    await responder(registro.threadId, registro.mensagemId, nova);
  }

  async function voltarAEdicao() {
    if (!(await envioAnexos.cancelar())) return;
    setTexto(emVoo ?? '');
    setArquivos(arquivosEmVoo);
    setEmVoo(null);
    setArquivosEmVoo([]);
    setErro(null);
  }

  return (
    <div
      className={styles.conversa}
      data-conversa-ativa={
        Boolean(emVoo !== null || arquivosEmVoo.length > 0 || respostaEmVoo !== null) || undefined
      }
    >
      <div className={styles.leitura} ref={leituraRef} data-leitura-conversa>
        {historico}
        {boasVindas ? <div className={styles.boasVindas}>{boasVindas}</div> : null}

        {(emVoo !== null || arquivosEmVoo.length > 0 || etapa || respostaEmVoo !== null) && (
          <div className={styles.rodadaEmVoo}>
            {arquivosEmVoo.length > 0 ? (
              <AnexosDaRodada
                arquivos={arquivosEmVoo}
                progresso={envioAnexos.progresso}
                estado={
                  envioAnexos.pausado ? 'pausado' : etapa === 'enviando' ? 'enviando' : 'enviado'
                }
              />
            ) : null}
            {emVoo !== null ? (
              <p className={`${styles.balao} ${styles.doUsuario}`}>{emVoo}</p>
            ) : null}
            <RespostaEmAndamento
              etapa={etapa}
              texto={respostaEmVoo}
              parando={resposta.parando}
              confirmando={Boolean(envioAnexos.progresso?.confirmando)}
              comArquivos={arquivosEmVoo.length > 0}
            />
          </div>
        )}

        {erro && !etapa ? (
          <div
            className={styles.erro}
            role={resposta.geracao?.estado === 'interrompida' ? 'status' : 'alert'}
          >
            <span>{erro}</span>
            {envioAnexos.pausado ? (
              <>
                <button type="button" onClick={() => void enviar(true)}>
                  Retomar envio
                </button>
                {!envioAnexos.progresso?.confirmando ? (
                  <button type="button" onClick={() => void voltarAEdicao()}>
                    Voltar à edição
                  </button>
                ) : null}
              </>
            ) : null}
            {threadPendente && threadEmUso && perguntaRef.current ? (
              <button
                type="button"
                onClick={() => {
                  setErro(null);
                  void responder(threadEmUso, perguntaRef.current!, !threadId, true);
                }}
              >
                {verificar
                  ? 'Verificar resposta'
                  : resposta.geracao?.estado === 'interrompida'
                    ? 'Gerar novamente'
                    : 'Tentar novamente'}
              </button>
            ) : null}
          </div>
        ) : null}
        {resposta.erroParar ? (
          <p className={styles.erro} role="alert">
            {resposta.erroParar}
          </p>
        ) : null}

        <div ref={fimAncora} aria-hidden="true" />
        <div ref={fimRef} className={styles.fimResposta} aria-hidden="true" />
      </div>
      <form
        className={styles.caixa}
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        {arquivos.length > 0 ? (
          <AnexosDaRodada
            arquivos={arquivos}
            estado="rascunho"
            aoRemover={(indice) => setArquivos((atuais) => atuais.filter((_, i) => i !== indice))}
          />
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
              aria-label="Selecionar arquivos para a conversa"
              tabIndex={-1}
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

          {resposta.etapa && resposta.geracao ? (
            <button
              type="button"
              className={styles.enviar}
              onClick={() => void resposta.parar()}
              disabled={resposta.parando}
              aria-label={resposta.parando ? 'Interrompendo resposta' : 'Parar resposta'}
              title="Parar resposta"
            >
              <Square size={14} fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className={styles.enviar}
              disabled={(!texto.trim() && arquivos.length === 0) || ocupado || gravando}
              aria-label={ocupado ? 'Aguardando o Sobral AI' : 'Enviar mensagem'}
            >
              <ArrowUp size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {exemplos &&
      exemplos.length > 0 &&
      arquivos.length === 0 &&
      !arquivosEmVoo.length &&
      emVoo === null &&
      respostaEmVoo === null ? (
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
