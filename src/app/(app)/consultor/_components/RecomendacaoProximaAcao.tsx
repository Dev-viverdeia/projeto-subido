'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  FileCheck2,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  ScanSearch,
  X,
} from 'lucide-react';
import {
  confirmarRecomendacaoCrm,
  type EstadoConfirmarRecomendacaoCrm,
} from '@/lib/consultor/actions';
import type { RecomendacaoProximaAcao } from '@/lib/consultor/recomendacao';
import styles from './ConfirmarAcaoCrm.module.css';

const ESTADO_INICIAL: EstadoConfirmarRecomendacaoCrm = {};

function dataNoCampo(iso: string | null): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data);
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

function separarFonte(fato: string): { fonte: string; texto: string } {
  const [fonte = 'Fato', ...texto] = fato.split(' · ');
  return texto.length > 0 ? { fonte, texto: texto.join(' · ') } : { fonte: 'Fato', texto: fato };
}

export function RecomendacaoProximaAcao({
  mensagemId,
  recomendacao,
  gerarAutomaticamente,
  modoPreview,
  aoConfirmarPreview,
}: {
  mensagemId: string;
  recomendacao: RecomendacaoProximaAcao | null;
  gerarAutomaticamente: boolean;
  modoPreview: boolean;
  aoConfirmarPreview: (acao: string, quando: string | null) => void;
}) {
  const router = useRouter();
  const iniciou = useRef(false);
  const [revisando, setRevisando] = useState(false);
  const [geracao, setGeracao] = useState<'ociosa' | 'gerando' | 'erro'>(
    recomendacao || !gerarAutomaticamente || modoPreview ? 'ociosa' : 'gerando',
  );
  const [estado, confirmar, pendente] = useActionState(confirmarRecomendacaoCrm, ESTADO_INICIAL);

  const gerar = useCallback(async () => {
    if (modoPreview) return;
    setGeracao('gerando');
    try {
      const resposta = await fetch('/api/consultor/proximo-passo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: mensagemId }),
      });
      if (!resposta.ok) throw new Error(`status_${resposta.status}`);
      router.refresh();
    } catch (erro) {
      console.error('[sobral:proximo-passo-ui]', erro);
      setGeracao('erro');
    }
  }, [mensagemId, modoPreview, router]);

  useEffect(() => {
    if (!recomendacao && gerarAutomaticamente && !modoPreview && !iniciou.current) {
      iniciou.current = true;
      void gerar();
    }
  }, [gerar, gerarAutomaticamente, modoPreview, recomendacao]);

  useEffect(() => {
    if (estado.status === 'sucesso' && !modoPreview) router.refresh();
  }, [estado.status, modoPreview, router]);

  if (!recomendacao) {
    if (!gerarAutomaticamente && !modoPreview) return null;
    return (
      <aside className={styles.recomendacaoCarregando} aria-live="polite">
        <span className={styles.iconeAnalise} aria-hidden="true">
          {geracao === 'erro' ? (
            <ScanSearch size={17} strokeWidth={1.9} />
          ) : (
            <LoaderCircle className={styles.spinner} size={17} strokeWidth={1.9} />
          )}
        </span>
        <span>
          <small>{geracao === 'erro' ? 'Análise interrompida' : 'Próximo movimento'}</small>
          <strong>
            {geracao === 'erro'
              ? 'Não consegui ler os fatos agora'
              : 'Lendo CRM, calls e decisões recentes'}
          </strong>
          <em>
            {geracao === 'erro'
              ? 'A ação concluída continua salva. Você pode tentar a análise novamente.'
              : 'A conclusão já foi salva. Nenhuma nova ação será criada sem sua confirmação.'}
          </em>
        </span>
        {geracao === 'erro' ? (
          <button type="button" className={styles.tentarNovamente} onClick={() => void gerar()}>
            <RotateCcw size={14} aria-hidden="true" /> Tentar novamente
          </button>
        ) : null}
      </aside>
    );
  }

  if (recomendacao.status === 'confirmada') return null;

  const hoje = dataNoCampo(new Date().toISOString());
  const prazo = dataNoCampo(recomendacao.quando);
  const prazoInicial = prazo >= hoje ? prazo : '';

  if (revisando) {
    return (
      <form
        action={confirmar}
        className={styles.revisaoRecomendacao}
        onSubmit={(evento) => {
          if (!modoPreview) return;
          evento.preventDefault();
          const dados = new FormData(evento.currentTarget);
          const acao = dados.get('acao');
          const quando = dados.get('quando');
          if (typeof acao !== 'string' || acao.trim().length < 3) return;
          aoConfirmarPreview(acao.trim(), typeof quando === 'string' && quando ? quando : null);
        }}
      >
        <input type="hidden" name="mensagem" value={mensagemId} />
        <header>
          <span>
            <small>Revisão humana</small>
            <strong>O que entra no CRM?</strong>
          </span>
          <button
            type="button"
            className={styles.fechar}
            onClick={() => setRevisando(false)}
            aria-label="Cancelar revisão do próximo passo"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <label className={styles.campoAcao}>
          <span>Próxima ação</span>
          <textarea
            name="acao"
            rows={3}
            minLength={3}
            maxLength={500}
            defaultValue={recomendacao.acao}
            required
          />
        </label>
        <div className={styles.rodapeFormulario}>
          <label className={styles.campoData}>
            <span>Data combinada</span>
            <input type="date" name="quando" min={hoje} defaultValue={prazoInicial} />
          </label>
          <button type="submit" className={styles.confirmar} disabled={pendente}>
            {pendente ? <LoaderCircle className={styles.spinner} size={15} /> : <Check size={15} />}
            {pendente ? 'Registrando' : 'Confirmar no CRM'}
          </button>
        </div>
        {estado.status === 'erro' ? (
          <p className={styles.erro} role="alert">
            {estado.mensagem}
          </p>
        ) : (
          <p className={styles.seguranca}>Você pode editar ação e data antes de confirmar.</p>
        )}
      </form>
    );
  }

  return (
    <aside className={styles.recomendacao} aria-label="Próximo passo sugerido pelo Sobral AI">
      <header className={styles.topoRecomendacao}>
        <span className={styles.iconeRecomendacao} aria-hidden="true">
          <ArrowRight size={17} strokeWidth={2} />
        </span>
        <span>
          <small>Próxima ação</small>
          <strong>{recomendacao.acao}</strong>
        </span>
      </header>
      <p className={styles.motivoRecomendacao}>{recomendacao.motivo}</p>
      <div className={styles.baseFactual}>
        <span className={styles.rotuloFatos}>
          <FileCheck2 size={14} strokeWidth={1.9} aria-hidden="true" /> Dados usados
        </span>
        <ul>
          {recomendacao.fatos.map((fato) => {
            const parte = separarFonte(fato);
            return (
              <li key={fato}>
                <small>{parte.fonte}</small>
                <span>{parte.texto}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <footer className={styles.rodapeRecomendacao}>
        <p>Nada muda no CRM antes da sua revisão.</p>
        <button type="button" className={styles.revisar} onClick={() => setRevisando(true)}>
          Revisar ação <PencilLine size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </footer>
    </aside>
  );
}
