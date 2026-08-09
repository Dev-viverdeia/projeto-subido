'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Globe2, LockKeyhole, Pause, RefreshCw } from 'lucide-react';
import {
  configurarPortalCliente,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import styles from './PortalClienteCard.module.css';

const INICIAL: EstadoProjetoExecucao = {};

export function PortalClienteCard({
  projetoId,
  ativo,
  codigo,
}: {
  projetoId: string;
  ativo: boolean;
  codigo: string;
}) {
  const [estado, acao, pendente] = useActionState(configurarPortalCliente, INICIAL);
  const [copiado, setCopiado] = useState(false);
  const caminho = `/portal/${codigo}`;

  async function copiar() {
    await navigator.clipboard.writeText(`${window.location.origin}${caminho}`);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <section className={styles.portal} data-ativo={ativo || undefined}>
      <div className={styles.topo}>
        <span className={styles.icone}>
          <Globe2 size={16} aria-hidden="true" />
        </span>
        <div>
          <p>Portal do cliente</p>
          <strong>{ativo ? 'Acompanhamento ativo' : 'Pronto para compartilhar'}</strong>
        </div>
        <span className={styles.estado}>{ativo ? 'Ativo' : 'Privado'}</span>
      </div>

      <p className={styles.explicacao}>
        {ativo
          ? 'O cliente vê somente o progresso e as entregas preparadas para ele.'
          : 'Ative quando quiser dar visibilidade ao projeto sem expor suas notas internas.'}
      </p>

      {ativo ? (
        <>
          <div className={styles.acoesPrincipais}>
            <button type="button" onClick={() => void copiar()}>
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              {copiado ? 'Link copiado' : 'Copiar link'}
            </button>
            <Link href={caminho} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> Abrir
            </Link>
          </div>

          <form action={acao} className={styles.acoesSecundarias}>
            <input type="hidden" name="projeto" value={projetoId} />
            <button type="submit" name="operacao" value="desativar" disabled={pendente}>
              <Pause size={13} aria-hidden="true" /> Pausar
            </button>
            <button
              type="submit"
              name="operacao"
              value="renovar"
              disabled={pendente}
              onClick={(evento) => {
                if (!window.confirm('Trocar o link? O endereço anterior deixará de funcionar.')) {
                  evento.preventDefault();
                }
              }}
            >
              <RefreshCw size={13} aria-hidden="true" /> Trocar link
            </button>
          </form>
        </>
      ) : (
        <form action={acao}>
          <input type="hidden" name="projeto" value={projetoId} />
          <button
            type="submit"
            name="operacao"
            value="ativar"
            disabled={pendente}
            className={styles.ativar}
          >
            <LockKeyhole size={15} aria-hidden="true" />
            {pendente ? 'Ativando…' : 'Ativar portal seguro'}
          </button>
        </form>
      )}

      {estado.erro && <small role="alert">{estado.erro}</small>}
      {estado.sucesso && <small role="status">{estado.sucesso}</small>}
    </section>
  );
}
