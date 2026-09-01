'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CalendarClock, CalendarX2 } from 'lucide-react';
import { Button } from '@/design-system/via';
import { resolverReuniaoPendente } from '@/lib/calls/actions';
import { ModalOperacao } from '../../_components/ModalOperacao';
import styles from './ResolverReuniaoPendente.module.css';

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

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setAberto(true)}>
        Resolver pendência
      </Button>
      <ModalOperacao
        open={aberto}
        onClose={() => setAberto(false)}
        title="Resolver reunião pendente"
        description="Escolha se você quer reagendar ou encerrar este compromisso."
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
          <p>Reagendar cancela o convite atual e mantém esta conversa ligada ao mesmo cliente.</p>
          <p>Encerrar não apaga nenhuma informação da ficha.</p>
        </div>
      </ModalOperacao>
    </>
  );
}
