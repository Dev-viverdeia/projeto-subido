'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, RotateCcw, ScanSearch } from 'lucide-react';
import type { StatusDiagnostico } from '@/lib/diagnosticos/queries';
import styles from './ExecutorDiagnostico.module.css';

export function ExecutorDiagnostico({
  id,
  status,
  automatico,
}: {
  id: string;
  status: StatusDiagnostico;
  automatico: boolean;
}) {
  const router = useRouter();
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executar = useCallback(async () => {
    if (executando) return;
    setExecutando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/diagnosticos/${id}/executar`, {
        method: 'POST',
        cache: 'no-store',
      });
      const corpo: unknown = await resposta.json();
      if (!resposta.ok) {
        const mensagem =
          corpo && typeof corpo === 'object' && 'mensagem' in corpo
            ? String(corpo.mensagem)
            : 'Não foi possível concluir a análise agora.';
        setErro(mensagem);
        return;
      }
      router.refresh();
    } catch {
      setErro('A conexão falhou. Confira sua internet e tente novamente.');
    } finally {
      setExecutando(false);
    }
  }, [executando, id, router]);

  useEffect(() => {
    if (!automatico || status !== 'na_fila') return;
    const timer = window.setTimeout(() => void executar(), 0);
    return () => window.clearTimeout(timer);
  }, [automatico, executar, status]);

  useEffect(() => {
    if (status !== 'processando') return;
    const intervalo = window.setInterval(() => router.refresh(), 3_000);
    return () => window.clearInterval(intervalo);
  }, [router, status]);

  const ativo = status === 'na_fila' || status === 'processando' || executando;
  const etapaAtual = status === 'processando' ? 2 : 1;

  return (
    <section className={styles.estado} aria-live="polite" aria-busy={ativo}>
      <span className={styles.icone} aria-hidden="true">
        {ativo ? <LoaderCircle size={26} /> : <ScanSearch size={26} />}
      </span>
      <div className={styles.conteudo}>
        <p>{ativo ? 'Leitura em andamento' : 'A análise precisa de uma nova tentativa'}</p>
        <h1>
          {ativo
            ? 'Estamos separando evidências, lacunas e oportunidades.'
            : 'O relatório ainda não ficou pronto.'}
        </h1>
        <span className={styles.descricao}>
          {ativo
            ? 'Você pode sair desta página. O diagnóstico continua e ficará salvo aqui.'
            : (erro ?? 'Revise as fontes ou tente processar novamente.')}
        </span>

        {ativo && (
          <ol className={styles.etapas} aria-label="Etapas do diagnóstico">
            {[
              ['Preparar fontes', 'Organizando CRM, cenário e páginas públicas'],
              ['Ler evidências', 'Separando fatos observados de hipóteses'],
              ['Montar laudo', 'Criando correções e a próxima ação comercial'],
            ].map(([titulo, detalhe], indice) => {
              const numero = indice + 1;
              const situacao =
                numero < etapaAtual ? 'concluida' : numero === etapaAtual ? 'atual' : 'pendente';
              return (
                <li data-situacao={situacao} key={titulo}>
                  <span>{String(numero).padStart(2, '0')}</span>
                  <div>
                    <strong>{titulo}</strong>
                    <small>{detalhe}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {!ativo && (
        <button type="button" onClick={() => void executar()}>
          <RotateCcw size={16} aria-hidden="true" /> Tentar novamente
        </button>
      )}
    </section>
  );
}
