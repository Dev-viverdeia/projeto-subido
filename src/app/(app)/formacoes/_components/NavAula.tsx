'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CloudOff, FileBadge2 } from 'lucide-react';
import { Button, Spinner } from '@/design-system/via';
import { useAcoesProgresso, useProgresso, useSincronizacaoProgresso } from '@/lib/progresso/local';
import styles from './NavAula.module.css';

/**
 * A barra de navegação da aula: ← Anterior · [Marcar como concluída] · Próxima →.
 * O botão do meio é o ÚNICO sólido da tela — é a ação que importa. Concluir grava
 * na conta e avança. Ao concluir toda a formação, o certificado vira o destino.
 *
 * A barra fica junto ao vídeo, sem disputar o rodapé com o menu mobile.
 * Montar esta barra também "toca" a formação: é o que alimenta o
 * "continue de onde parou" mesmo para quem assiste sem concluir.
 */
export function NavAula({
  formacaoSlug,
  aulaId,
  aulaIds,
  anteriorId,
  anteriorTitulo,
  proximaId,
  proximaTitulo,
}: {
  formacaoSlug: string;
  aulaId: string;
  aulaIds: string[];
  anteriorId: string | null;
  anteriorTitulo: string | null;
  proximaId: string | null;
  proximaTitulo: string | null;
}) {
  const router = useRouter();
  const progresso = useProgresso();
  const sincronizacao = useSincronizacaoProgresso();
  const { concluirAula, tocarFormacao } = useAcoesProgresso();
  const concluida = Boolean(progresso.aulas[aulaId]);
  const primeiraPendente = aulaIds.find((id) => !progresso.aulas[id]);
  const todasConcluidas = aulaIds.length > 0 && !primeiraPendente;
  const ultimaPendencia =
    !concluida &&
    aulaIds.includes(aulaId) &&
    aulaIds.every((id) => id === aulaId || progresso.aulas[id]);
  const tituloConclusao = useRef<HTMLHeadingElement>(null);
  const conclusaoSolicitada = useRef(false);

  useEffect(() => {
    tocarFormacao(formacaoSlug);
  }, [formacaoSlug, tocarFormacao]);

  useEffect(() => {
    if (!conclusaoSolicitada.current || !todasConcluidas || sincronizacao !== 'salvo') return;
    tituloConclusao.current?.focus({ preventScroll: true });
    conclusaoSolicitada.current = false;
  }, [sincronizacao, todasConcluidas]);

  const hrefAula = (id: string) => `/formacoes/${formacaoSlug}/aula/${id}`;

  const concluir = () => {
    conclusaoSolicitada.current = ultimaPendencia;
    concluirAula(aulaId, formacaoSlug);
    if (proximaId && !ultimaPendencia) router.push(hrefAula(proximaId));
  };

  if (todasConcluidas) {
    const salva = sincronizacao === 'salvo';
    return (
      <section className={styles.conquista} aria-label="Conclusão da formação">
        <span
          className={styles.iconeConquista}
          aria-hidden="true"
          data-pendente={!salva || undefined}
        >
          {salva ? (
            <FileBadge2 size={24} strokeWidth={1.6} />
          ) : sincronizacao === 'erro' ? (
            <CloudOff size={24} />
          ) : (
            <Spinner size="sm" />
          )}
        </span>
        <div className={styles.textoConquista}>
          <h2 ref={tituloConclusao} tabIndex={-1}>
            {salva
              ? 'Formação concluída'
              : sincronizacao === 'erro'
                ? 'Conclusão não sincronizada'
                : 'Salvando conclusão…'}
          </h2>
          <p>
            {salva
              ? `${aulaIds.length === 1 ? 'A aula foi concluída' : `Todas as ${aulaIds.length} aulas concluídas`}.`
              : sincronizacao === 'erro'
                ? 'Tente sincronizar o progresso para liberar o certificado.'
                : 'O certificado estará disponível assim que o progresso for salvo.'}
          </p>
        </div>
        {salva ? (
          <Link href={`/certificados/formacao/${formacaoSlug}`} className={styles.certificado}>
            Ver certificado <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <nav className={styles.barra} aria-label="Navegação da aula">
      {anteriorId ? (
        <Link
          href={hrefAula(anteriorId)}
          className={styles.vizinha}
          data-direcao="anterior"
          aria-label={`Aula anterior: ${anteriorTitulo}`}
        >
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          <span>Anterior</span>
        </Link>
      ) : (
        <span className={styles.limite} aria-hidden="true" />
      )}

      {concluida ? (
        <span className={styles.feita} role="status">
          <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="8" fill="currentColor" />
            <path
              d="m5.6 9.2 2.2 2.2 4.4-4.8"
              stroke="var(--via-white)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          Aula concluída
        </span>
      ) : (
        <Button variant="primary" className={styles.concluir} onClick={concluir}>
          {ultimaPendencia
            ? 'Concluir formação'
            : proximaId
              ? 'Concluir e avançar'
              : 'Concluir aula'}
        </Button>
      )}

      {proximaId ? (
        <Link
          href={hrefAula(proximaId)}
          className={styles.vizinha}
          data-direcao="proxima"
          data-destaque={concluida ? '' : undefined}
          aria-label={`Próxima aula: ${proximaTitulo}`}
        >
          <span>Próxima</span>
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href={
            concluida && primeiraPendente
              ? hrefAula(primeiraPendente)
              : `/formacoes/${formacaoSlug}`
          }
          className={styles.vizinha}
          data-direcao="proxima"
          data-destaque={concluida ? '' : undefined}
        >
          {concluida && primeiraPendente ? 'Retomar aulas pendentes' : 'Voltar à formação'}{' '}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
