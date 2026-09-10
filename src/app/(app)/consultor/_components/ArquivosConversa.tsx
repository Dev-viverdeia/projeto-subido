'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  FolderOpen,
  LoaderCircle,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import type { ArquivoDaConversa } from '@/lib/consultor/arquivos-conversa-contrato';
import { mimeBaseDoAnexo as mimeBase, tamanhoLegivel } from '@/lib/consultor/anexos-contrato';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { AnexoIcone } from './AnexoIcone';
import { PreviaAnexo } from './PreviaAnexo';
import { AudioMensagem } from './AudioMensagem';
import { useArquivosConversa } from './useArquivosConversa';
import { focarMensagem } from './focarMensagem';
import styles from './ArquivosConversa.module.css';

function podeVisualizar(arquivo: ArquivoDaConversa) {
  return arquivo.categoria !== 'documento' || mimeBase(arquivo.tipoMime) === 'application/pdf';
}
const dataLegivel = (valor: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));

export function ArquivosConversa({ conversa, dono }: { conversa: string; dono: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [selecionado, setSelecionado] = useState<ArquivoDaConversa | null>(null);
  const [navegando, navegar] = useTransition();
  const [mensagem, setMensagem] = useState('');
  const gatilho = useRef<HTMLButtonElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const lista = useArquivosConversa(conversa, dono, aberto);
  const src = selecionado ? `/api/consultor/anexos/${selecionado.id}` : '';

  function fechar() {
    setAberto(false);
    setSelecionado(null);
    requestAnimationFrame(() => gatilho.current?.focus({ preventScroll: true }));
  }
  function voltar() {
    const id = selecionado?.id;
    setSelecionado(null);
    requestAnimationFrame(() =>
      document.getElementById(`sobral-arquivo-${id}`)?.focus({ preventScroll: true }),
    );
  }
  function verMensagem(arquivo: ArquivoDaConversa) {
    setAberto(false);
    setSelecionado(null);
    requestAnimationFrame(() => {
      if (focarMensagem(arquivo.mensagemId)) return;
      // Mesma árvore e mesma key da conversa: texto e arquivos em rascunho permanecem.
      setMensagem('Abrindo mensagem…');
      navegar(() =>
        router.replace(`/consultor/${conversa}?mensagem=${arquivo.mensagemId}`, { scroll: false }),
      );
    });
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className={styles.gatilho}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label="Arquivos da conversa"
        disabled={navegando}
        onClick={(evento) => {
          evento.currentTarget.focus({ preventScroll: true });
          lista.reabrir();
          setAberto(true);
        }}
      >
        {navegando ? (
          <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
        ) : (
          <FolderOpen size={18} aria-hidden="true" />
        )}
        <span>Arquivos</span>
      </button>
      <span className={styles.srOnly} role="status">
        {navegando ? mensagem : ''}
      </span>
      {aberto && !selecionado ? (
        <ModalOperacao open title="Arquivos da conversa" size="md" onClose={fechar}>
          <div className={styles.busca}>
            <Search size={18} aria-hidden="true" />
            <input
              ref={buscaRef}
              aria-label="Buscar arquivo pelo nome"
              type="search"
              autoComplete="off"
              maxLength={120}
              placeholder="Buscar pelo nome"
              value={lista.busca}
              onChange={(evento) => lista.pesquisar(evento.target.value)}
            />
            {lista.busca ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  lista.pesquisar('');
                  buscaRef.current?.focus();
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className={styles.resumo} role="status" aria-live="polite">
            {lista.carregando ? (
              <>
                <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" /> Buscando
                arquivos…
              </>
            ) : lista.resultado ? (
              `${lista.resultado.total} ${lista.resultado.total === 1 ? 'arquivo' : 'arquivos'}${lista.busca.trim() ? ' encontrados' : ' nesta conversa'}`
            ) : null}
          </div>
          {lista.erro ? (
            <div className={styles.erro} role="alert">
              <p>{lista.erro}</p>
              <button type="button" onClick={() => lista.repetir()} disabled={lista.carregando}>
                Tentar novamente
              </button>
            </div>
          ) : null}
          <ul
            className={styles.lista}
            aria-label="Arquivos encontrados"
            aria-busy={lista.carregando}
          >
            {lista.resultado?.arquivos.map((arquivo) => {
              const visualizavel = podeVisualizar(arquivo);
              const conteudo = (
                <>
                  <span className={styles.icone}>
                    <AnexoIcone categoria={arquivo.categoria} />
                  </span>
                  <span className={styles.identidade}>
                    <strong>{arquivo.nome}</strong>
                    <small>
                      {arquivo.categoria === 'audio'
                        ? 'Áudio'
                        : arquivo.categoria === 'imagem'
                          ? 'Imagem'
                          : mimeBase(arquivo.tipoMime) === 'application/pdf'
                            ? 'PDF'
                            : 'Documento'}{' '}
                      · {tamanhoLegivel(arquivo.tamanhoBytes)} · {dataLegivel(arquivo.criadoEm)}
                    </small>
                  </span>
                  {visualizavel ? (
                    <ArrowUpRight className={styles.indicador} size={16} aria-hidden="true" />
                  ) : (
                    <Download className={styles.indicador} size={16} aria-hidden="true" />
                  )}
                </>
              );
              return (
                <li key={arquivo.id} aria-label={arquivo.nome}>
                  {visualizavel ? (
                    <button
                      id={`sobral-arquivo-${arquivo.id}`}
                      className={styles.arquivo}
                      type="button"
                      aria-label={`Abrir ${arquivo.nome}`}
                      onClick={() => setSelecionado(arquivo)}
                    >
                      {conteudo}
                    </button>
                  ) : (
                    <a
                      id={`sobral-arquivo-${arquivo.id}`}
                      className={styles.arquivo}
                      aria-label={`Baixar ${arquivo.nome}`}
                      href={`/api/consultor/anexos/${arquivo.id}?download=1`}
                      download={arquivo.nome}
                    >
                      {conteudo}
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.mensagem}
                    aria-label={`Ver mensagem de ${arquivo.nome}`}
                    title="Ver mensagem original"
                    onClick={() => verMensagem(arquivo)}
                  >
                    <MessageSquare size={17} aria-hidden="true" />
                    <span>Ver mensagem</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!lista.carregando && !lista.erro && lista.resultado?.total === 0 ? (
            <div className={styles.vazio}>
              <FolderOpen size={32} strokeWidth={1.5} aria-hidden="true" />
              <strong>
                {lista.busca.trim() ? 'Nenhum arquivo com esse nome' : 'Seus arquivos ficam aqui'}
              </strong>
              <p>
                {lista.busca.trim()
                  ? 'Tente buscar por parte do nome.'
                  : 'Imagens, documentos e áudios enviados nesta conversa.'}
              </p>
            </div>
          ) : null}
          {lista.resultado?.mais ? (
            <button
              type="button"
              className={styles.mais}
              onClick={() => lista.mais()}
              disabled={lista.carregando || Boolean(lista.erro)}
            >
              Carregar mais arquivos
            </button>
          ) : null}
        </ModalOperacao>
      ) : null}
      {aberto && selecionado ? (
        selecionado.categoria === 'audio' ? (
          <ModalOperacao
            open
            title="Ouvir áudio"
            size="md"
            onClose={fechar}
            footer={
              <>
                <button type="button" className={styles.voltar} onClick={voltar}>
                  <ArrowLeft size={18} aria-hidden="true" />
                  Voltar aos arquivos
                </button>
                <a className={styles.voltar} href={`${src}?download=1`} download={selecionado.nome}>
                  <Download size={18} aria-hidden="true" />
                  Baixar áudio
                </a>
              </>
            }
          >
            <p className={styles.nomeAudio}>{selecionado.nome}</p>
            <AudioMensagem src={src} />
          </ModalOperacao>
        ) : (
          <PreviaAnexo
            src={src}
            nome={selecionado.nome}
            tamanho={selecionado.tamanhoBytes}
            pdf={mimeBase(selecionado.tipoMime) === 'application/pdf'}
            aoFechar={fechar}
            aoVoltar={voltar}
          />
        )
      ) : null}
    </>
  );
}
