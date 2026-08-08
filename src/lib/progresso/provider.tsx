'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  concluirAulaConta,
  definirEtapaConta,
  importarProgressoConta,
  tocarFormacaoConta,
  type ResultadoProgresso,
} from './actions';
import { mesclarProgresso, temProgresso, type EstadoProgressoConta } from './estado';
import {
  ContextoProgresso,
  guardarProgressoLegado,
  lerProgressoLegado,
  limparProgressoLegado,
  type AcoesProgresso,
} from './local';
import styles from './provider.module.css';

type EstadoSincronizacao = 'salvo' | 'sincronizando' | 'erro';

export function ProgressoProvider({
  inicial,
  children,
}: {
  inicial: EstadoProgressoConta;
  children: ReactNode;
}) {
  const [estado, setEstado] = useState(inicial);
  const [sincronizacao, setSincronizacao] = useState<EstadoSincronizacao>('salvo');
  const estadoRef = useRef(inicial);
  const pendentes = useRef(0);
  const houveFalha = useRef(false);
  const migrou = useRef(false);

  const atualizar = useCallback((proximo: EstadoProgressoConta) => {
    estadoRef.current = proximo;
    setEstado(proximo);
  }, []);

  const executar = useCallback(
    async (
      acao: () => Promise<ResultadoProgresso>,
      proximo: EstadoProgressoConta,
      limparBackupAoSalvar = false,
    ) => {
      if (pendentes.current === 0) houveFalha.current = false;
      pendentes.current += 1;
      setSincronizacao('sincronizando');

      let resultado: ResultadoProgresso;
      const backup = lerProgressoLegado();
      const precisaRecuperar = temProgresso(backup);
      try {
        resultado = precisaRecuperar
          ? await importarProgressoConta(mesclarProgresso(proximo, backup))
          : await acao();
      } catch (erro) {
        console.error('[progresso:sincronizar]', erro);
        resultado = { ok: false, mensagem: 'Não foi possível salvar seu progresso agora.' };
      }

      if (!resultado.ok) {
        houveFalha.current = true;
        guardarProgressoLegado(estadoRef.current);
      } else if (limparBackupAoSalvar || precisaRecuperar) {
        limparProgressoLegado();
      }

      pendentes.current -= 1;
      if (temProgresso(lerProgressoLegado())) houveFalha.current = true;
      if (pendentes.current === 0) setSincronizacao(houveFalha.current ? 'erro' : 'salvo');
    },
    [],
  );

  useEffect(() => {
    if (migrou.current) return;
    migrou.current = true;
    const legado = lerProgressoLegado();
    if (!temProgresso(legado)) return;

    const combinado = mesclarProgresso(estadoRef.current, legado);
    atualizar(combinado);
    void executar(() => importarProgressoConta(combinado), combinado, true);
  }, [atualizar, executar]);

  const concluirAula = useCallback(
    (aulaId: string, formacaoSlug: string) => {
      const atual = estadoRef.current;
      if (atual.aulas[aulaId]) return;
      const agora = new Date().toISOString();
      const proximo = {
        ...atual,
        aulas: { ...atual.aulas, [aulaId]: agora },
        formacoes: { ...atual.formacoes, [formacaoSlug]: agora },
      };
      atualizar(proximo);
      void executar(() => concluirAulaConta(aulaId, formacaoSlug), proximo);
    },
    [atualizar, executar],
  );

  const tocarFormacao = useCallback(
    (formacaoSlug: string) => {
      const atual = estadoRef.current;
      const proximo = {
        ...atual,
        formacoes: { ...atual.formacoes, [formacaoSlug]: new Date().toISOString() },
      };
      atualizar(proximo);
      void executar(() => tocarFormacaoConta(formacaoSlug), proximo);
    },
    [atualizar, executar],
  );

  const alternarEtapa = useCallback(
    (etapaId: string, solucaoSlug: string) => {
      const atual = estadoRef.current;
      const etapas = { ...atual.etapas };
      const concluida = !etapas[etapaId];
      const agora = new Date().toISOString();
      if (concluida) etapas[etapaId] = agora;
      else delete etapas[etapaId];
      const proximo = {
        ...atual,
        etapas,
        solucoes: { ...atual.solucoes, [solucaoSlug]: agora },
      };
      atualizar(proximo);
      void executar(() => definirEtapaConta(etapaId, solucaoSlug, concluida), proximo);
    },
    [atualizar, executar],
  );

  const tentarNovamente = () => {
    const atual = mesclarProgresso(estadoRef.current, lerProgressoLegado());
    atualizar(atual);
    void executar(() => importarProgressoConta(atual), atual, true);
  };

  const acoes = useMemo<AcoesProgresso>(
    () => ({ concluirAula, tocarFormacao, alternarEtapa }),
    [alternarEtapa, concluirAula, tocarFormacao],
  );
  const valor = useMemo(() => ({ estado, acoes }), [acoes, estado]);

  return (
    <ContextoProgresso.Provider value={valor}>
      {children}
      <span className="sr-only" aria-live="polite">
        {sincronizacao === 'sincronizando'
          ? 'Salvando progresso na conta.'
          : sincronizacao === 'salvo'
            ? 'Progresso salvo na conta.'
            : 'Falha ao salvar o progresso na conta.'}
      </span>
      {sincronizacao === 'erro' && (
        <aside className={styles.aviso} role="alert" aria-label="Sincronização do progresso">
          <span className={styles.marcador} aria-hidden="true" />
          <div>
            <strong>Seu avanço está protegido</strong>
            <p>Ficou neste dispositivo e será enviado para sua conta quando a conexão voltar.</p>
          </div>
          <button type="button" onClick={tentarNovamente}>
            Tentar agora
          </button>
        </aside>
      )}
    </ContextoProgresso.Provider>
  );
}
