'use client';

import { useState, useSyncExternalStore } from 'react';
import { useFormStatus } from 'react-dom';
import { createPortal } from 'react-dom';
import { CalendarClock, CalendarX2 } from 'lucide-react';
import { Button, Modal } from '@/design-system/via';
import { resolverReuniaoPendente } from '@/lib/calls/actions';
import styles from './ResolverReuniaoPendente.module.css';

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

function BotaoConfirmar({ destino }: { destino: 'reagendar' | 'cancelar' }) {
  const { pending } = useFormStatus();
  const reagendar = destino === 'reagendar';
  return (
    <Button
      type="submit"
      variant={reagendar ? 'primary' : 'secondary'}
      size="sm"
      loading={pending}
      iconLeft={
        reagendar ? (
          <CalendarClock size={15} aria-hidden="true" />
        ) : (
          <CalendarX2 size={15} aria-hidden="true" />
        )
      }
    >
      {reagendar ? 'Escolher novo horário' : 'Marcar como não realizada'}
    </Button>
  );
}

export function ResolverReuniaoPendente({ reuniaoId }: { reuniaoId: string }) {
  const [aberto, setAberto] = useState(false);
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setAberto(true)}>
        Resolver pendência
      </Button>
      {montado &&
        createPortal(
          <Modal
            open={aberto}
            onClose={() => setAberto(false)}
            title="O que aconteceu com esta reunião?"
            description="O horário terminou sem a reunião ser concluída. Escolha como organizar a agenda."
            size="sm"
            footer={
              <div className={styles.acoes}>
                <form action={resolverReuniaoPendente}>
                  <input type="hidden" name="reuniao" value={reuniaoId} />
                  <input type="hidden" name="destino" value="cancelar" />
                  <BotaoConfirmar destino="cancelar" />
                </form>
                <form action={resolverReuniaoPendente}>
                  <input type="hidden" name="reuniao" value={reuniaoId} />
                  <input type="hidden" name="destino" value="reagendar" />
                  <BotaoConfirmar destino="reagendar" />
                </form>
              </div>
            }
          >
            <div className={styles.conteudo}>
              <p>
                Ao reagendar, o convite antigo é cancelado e a tela de agendamento já abre com o
                mesmo cliente selecionado.
              </p>
              <p>Nenhuma conversa ou informação da ficha do cliente será apagada.</p>
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
}
