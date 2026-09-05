'use client';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system/via';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
import { alterarAgendaReuniao, type EstadoAlteracaoAgenda } from '@/lib/calls/agenda-actions';
import { RetornoOperacao } from '../../_components/RetornoOperacao';
import styles from './GerenciarAgenda.module.css';

export function EstadoConviteAgenda({ reuniao }: { reuniao: ReuniaoCall }) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState(
    async (anterior: EstadoAlteracaoAgenda, form: FormData) => {
      try {
        const resultado = await alterarAgendaReuniao(anterior, form);
        router.refresh();
        return resultado;
      } catch {
        return {
          status: 'erro' as const,
          mensagem: 'Não foi possível confirmar o convite. Tente novamente.',
        };
      }
    },
    { status: 'erro' },
  );
  if (!['falhou', 'sincronizando'].includes(reuniao.googleSyncStatus) && !estado.mensagem)
    return null;
  const reconectar = estado.reconectar || /^Reconecte/.test(reuniao.googleSyncErro ?? '');
  return (
    <div className={styles.pendencia}>
      <RetornoOperacao
        tom={pendente ? 'processando' : estado.status === 'concluido' ? 'sucesso' : 'erro'}
        titulo={
          pendente
            ? 'Atualizando convite'
            : estado.status === 'concluido'
              ? 'Agenda atualizada'
              : 'Convite pendente'
        }
        descricao={
          estado.status === 'concluido'
            ? undefined
            : (estado.mensagem ??
              reuniao.googleSyncErro ??
              'Confirme a atualização do Google antes de avisar o cliente.')
        }
        acao={
          estado.status === 'concluido' ? undefined : (
            <div className={styles.acoes}>
              {reconectar && (
                <a
                  className="via-btn via-btn--secondary via-btn--sm"
                  href={`/api/integracoes/google-calendar/conectar?retorno=${encodeURIComponent('/reunioes')}`}
                >
                  Reconectar agenda
                </a>
              )}
              <form action={acao}>
                <input type="hidden" name="reuniao" value={reuniao.id} />
                <input type="hidden" name="acao" value="sincronizar" />
                <input type="hidden" name="versao" value="" />
                <Button type="submit" variant="secondary" size="sm" loading={pendente}>
                  Atualizar convite
                </Button>
              </form>
            </div>
          )
        }
      />
    </div>
  );
}
