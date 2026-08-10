'use client';

import { CalendarCheck2 } from 'lucide-react';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { Visto } from '../../_components/PillEstado';
import { horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './MeusCheckins.module.css';

/**
 * O CONTEÚDO do dropdown "Meus check-ins" — histórico incluso.
 *
 * O que ele responde que o `TrilhoInscricoes` não responde: o trilho só enxerga
 * as FUTURAS (recebe a lista da agenda, já filtrada), então toda sessão que
 * termina desaparece da tela sem deixar rastro. Aqui entra a lista COMPLETA:
 * as próximas primeiro, em ordem de chegada, e as encerradas depois, da mais
 * recente para trás — a pergunta "de quantas eu participei?" passa a ter onde
 * ser respondida.
 *
 * Sessão encerrada continua CLICÁVEL: a ficha é o registro do que foi (tema,
 * mentor, duração) — histórico que não abre é decoração.
 */
export function MeusCheckins({
  sessoes,
  agora,
  aoAbrirDetalhe,
}: {
  /** TODAS as publicadas (a mesma lista do calendário), não só as futuras. */
  sessoes: SessaoMentoria[];
  agora: Date;
  aoAbrirDetalhe: (id: string) => void;
}) {
  const minhas = sessoes.filter((s) => s.euInscrito);

  if (minhas.length === 0) {
    return (
      <div className={styles.vazio} role="status">
        <span className={styles.vazioIcone} aria-hidden="true">
          <CalendarCheck2 size={20} strokeWidth={1.7} />
        </span>
        <div>
          <p className={styles.vazioTitulo}>Seu histórico começa no primeiro check-in.</p>
          <p className={styles.vazioTexto}>
            Escolha uma sessão na agenda. Depois da confirmação, ela fica registrada aqui.
          </p>
        </div>
      </div>
    );
  }

  const encerrada = (s: SessaoMentoria) => agora.getTime() >= new Date(s.fimIso).getTime();
  const proximas = minhas
    .filter((s) => !encerrada(s))
    .sort((a, b) => a.inicioIso.localeCompare(b.inicioIso));
  const passadas = minhas.filter(encerrada).sort((a, b) => b.inicioIso.localeCompare(a.inicioIso));

  const grupos = [
    { rotulo: 'Próximas', lista: proximas },
    { rotulo: 'Encerradas', lista: passadas },
  ].filter((g) => g.lista.length > 0);

  return (
    <div className={styles.raiz}>
      {grupos.map((grupo) => (
        <section key={grupo.rotulo} aria-label={grupo.rotulo} className={styles.grupo}>
          <h3 className={styles.eyebrow}>{grupo.rotulo}</h3>
          <ul className={styles.lista}>
            {grupo.lista.map((s, i) => (
              <li key={s.id} style={{ '--i': i } as React.CSSProperties}>
                <button
                  type="button"
                  className={styles.linha}
                  data-encerrada={grupo.rotulo === 'Encerradas' ? '' : undefined}
                  onClick={() => aoAbrirDetalhe(s.id)}
                >
                  <span className={styles.quando}>
                    {rotuloDoDia(s.inicioIso, agora).mono} · {horaCurta(s.inicioIso)}
                  </span>
                  <span className={styles.titulo}>{s.titulo}</span>
                  <span className={styles.estado}>
                    {grupo.rotulo === 'Encerradas' ? (
                      'participou'
                    ) : (
                      <>
                        <Visto tamanho={11} />
                        confirmado
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
