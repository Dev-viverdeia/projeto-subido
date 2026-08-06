'use client';

import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { Visto } from '../../_components/PillEstado';
import { horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './TrilhoInscricoes.module.css';

/**
 * A coluna de apoio das mentorias: O QUE É SEU.
 *
 * O QUE ELE RESPONDE, e por que não é duplicata do cartão da próxima. O cartão do
 * topo mostra a próxima sessão DA AGENDA — a que vai acontecer, seja de quem for.
 * Este trilho mostra as sessões em que VOCÊ fez check-in. Numa agenda de vinte
 * linhas, essa é a única pergunta que a lista não responde de relance: "eu marquei
 * alguma coisa, e quando?".
 *
 * É a mesma vaga que o `TrilhoProgresso` ocupa nas outras duas telas — a coluna
 * de orientação, respondendo "onde estou" enquanto a principal mostra o acervo.
 *
 * SOME QUANDO NÃO HÁ NADA, e isso não é economia de pixel: um card "suas
 * inscrições: 0" em toda visita de quem nunca marcou nada é ruído com aparência
 * de informação — a mesma razão pela qual o card do catálogo esconde a barra de
 * progresso antes da primeira marcação.
 *
 * TODO NÚMERO AQUI É DERIVADO de `euInscrito`, que vem do servidor por linha via
 * RLS. Nada é contado no cliente a partir de estado de tela.
 */
export function TrilhoInscricoes({
  sessoes,
  agora,
  aoAbrirDetalhe,
}: {
  /** Só as futuras, já ordenadas — a mesma lista que a agenda desenha. */
  sessoes: SessaoMentoria[];
  agora: Date;
  aoAbrirDetalhe: (id: string) => void;
}) {
  const minhas = sessoes.filter((s) => s.euInscrito);
  if (minhas.length === 0) return null;

  return (
    <section aria-labelledby="inscricoes-titulo" className={styles.card}>
      <div className={styles.topo}>
        <h2 id="inscricoes-titulo" className={styles.eyebrow}>
          Suas inscrições
        </h2>
        <span className={styles.total}>{minhas.length}</span>
      </div>

      <ul className={styles.lista}>
        {minhas.map((s) => {
          const dia = rotuloDoDia(s.inicioIso, agora);
          return (
            <li key={s.id}>
              <button type="button" className={styles.linha} onClick={() => aoAbrirDetalhe(s.id)}>
                {/* Caixa-alta por CONTEÚDO ("HOJE · 19:00"): sem
                    `text-transform`, e mesmo assim precisa do tracking de
                    eyebrow — a necessidade vem da forma das letras. */}
                <span className={styles.quando}>
                  {dia.mono} · {horaCurta(s.inicioIso)}
                </span>
                <span className={styles.titulo}>{s.titulo}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className={styles.nota}>
        <Visto tamanho={11} />
        Check-in feito. A sala abre por aqui quando a sessão começar.
      </p>
    </section>
  );
}
