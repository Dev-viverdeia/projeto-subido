'use client';

import { useMemo, useRef, useState, useTransition, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Check, CloudUpload, FolderLock, Plus, ShieldCheck, X } from 'lucide-react';
import {
  definirVisibilidadeArquivoProjeto,
  excluirArquivoProjeto,
  registrarArquivoProjeto,
} from '@/lib/projetos-execucao/actions';
import type {
  ArquivoProjetoExecucao,
  EventoProjetoExecucao,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import {
  enviarArquivoAoCofre,
  LIMITE_ARQUIVO_PROJETO,
  mimePermitido,
  removerUploadOrfao,
  tituloDoArquivo,
} from '@/lib/projetos-execucao/upload-client';
import { formatarTamanhoArquivo, GrupoArquivoCard, type GrupoArquivo } from './GrupoArquivoCard';
import { HistoricoEntrega } from './HistoricoEntrega';
import styles from './CentralArquivos.module.css';

export function CentralArquivos({
  projetoId,
  tarefas,
  arquivos,
  eventos,
  concluido,
}: {
  projetoId: string;
  tarefas: TarefaProjetoExecucao[];
  arquivos: ArquivoProjetoExecucao[];
  eventos: EventoProjetoExecucao[];
  concluido: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tarefaId, setTarefaId] = useState('');
  const [grupoAlvo, setGrupoAlvo] = useState<GrupoArquivo | null>(null);
  const [mostrarEnvio, setMostrarEnvio] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(
    null,
  );
  const [operando, iniciarOperacao] = useTransition();

  const grupos = useMemo<GrupoArquivo[]>(() => {
    const mapa = new Map<string, ArquivoProjetoExecucao[]>();
    for (const item of arquivos) {
      const grupo = mapa.get(item.grupoId) ?? [];
      grupo.push(item);
      mapa.set(item.grupoId, grupo);
    }
    return [...mapa.entries()]
      .map(([id, versoes]) => {
        versoes.sort((a, b) => b.versao - a.versao);
        const atual = versoes[0]!;
        return { id, titulo: atual.titulo, tarefaId: atual.tarefaId, versoes };
      })
      .sort((a, b) => b.versoes[0]!.criadoEm.localeCompare(a.versoes[0]!.criadoEm));
  }, [arquivos]);

  const liberados = grupos.filter((grupo) =>
    grupo.versoes.some((versao) => versao.visivelCliente),
  ).length;

  function selecionarArquivo(novo: File | null) {
    setMensagem(null);
    if (!novo) {
      setArquivo(null);
      return;
    }
    if (novo.size > LIMITE_ARQUIVO_PROJETO) {
      setMensagem({ tipo: 'erro', texto: 'O arquivo ultrapassa o limite de 50 MB.' });
      return;
    }
    if (!mimePermitido(novo)) {
      setMensagem({
        tipo: 'erro',
        texto: 'Formato não aceito. Use documento, planilha, apresentação, imagem, mídia ou ZIP.',
      });
      return;
    }
    setArquivo(novo);
    setTitulo(grupoAlvo?.titulo ?? tituloDoArquivo(novo.name));
    if (grupoAlvo) setTarefaId(grupoAlvo.tarefaId ?? '');
  }

  function receberDrop(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    selecionarArquivo(evento.dataTransfer.files[0] ?? null);
  }

  function novaVersao(grupo: GrupoArquivo) {
    setGrupoAlvo(grupo);
    setTitulo(grupo.titulo);
    setDescricao(grupo.versoes[0]!.descricao ?? '');
    setTarefaId(grupo.tarefaId ?? '');
    setArquivo(null);
    setMensagem(null);
    setMostrarEnvio(true);
    requestAnimationFrame(() => inputRef.current?.click());
  }

  function limparFormulario() {
    setArquivo(null);
    setTitulo('');
    setDescricao('');
    setTarefaId('');
    setGrupoAlvo(null);
    setProgresso(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  function fecharEnvio() {
    limparFormulario();
    setMostrarEnvio(false);
  }

  async function enviar() {
    if (!arquivo || titulo.trim().length < 2 || enviando) return;
    setEnviando(true);
    setMensagem(null);
    let caminho: string | null = null;

    try {
      const upload = await enviarArquivoAoCofre({
        arquivo,
        projetoId,
        aoProgredir: setProgresso,
      });
      caminho = upload.caminho;
      const resultado = await registrarArquivoProjeto({
        projeto: projetoId,
        tarefa: tarefaId || null,
        grupo: grupoAlvo?.id ?? null,
        titulo,
        descricao,
        nome: arquivo.name,
        caminho: upload.caminho,
        mimeType: upload.mimeType,
        tamanho: arquivo.size,
      });
      if (resultado.erro) throw new Error(resultado.erro);

      setMensagem({ tipo: 'sucesso', texto: resultado.sucesso ?? 'Arquivo adicionado.' });
      limparFormulario();
      setMostrarEnvio(false);
      router.refresh();
    } catch (error) {
      if (caminho) await removerUploadOrfao(caminho);
      setMensagem({
        tipo: 'erro',
        texto: error instanceof Error ? error.message : 'Não foi possível enviar este arquivo.',
      });
    } finally {
      setEnviando(false);
    }
  }

  function mudarVisibilidade(item: ArquivoProjetoExecucao) {
    setMensagem(null);
    iniciarOperacao(async () => {
      const resultado = await definirVisibilidadeArquivoProjeto({
        projeto: projetoId,
        arquivo: item.id,
        visivel: !item.visivelCliente,
      });
      setMensagem({
        tipo: resultado.erro ? 'erro' : 'sucesso',
        texto: resultado.erro ?? resultado.sucesso ?? 'Liberação atualizada.',
      });
      if (!resultado.erro) router.refresh();
    });
  }

  function excluir(item: ArquivoProjetoExecucao) {
    if (!window.confirm(`Excluir definitivamente a versão ${item.versao} de “${item.titulo}”?`)) {
      return;
    }
    setMensagem(null);
    iniciarOperacao(async () => {
      const resultado = await excluirArquivoProjeto({ projeto: projetoId, arquivo: item.id });
      setMensagem({
        tipo: resultado.erro ? 'erro' : 'sucesso',
        texto: resultado.erro ?? resultado.sucesso ?? 'Arquivo excluído.',
      });
      if (!resultado.erro) router.refresh();
    });
  }

  return (
    <section className={styles.central} aria-labelledby="central-arquivos-titulo">
      <header className={styles.cabecalho}>
        <div className={styles.tituloCentral}>
          <span className={styles.seloCofre}>
            <FolderLock size={18} aria-hidden="true" /> Cofre privado
          </span>
          <p>{concluido ? 'Pós-entrega' : 'Central de arquivos'}</p>
          <h2 id="central-arquivos-titulo">
            {concluido
              ? 'O projeto terminou. O valor fica.'
              : 'Tudo que o cliente recebe, organizado.'}
          </h2>
          <span className={styles.resumoCentral}>
            {concluido
              ? 'Versões finais, aprovações e decisões continuam acessíveis neste espaço.'
              : 'Prepare, versione e libere cada material sem misturar rascunhos com a entrega.'}
          </span>
        </div>
        <div className={styles.acaoCentral}>
          <button
            type="button"
            onClick={() => (mostrarEnvio ? fecharEnvio() : setMostrarEnvio(true))}
            aria-expanded={mostrarEnvio}
            aria-controls="painel-novo-arquivo"
          >
            {mostrarEnvio ? <X size={16} /> : <Plus size={16} />}
            {mostrarEnvio
              ? 'Fechar envio'
              : arquivos.length
                ? 'Adicionar arquivo'
                : 'Adicionar primeiro arquivo'}
          </button>
          <small>Privado até você liberar</small>
        </div>
      </header>

      <div className={styles.faixaResumo}>
        <dl className={styles.metricas}>
          <div>
            <dt>Entregáveis</dt>
            <dd>{grupos.length}</dd>
          </div>
          <div>
            <dt>Versões</dt>
            <dd>{arquivos.length}</dd>
          </div>
          <div>
            <dt>No portal</dt>
            <dd>{liberados}</dd>
          </div>
        </dl>
        <p>
          <ShieldCheck size={15} aria-hidden="true" /> Uma única versão de cada entrega aparece para
          o cliente.
        </p>
      </div>

      {mensagem && (
        <p className={styles.mensagemGlobal} data-tipo={mensagem.tipo} role="status">
          {mensagem.texto}
        </p>
      )}

      <div className={styles.corpo} data-envio-aberto={mostrarEnvio || undefined}>
        {mostrarEnvio && (
          <section
            className={styles.envio}
            id="painel-novo-arquivo"
            aria-labelledby="novo-arquivo-titulo"
          >
            <div className={styles.envioTopo}>
              <div>
                <p>{grupoAlvo ? 'Atualização controlada' : 'Nova entrega'}</p>
                <h3 id="novo-arquivo-titulo">
                  {grupoAlvo ? `Adicionar versão a ${grupoAlvo.titulo}` : 'Guardar um arquivo'}
                </h3>
              </div>
              {grupoAlvo && (
                <button type="button" onClick={fecharEnvio} aria-label="Cancelar nova versão">
                  <X size={16} /> Cancelar
                </button>
              )}
            </div>

            <input
              ref={inputRef}
              className={styles.inputArquivo}
              type="file"
              onChange={(evento) => selecionarArquivo(evento.target.files?.[0] ?? null)}
              accept=".pdf,.zip,.json,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.avif,.mp4,.mp3,.m4a"
            />
            <div
              className={styles.dropzone}
              data-arrastando={arrastando || undefined}
              data-preenchido={arquivo ? true : undefined}
              onDragEnter={(evento) => {
                evento.preventDefault();
                setArrastando(true);
              }}
              onDragOver={(evento) => evento.preventDefault()}
              onDragLeave={() => setArrastando(false)}
              onDrop={receberDrop}
            >
              <span className={styles.iconeUpload}>
                {arquivo ? <Check size={22} /> : <CloudUpload size={22} />}
              </span>
              {arquivo ? (
                <div>
                  <strong>{arquivo.name}</strong>
                  <small>{formatarTamanhoArquivo(arquivo.size)} · pronto para enviar</small>
                </div>
              ) : (
                <div>
                  <strong>Solte o arquivo neste cofre</strong>
                  <small>Até 50 MB · envio retomável em arquivos grandes</small>
                </div>
              )}
              <button type="button" onClick={() => inputRef.current?.click()}>
                {arquivo ? 'Trocar' : 'Escolher arquivo'}
              </button>
            </div>

            <div className={styles.campos}>
              <label>
                <span>Nome da entrega</span>
                <input
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  maxLength={180}
                  placeholder="Ex.: Manual final do atendimento"
                />
              </label>
              <label>
                <span>Vincular à tarefa</span>
                <select value={tarefaId} onChange={(evento) => setTarefaId(evento.target.value)}>
                  <option value="">Projeto geral</option>
                  {tarefas.map((tarefa) => (
                    <option key={tarefa.id} value={tarefa.id}>
                      {tarefa.faseTitulo} · {tarefa.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.descricao}>
                <span>Contexto opcional</span>
                <textarea
                  value={descricao}
                  onChange={(evento) => setDescricao(evento.target.value)}
                  maxLength={2000}
                  placeholder="O que esta versão contém ou o que mudou?"
                />
              </label>
            </div>

            {enviando && (
              <div className={styles.progresso} role="status" aria-live="polite">
                <div>
                  <span style={{ transform: `scaleX(${progresso / 100})` }} />
                </div>
                <strong>{progresso}%</strong>
                <small>{progresso < 100 ? 'Protegendo e enviando…' : 'Registrando versão…'}</small>
              </div>
            )}

            <button
              className={styles.enviar}
              type="button"
              onClick={() => void enviar()}
              disabled={!arquivo || titulo.trim().length < 2 || enviando}
            >
              <CloudUpload size={17} />
              {enviando
                ? 'Enviando com segurança…'
                : grupoAlvo
                  ? 'Adicionar nova versão'
                  : 'Guardar no projeto'}
            </button>
          </section>
        )}

        <section className={styles.acervo} aria-labelledby="acervo-titulo">
          <div className={styles.acervoTopo}>
            <div>
              <p>Acervo vivo</p>
              <h3 id="acervo-titulo">Entregáveis do projeto</h3>
            </div>
            <span>
              <ShieldCheck size={15} /> Privado por padrão
            </span>
          </div>

          {grupos.length ? (
            <div className={styles.grupos}>
              {grupos.map((grupo) => (
                <GrupoArquivoCard
                  key={grupo.id}
                  grupo={grupo}
                  tarefas={tarefas}
                  projetoId={projetoId}
                  operando={operando}
                  onNovaVersao={novaVersao}
                  onVisibilidade={mudarVisibilidade}
                  onExcluir={excluir}
                />
              ))}
            </div>
          ) : (
            <div className={styles.vazio}>
              <Archive size={24} aria-hidden="true" />
              <strong>O acervo começa com a primeira entrega.</strong>
              <p>
                Clique em “Adicionar primeiro arquivo”. Ele ficará privado até você decidir
                liberá-lo.
              </p>
            </div>
          )}
        </section>
      </div>

      <HistoricoEntrega eventos={eventos} tarefas={tarefas} />
    </section>
  );
}
