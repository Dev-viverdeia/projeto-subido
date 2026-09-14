'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarDays, Check, Copy, ListChecks, MoreHorizontal, Video } from 'lucide-react';
import { DropdownMenu } from '@/design-system/via';
import type { TipoCall } from '@/lib/calls/tipos';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
import { podeAlterarHorario } from '@/lib/calls/agenda-modelo';
import { GerenciarAgenda } from './GerenciarAgenda';
import styles from './AcoesSala.module.css';

export function AcoesSala({
  id,
  codigo,
  tipo,
  destaque = false,
  reuniao,
}: {
  id: string;
  codigo: string;
  tipo?: TipoCall;
  destaque?: boolean;
  reuniao?: ReuniaoCall;
}) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [edicao, setEdicao] = useState(0);
  const caminho = `/sala/${codigo}`;
  const kickoff = tipo === 'kickoff';
  const rotuloPreparar = kickoff ? 'Preparar kickoff' : 'Preparar reunião';
  const rotuloEntrar = kickoff ? 'Entrar no kickoff' : 'Entrar na sala';

  async function copiar() {
    await navigator.clipboard.writeText(`${window.location.origin}${caminho}`);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  if (!destaque) {
    return (
      <div className={`${styles.acoes} ${styles.compactas}`}>
        {reuniao && edicao > 0 && (
          <GerenciarAgenda key={edicao} reuniao={reuniao} abertoInicial apenasModal />
        )}
        <Link href={`/reunioes/${id}`} className={styles.preparar}>
          <ListChecks size={16} aria-hidden="true" /> {rotuloPreparar}
        </Link>
        <DropdownMenu
          align="end"
          ariaLabel="Outras ações da reunião"
          trigger={
            <button type="button" className={styles.mais} aria-label="Outras ações">
              <MoreHorizontal size={19} aria-hidden="true" />
            </button>
          }
          items={[
            ...(reuniao && podeAlterarHorario(reuniao.status)
              ? [
                  {
                    id: 'editar',
                    label: 'Alterar reunião',
                    icon: <CalendarDays size={16} />,
                    onSelect: () => setEdicao((valor) => valor + 1),
                  },
                ]
              : []),
            {
              id: 'copiar',
              label: copiado ? 'Link copiado' : 'Copiar link da sala',
              icon: copiado ? <Check size={16} /> : <Copy size={16} />,
              onSelect: () => void copiar(),
            },
            {
              id: 'abrir',
              label: rotuloEntrar,
              icon: <Video size={16} />,
              onSelect: () => router.push(caminho),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.acoes} ${styles.destaque}`}>
      <Link href={`/reunioes/${id}`} className={styles.preparar}>
        <ListChecks size={15} aria-hidden="true" /> {rotuloPreparar}
      </Link>
      <Link href={caminho} className={styles.entrar}>
        <Video size={15} aria-hidden="true" /> {rotuloEntrar}
      </Link>
    </div>
  );
}
