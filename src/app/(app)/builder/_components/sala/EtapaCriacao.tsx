'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { voltarParaEntrevista } from '@/lib/builder/actions';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import { Visto } from '../../../_components/PillEstado';
import styles from './EtapaCriacao.module.css';

/** ~4 minutos de tentativas. Além disso a geração não voltou mais — e insistir
 *  em silêncio é pior que dizer que parou. */
const TENTATIVAS = 40;
const INTERVALO = 6000;

/**
 * A CRIAÇÃO — as três partes do documento sendo escritas.
 *
 * O PRINT MOSTRA "TRÊS ESPECIALISTAS" (Arquiteto, Desenvolvedor, Doc) e eu não
 * consigo entregar isso literalmente: lá são três agentes com chamadas próprias;
 * aqui é UMA geração. Nomear três trabalhadores descreveria uma arquitetura que
 * o sistema não tem — e isso não é narrar uma espera, é inventar como o produto
 * funciona.
 *
 * O que é VERDADE e dá o mesmo desenho: o documento tem três partes, e elas são
 * escritas nessa ordem. Os cards mostram AS PARTES, não atores. Quem lê descobre
 * o que está sendo produzido em vez de conhecer três personagens.
 *
 * NENHUM CARD MOSTRA TEMPO. O print traz "✓ 30s" e "6s"; eu não meço nada disso —
 * a geração roda em tarefa de fundo e a página só sabe o status. Número de
 * segundos inventado é medição falsa, que é onde a linha continua.
 *
 * O ÚLTIMO NUNCA COMPLETA SOZINHO, pelo mesmo motivo do `PainelEspera`: os
 * anteriores marcam "esta parte ficou para trás" e o último fica em curso até o
 * status virar `pronta` no banco. Enquanto isso não acontece, nada aqui afirma
 * término.
 */
const PARTES = [
  {
    titulo: 'Arquitetura',
    fazendo: 'Desenhando o caminho do dado, da entrada até a saída.',
    feito: (d: DocumentoSolucao) => `${d.ferramentas.length} ferramentas no caminho`,
  },
  {
    titulo: 'Passo a passo',
    fazendo: 'Quebrando a construção em etapas executáveis.',
    feito: (d: DocumentoSolucao) => `${d.etapas.length} etapas`,
  },
  {
    titulo: 'Prompts e riscos',
    fazendo: 'Escrevendo os prompts prontos e o que pode dar errado.',
    feito: (d: DocumentoSolucao) =>
      `${d.prompts.length} prompts · ${d.riscos.length} riscos mapeados`,
  },
];

export function EtapaCriacao({
  id,
  documento,
}: {
  id: string;
  /** `null` enquanto a geração roda. */
  documento: DocumentoSolucao | null;
}) {
  const router = useRouter();
  const [tentativas, setTentativas] = useState(0);
  const [emCurso, setEmCurso] = useState(0);

  const pronto = documento !== null;
  const desistiu = !pronto && tentativas >= TENTATIVAS;

  /* O status no banco é a única fonte. `router.refresh()` e não polling de API: o
     RSC já lê o status, e refazer a renderização do servidor é a mesma consulta
     que a página faria de qualquer jeito. */
  useEffect(() => {
    if (pronto || desistiu) return;
    const t = setTimeout(() => {
      setTentativas((n) => n + 1);
      router.refresh();
    }, INTERVALO);
    return () => clearTimeout(t);
  }, [tentativas, pronto, desistiu, router]);

  /* A narração anda até a penúltima parte e para. Quem termina é o status. */
  useEffect(() => {
    if (pronto || desistiu || emCurso >= PARTES.length - 1) return;
    const t = setTimeout(() => setEmCurso((n) => n + 1), 45_000);
    return () => clearTimeout(t);
  }, [emCurso, pronto, desistiu]);

  if (desistiu) {
    return (
      <div className={styles.falha}>
        <p className={styles.falhaTexto}>
          A geração ficou marcada como em andamento por tempo demais, o que normalmente significa
          que a chamada morreu no meio. Suas respostas continuam salvas.
        </p>
        <form action={voltarParaEntrevista} className={styles.acoes}>
          <input type="hidden" name="id" value={id} />
          <Destravar />
          <button
            type="button"
            className={styles.secundaria}
            onClick={() => {
              setTentativas(0);
              router.refresh();
            }}
          >
            Verificar de novo
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.criacao}>
      <p className={styles.chamada}>
        {pronto
          ? 'O plano está pronto. Ele foi escrito em três partes:'
          : 'O plano está sendo escrito em três partes. Leva de um a três minutos, e continua rodando mesmo se você fechar a aba.'}
      </p>

      <ol className={styles.partes}>
        {PARTES.map((parte, i) => {
          const estado = pronto
            ? 'feito'
            : i < emCurso
              ? 'feito'
              : i === emCurso
                ? 'fazendo'
                : 'espera';

          return (
            <li key={parte.titulo} className={styles.parte} data-estado={estado}>
              <div className={styles.parteTopo}>
                <span className={styles.marca} aria-hidden="true">
                  {estado === 'feito' ? <Visto tamanho={12} /> : null}
                </span>
                {/* Sem segundos: a página não mede o tempo da geração, e um
                    número aqui seria medição inventada. */}
                <span className={styles.parteEstado}>
                  {estado === 'feito' ? 'pronta' : estado === 'fazendo' ? 'escrevendo' : 'a seguir'}
                </span>
              </div>

              <p className={styles.parteTitulo}>{parte.titulo}</p>
              <p className={styles.parteTexto}>
                {pronto && documento ? parte.feito(documento) : parte.fazendo}
              </p>

              {estado === 'fazendo' && (
                <span className={styles.barra} aria-hidden="true">
                  <span className={styles.barraLuz} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** `useFormStatus` precisa estar DENTRO do `<form>` — daí o componente separado. */
function Destravar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.acao} disabled={pending}>
      {pending ? 'Voltando…' : 'Voltar à entrevista'}
    </button>
  );
}
