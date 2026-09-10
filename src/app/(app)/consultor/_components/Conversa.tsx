'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { BarraCompositor } from './BarraCompositor';
import { RespostaEmAndamento } from './RespostaEmAndamento';
import { RecuperarConversa } from './RecuperarConversa';
import { useRespostaSobral } from './useRespostaSobral';
import { useEnvioTexto } from './useEnvioTexto';
import { useRascunhoTexto } from './useRascunhoTexto';
import { AvisoRascunho } from './AvisoRascunho';
import { CampoMensagem } from './CampoMensagem';
import { ExemplosConversa } from './ExemplosConversa';
import { validarAnexosSobral } from '@/lib/consultor/anexos-contrato';
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
  dono,
  chaveRascunho,
}: {
  threadId?: string;
  pendente?: boolean;
  ultimaMensagemId?: string;
  exemplos?: ExemploDoConsultor[];
  textoInicial?: string;
  historico?: ReactNode;
  boasVindas?: ReactNode;
  dono?: string;
  chaveRascunho?: string;
}) {
  const router = useRouter();
  const leituraRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
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
  const [etapaEnvio, setEtapaEnvio] = useState<'enviando' | 'conferindo-envio' | null>(null);
  const etapa = etapaEnvio ?? resposta.etapa;
  const [verificar, setVerificar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoFalha, setTipoFalha] = useState<string>();
  const registrando = useRef(false);
  const [navegando, iniciarNavegacao] = useTransition();

  const envioAnexos = useEnvioAnexos();
  const rascunho = useRascunhoTexto(dono, threadId ?? chaveRascunho ?? 'nova');
  const envioTexto = useEnvioTexto(rascunho.guardarTentativa, dono);
  const ocupado =
    !rascunho.pronto ||
    rascunho.bloqueado ||
    etapa !== null ||
    navegando ||
    envioAnexos.pausado ||
    verificar ||
    Boolean(envioTexto.pendente);
  const rodadaAtiva = emVoo !== null || arquivosEmVoo.length || respostaEmVoo !== null;

  useLayoutEffect(() => {
    if (acompanhar.current && (emVoo || respostaEmVoo || etapa || erro)) {
      const destino = erro
        ? leituraRef.current?.querySelector('[data-ajuda-falha]')
        : fimRef.current;
      destino?.scrollIntoView({ block: 'end' });
      if (erro && destino instanceof HTMLElement) destino.focus({ preventScroll: true });
    }
  }, [emVoo, respostaEmVoo, etapa, erro]);

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
    if (pendente && threadId && ultimaMensagemId)
      void responder(threadId, ultimaMensagemId, false, false, true);
    // A pendência pertence à montagem desta conversa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!threadEmUso) return;
    // Ao reabrir, a resposta começa visível; não só os cartões no fim dela.
    const leitura = leituraRef.current;
    const ultimaResposta = leitura?.querySelector('[data-resposta-sobral]:last-child');
    if (leitura && ultimaResposta) {
      leitura.scrollTo({
        top:
          leitura.scrollTop +
          ultimaResposta.getBoundingClientRect().top -
          leitura.getBoundingClientRect().top,
        behavior: 'instant',
      });
    } else fimAncora.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [threadEmUso]);

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
    rascunho.salvar(texto, combinados.length > 0);
  }

  const {
    gravando,
    preparando,
    segundos,
    alternar: alternarGravacao,
    cancelar: cancelarGravacao,
  } = useGravadorAudio({
    aoConcluir: (arquivo) => incluirArquivos([arquivo]),
    aoFalhar: setErro,
  });

  async function responder(
    conversaId: string,
    mensagemId: string,
    nova: boolean,
    repetir = false,
    somenteConferir = verificar,
  ) {
    setErro(null);
    setTipoFalha(undefined);
    const resultado = await resposta.responder(conversaId, mensagemId, repetir, somenteConferir);
    if (!resultado) return;
    const { falha } = resultado;
    if (falha) {
      setErro(falha.mensagem);
      setTipoFalha(falha.tipo);
      setVerificar(falha.tipo === 'pendente' || falha.tipo === 'sessao');
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
    if (
      (!mensagem && anexosDaRodada.length === 0) ||
      (!retomar && ocupado) ||
      etapa ||
      registrando.current ||
      gravando ||
      preparando
    )
      return;
    if (!navigator.onLine) {
      setErro('Sem conexão. Sua mensagem continua aqui. Reconecte para enviar.');
      return;
    }

    setErro(null);
    setTipoFalha(undefined);
    registrando.current = true;
    resposta.limpar();
    acompanhar.current = true;
    setEmVoo(mensagem || null);
    setArquivosEmVoo(anexosDaRodada);
    setTexto('');
    setArquivos([]);
    setEtapaEnvio(envioTexto.pendente === 'conferir' ? 'conferindo-envio' : 'enviando');

    const nova = !threadEmUso;
    // O protocolo de anexos continua em memória. Não restaurar seu texto como novo envio.
    if (anexosDaRodada.length) rascunho.limpar();
    const registro =
      anexosDaRodada.length > 0
        ? await envioAnexos.enviar(mensagem, anexosDaRodada, threadEmUso)
        : await envioTexto.enviar(mensagem, threadEmUso);
    registrando.current = false;
    if (registro.falha || !registro.threadId || !registro.mensagemId) {
      setErro(registro.falha ?? 'Não foi possível enviar a mensagem.');
      if ('tipo' in registro && typeof registro.tipo === 'string') setTipoFalha(registro.tipo);
      if (anexosDaRodada.length === 0 && !('pendente' in registro && registro.pendente)) {
        setEmVoo(null);
        setTexto(mensagem);
        rascunho.salvar(mensagem);
      }
      setEtapaEnvio(null);
      return;
    }

    setThreadEmUso(registro.threadId);
    rascunho.limpar();
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
    rascunho.salvar(emVoo ?? '', arquivosEmVoo.length > 0);
  }

  function retomarRascunho() {
    const salvo = rascunho.disponivel;
    if (!salvo || !rascunho.retomar(salvo)) return;
    if (salvo.tentativa) {
      envioTexto.restaurar(salvo.tentativa);
      setEmVoo(salvo.texto);
      setTexto('');
      setErro('Falta confirmar o envio.');
    } else {
      setTexto(salvo.texto);
      if (salvo.anexos) setErro('Adicione os arquivos ou grave o áudio novamente antes de enviar.');
      campoRef.current?.focus();
    }
  }

  if (rascunho.bloqueado)
    return <p role="status">Sua sessão mudou. Reabra o Sobral AI para continuar.</p>;

  return (
    <div
      className={styles.conversa}
      data-conversa-ativa={Boolean(erro || rodadaAtiva) || undefined}
      data-envio-incerto={Boolean(envioTexto.pendente) || undefined}
      data-rascunho-ativo={Boolean(rascunho.disponivel || rascunho.recuperado) || undefined}
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
          <RecuperarConversa
            mensagem={erro}
            tipo={tipoFalha}
            threadId={threadEmUso}
            verificar={verificar}
            pausado={envioAnexos.pausado}
            confirmando={Boolean(envioAnexos.progresso?.confirmando)}
            envioTexto={envioTexto.pendente}
            rascunhoSeguro={envioTexto.guardado}
            retomar={() => void enviar(true)}
            editar={() => void voltarAEdicao()}
            responder={
              threadPendente && threadEmUso && perguntaRef.current
                ? () => void responder(threadEmUso, perguntaRef.current!, !threadId, true)
                : undefined
            }
          />
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
        <AvisoRascunho
          disponivel={
            (!texto || texto === textoInicial) && !ocupado && !arquivos.length
              ? rascunho.disponivel
              : undefined
          }
          recuperado={rascunho.recuperado && !ocupado}
          guardado={Boolean(dono && texto && rascunho.guardado && !ocupado)}
          falhou={rascunho.falhou}
          retomar={retomarRascunho}
          descartar={rascunho.descartar}
        />
        {arquivos.length > 0 ? (
          <AnexosDaRodada
            arquivos={arquivos}
            estado="rascunho"
            aoRemover={
              ocupado
                ? undefined
                : (indice) => {
                    const restantes = arquivos.filter((_, i) => i !== indice);
                    setArquivos(restantes);
                    rascunho.salvar(texto, restantes.length > 0);
                  }
            }
          />
        ) : null}

        <CampoMensagem
          campoRef={campoRef}
          texto={texto}
          ocupado={ocupado}
          alterar={(valor) => {
            setTexto(valor);
            rascunho.salvar(valor, arquivos.length > 0);
          }}
          enviar={() => void enviar()}
        />

        <BarraCompositor
          ocupado={ocupado}
          gravando={gravando}
          preparando={preparando}
          segundos={segundos}
          incluir={incluirArquivos}
          alternar={alternarGravacao}
          cancelar={cancelarGravacao}
          podeEnviar={Boolean(texto.trim() || arquivos.length)}
          gerando={Boolean(resposta.etapa && resposta.geracao)}
          parando={resposta.parando}
          parar={resposta.parar}
        />
      </form>

      {exemplos &&
      !erro &&
      !rascunho.disponivel &&
      !rascunho.recuperado &&
      exemplos.length > 0 &&
      arquivos.length === 0 &&
      !arquivosEmVoo.length &&
      emVoo === null &&
      respostaEmVoo === null ? (
        <ExemplosConversa
          exemplos={exemplos}
          ocupado={ocupado}
          escolher={(valor) => {
            setTexto(valor);
            rascunho.salvar(valor, arquivos.length > 0);
            campoRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
