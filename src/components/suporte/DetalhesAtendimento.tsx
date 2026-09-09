'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/design-system/via';
import { assumirAtendimento, atualizarAtendimento } from '@/lib/suporte/actions';
import {
  ESTADOS,
  type CasoSuporte,
  type AgenteSuporte,
  type ResultadoSuporte,
} from '@/lib/suporte/contrato';
import s from './suporte.module.css';
export function DetalhesAtendimento({
  caso,
  equipe,
  publico,
  preview,
  pendente,
  agentes,
  acao,
  mudarEstado,
}: {
  caso: CasoSuporte;
  equipe: boolean;
  publico: boolean;
  preview: boolean;
  pendente: boolean;
  agentes: AgenteSuporte[];
  acao: (fn: () => Promise<ResultadoSuporte>, mensagem?: string) => void;
  mudarEstado: (status: CasoSuporte['status']) => void;
}) {
  return (
    <aside
      className={equipe ? s.lateral : s.encerrarAtendimento}
      aria-label={equipe ? 'Detalhes do atendimento' : 'Resolução do atendimento'}
    >
      {equipe && <h2>Atendimento</h2>}
      {equipe ? (
        <>
          <p>{caso.email}</p>
          {caso.pagina && (
            <Link className={s.atalho} href={caso.pagina}>
              Página informada
            </Link>
          )}
          <label className={s.campo}>
            Status
            <select
              className={s.select}
              value={caso.status}
              aria-label="Status"
              disabled={pendente || preview}
              onChange={(e) => mudarEstado(e.target.value as CasoSuporte['status'])}
            >
              {Object.entries(ESTADOS).map(([id, n]) => (
                <option key={id} value={id}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className={s.campo}>
            Responsável
            <select
              className={s.select}
              value={caso.responsavel ?? ''}
              aria-label="Responsável"
              disabled={pendente || preview}
              onChange={(e) =>
                acao(() =>
                  atualizarAtendimento({ id: caso.id, responsavel: e.target.value || null }),
                )
              }
            >
              <option value="">Sem responsável</option>
              {agentes.map((a) => (
                <option key={a.usuario} value={a.usuario}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          {!caso.responsavel && (
            <Button
              variant="secondary"
              disabled={pendente || preview}
              onClick={() => acao(() => assumirAtendimento(caso.id))}
            >
              Assumir atendimento
            </Button>
          )}
          <label className={s.campo}>
            Prioridade
            <select
              className={s.select}
              value={caso.prioridade}
              aria-label="Prioridade"
              disabled={pendente || preview}
              onChange={(e) =>
                acao(() => atualizarAtendimento({ id: caso.id, prioridade: e.target.value }))
              }
            >
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <div>
            <h2>{caso.status === 'resolvido' ? 'Atendimento resolvido' : 'Tudo resolvido?'}</h2>
            <p>
              {caso.status === 'resolvido'
                ? 'Você pode retomar esta conversa quando precisar.'
                : 'As respostas ficam aqui e você recebe um aviso por e-mail.'}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={pendente}
            iconLeft={caso.status !== 'resolvido' ? <Check size={17} /> : undefined}
            onClick={() =>
              mudarEstado(caso.status === 'resolvido' ? 'em_atendimento' : 'resolvido')
            }
          >
            {caso.status === 'resolvido' ? 'Reabrir atendimento' : 'Marcar como resolvido'}
          </Button>
          {caso.status === 'resolvido' && !publico && (
            <div className={`${s.lista} ${s.avaliacaoAtendimento}`}>
              <p>Como foi o atendimento?</p>
              <div className={s.acoes}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={s.chip}
                    aria-pressed={caso.avaliacao === n}
                    aria-label={`Nota ${n} de 5`}
                    disabled={pendente || preview}
                    onClick={() =>
                      acao(
                        () => atualizarAtendimento({ id: caso.id, avaliacao: n }),
                        'Obrigado pela avaliação.',
                      )
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className={s.meta}>1 · Ruim &nbsp; 5 · Ótimo</span>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
