'use client';

import Link from 'next/link';
import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Check, ChevronDown, FileCheck2, LoaderCircle } from 'lucide-react';
import { ModalOperacao } from '@/app/(app)/_components/ModalOperacao';
import { prepararRevisaoMaterial, salvarResumoMaterial } from '@/lib/consultor/material-actions';
import {
  CAMPOS_MATERIAL,
  destinoResumoSalvo,
  type MaterialDaMensagem,
  type ResumoSalvo,
  type RevisaoMaterial,
} from '@/lib/consultor/material';
import styles from './ResumoMaterial.module.css';

export function ResumoMaterial({
  mensagem,
  material,
  salvo: inicial = null,
  modoPreview = false,
}: {
  mensagem: string;
  material: MaterialDaMensagem;
  salvo?: ResumoSalvo | null;
  modoPreview?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [carregando, carregar] = useTransition();
  const [salvando, salvar] = useTransition();
  const [revisao, setRevisao] = useState<RevisaoMaterial | null>(null);
  const [resumo, setResumo] = useState(material.resumo);
  const [oportunidade, setOportunidade] = useState(material.oportunidade ?? '');
  const [revisado, setRevisado] = useState(false);
  const [salvo, setSalvo] = useState(inicial);
  const [erro, setErro] = useState('');
  const recibo = salvo ?? inicial;
  const fichas = revisao && 'fichas' in revisao ? revisao.fichas : [];
  const mudarResumo = (campo: keyof typeof resumo, texto: string) => {
    setResumo((anterior) => ({ ...anterior, [campo]: texto }));
    setRevisado(false);
  };

  function carregarFichas() {
    setRevisao(null);
    setErro('');
    carregar(async () => {
      try {
        const resultado: RevisaoMaterial = modoPreview
          ? {
              fichas: [
                {
                  id: '11111111-1111-4111-8111-111111111111',
                  nome: 'Clínica Aurora · exemplo',
                  titulo: 'Atendimento com IA',
                },
              ],
              salvo: null,
            }
          : await prepararRevisaoMaterial(mensagem);
        setRevisao(resultado);
        if ('salvo' in resultado && resultado.salvo) setSalvo(resultado.salvo);
        if ('fichas' in resultado)
          setOportunidade((atual) => (resultado.fichas.some((f) => f.id === atual) ? atual : ''));
      } catch {
        setRevisao({ erro: 'Não foi possível carregar as fichas. Tente novamente.' });
      }
    });
  }

  return (
    <>
      <aside className={styles.convite} aria-label="Resumo do material">
        <span className={styles.icone} aria-hidden="true">
          {recibo ? <Check size={21} /> : <FileCheck2 size={21} />}
        </span>
        <div className={styles.introducao}>
          <span>{recibo ? 'Salvo na ficha' : 'Resumo do material'}</span>
          <strong>{recibo?.titulo ?? material.resumo.titulo}</strong>
        </div>
        {recibo ? (
          <Link className={styles.secundario} href={destinoResumoSalvo(recibo)}>
            Ver na ficha <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <button
            className={styles.secundario}
            type="button"
            onClick={(evento) => {
              evento.currentTarget.focus();
              setAberto(true);
              carregarFichas();
            }}
          >
            Revisar resumo
          </button>
        )}
      </aside>
      <ModalOperacao
        open={aberto}
        onClose={() => setAberto(false)}
        title={recibo ? 'Resumo salvo' : 'Revisar resumo'}
        description={
          recibo
            ? 'O registro está no histórico da ficha.'
            : 'Será salvo como uma nota. Nenhuma tarefa será criada.'
        }
        blocked={salvando}
        footer={
          <div className={styles.rodape}>
            <button
              type="button"
              className={styles.secundario}
              onClick={() => setAberto(false)}
              disabled={salvando}
            >
              {recibo ? 'Fechar' : 'Voltar à conversa'}
            </button>
            {recibo ? (
              <Link className={styles.primario} href={destinoResumoSalvo(recibo)}>
                Ver na ficha <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <button
                form={id}
                type="submit"
                className={styles.primario}
                disabled={
                  salvando || carregando || !revisado || !oportunidade || fichas.length === 0
                }
              >
                {salvando && (
                  <LoaderCircle size={17} aria-hidden="true" className={styles.girando} />
                )}
                {salvando ? 'Salvando…' : 'Salvar na ficha'}
              </button>
            )}
          </div>
        }
      >
        {recibo ? (
          <div className={styles.sucesso} role="status">
            <Check size={28} aria-hidden="true" />
            <strong>Resumo registrado.</strong>
            <p>A venda e a próxima ação continuam como estavam.</p>
          </div>
        ) : carregando || !revisao ? (
          <p className={styles.estado} role="status">
            <LoaderCircle size={20} className={styles.girando} aria-hidden="true" /> Carregando
            fichas…
          </p>
        ) : 'erro' in revisao ? (
          <div className={styles.estado}>
            <p role="alert">{revisao.erro}</p>
            {revisao.plano ? (
              <Link className={styles.secundario} href="/conta">
                Ver meu plano
              </Link>
            ) : (
              <button className={styles.secundario} onClick={carregarFichas} type="button">
                Tentar novamente
              </button>
            )}
          </div>
        ) : fichas.length === 0 ? (
          <div className={styles.estado}>
            <p>Você ainda não tem uma ficha para este resumo.</p>
            <Link className={styles.secundario} href="/vendas">
              Ir para Vendas <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <form
            id={id}
            className={styles.formulario}
            onSubmit={(evento) => {
              evento.preventDefault();
              if (!revisado || salvando) return;
              setErro('');
              salvar(async () => {
                try {
                  const resultado = modoPreview
                    ? { salvo: { id: mensagem, oportunidade, salvoEm: new Date().toISOString() } }
                    : await salvarResumoMaterial({
                        ...resumo,
                        mensagem,
                        oportunidade,
                        revisado: 'sim',
                      });
                  if ('erro' in resultado) setErro(resultado.erro);
                  else {
                    setSalvo(resultado.salvo);
                    if (!modoPreview) router.refresh();
                  }
                } catch {
                  setErro('Não foi possível confirmar o registro. Tente novamente para conferir.');
                }
              });
            }}
          >
            <label className={styles.campo}>
              <span>Ficha do cliente</span>
              <select
                data-autofocus
                value={oportunidade}
                disabled={salvando}
                required
                onChange={(e) => {
                  setOportunidade(e.target.value);
                  setRevisado(false);
                }}
              >
                <option value="">Escolha a ficha</option>
                {fichas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} · {f.titulo}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.campo}>
              <span>Título do registro</span>
              <input
                value={resumo.titulo}
                disabled={salvando}
                required
                minLength={3}
                maxLength={120}
                onChange={(e) => mudarResumo('titulo', e.target.value)}
              />
            </label>
            <div className={styles.secoes}>
              {CAMPOS_MATERIAL.map((campo) => (
                <details
                  className={styles.secao}
                  key={campo.nome}
                  open={campo.nome === 'escopo' ? true : undefined}
                >
                  <summary>
                    <span>{campo.rotulo}</span>
                    <span className={styles.indicador}>
                      {resumo[campo.nome] ? 'Revisar' : 'Não informado'}
                      <ChevronDown size={17} aria-hidden="true" />
                    </span>
                  </summary>
                  <div className={styles.editor}>
                    <textarea
                      aria-label={campo.rotulo}
                      rows={4}
                      maxLength={campo.nome === 'pendencias' ? 800 : 1200}
                      value={resumo[campo.nome]}
                      placeholder={campo.vazio}
                      disabled={salvando}
                      onChange={(e) => mudarResumo(campo.nome, e.target.value)}
                    />
                  </div>
                </details>
              ))}
            </div>
            <details className={styles.fontes}>
              <summary>
                {material.fontes.length === 1
                  ? 'Arquivo de origem'
                  : `${material.fontes.length} arquivos de origem`}
              </summary>
              <ul>
                {material.fontes.map((f) => (
                  <li key={f.id}>{f.nome}</li>
                ))}
              </ul>
            </details>
            <label className={styles.confirmacao}>
              <input
                type="checkbox"
                checked={revisado}
                disabled={salvando}
                onChange={(e) => setRevisado(e.target.checked)}
              />
              <span>Revisei o resumo e a ficha selecionada.</span>
            </label>
            {erro && (
              <p className={styles.erro} role="alert">
                {erro}
              </p>
            )}
          </form>
        )}
      </ModalOperacao>
    </>
  );
}
