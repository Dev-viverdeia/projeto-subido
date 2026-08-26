'use client';

import { useActionState, useEffect } from 'react';
import { Coins, Layers3 } from 'lucide-react';
import { Button, Spinner } from '@/design-system/via';
import {
  alterarPlanoAdmin,
  concederPacoteAdmin,
  ESTADO_ADMIN_ACESSO,
  type EstadoAdminAcesso,
} from '@/lib/admin/actions';
import type { ContaAdministrada } from '@/lib/admin/acessos';
import { PACOTES_CREDITOS, PLANOS_SUBIDO, type PlanoSubido } from '@/lib/planos/acessos';
import styles from './PainelContas.module.css';

function nomeConta(conta: ContaAdministrada): string {
  return conta.nome || conta.email?.split('@')[0] || 'Conta sem nome';
}

function Processando({ titulo, detalhe }: { titulo: string; detalhe: string }) {
  return (
    <div className={styles.processando} role="status" aria-live="polite">
      <Spinner size="md" />
      <div>
        <strong>{titulo}</strong>
        <span>{detalhe}</span>
      </div>
    </div>
  );
}

export function ConfirmarPlano({
  conta,
  plano,
  onCancelar,
  onConcluir,
}: {
  conta: ContaAdministrada;
  plano: PlanoSubido;
  onCancelar: () => void;
  onConcluir: (estado: EstadoAdminAcesso) => void;
}) {
  const [estado, acao, pendente] = useActionState(alterarPlanoAdmin, ESTADO_ADMIN_ACESSO);

  useEffect(() => {
    if (estado.status === 'sucesso') onConcluir(estado);
  }, [estado, onConcluir]);

  if (pendente) {
    return (
      <Processando
        titulo="Atualizando o acesso"
        detalhe="Estamos aplicando o plano e registrando a alteração."
      />
    );
  }

  return (
    <form action={acao} className={styles.confirmacao}>
      <input type="hidden" name="usuario" value={conta.id} />
      <input type="hidden" name="plano" value={plano} />
      <span className={styles.iconeConfirmacao} aria-hidden="true">
        <Layers3 size={21} strokeWidth={1.7} />
      </span>
      <div>
        <p>Confirmar novo acesso</p>
        <h3>
          Mudar {nomeConta(conta)} para o plano {PLANOS_SUBIDO[plano].nome}?
        </h3>
        <span>
          {plano === 'starter'
            ? 'A operação comercial será removida na próxima atualização da sessão dessa conta.'
            : plano === 'enterprise'
              ? 'A operação comercial e os controles de equipe serão liberados na próxima atualização da sessão.'
              : 'A operação comercial será liberada na próxima atualização da sessão dessa conta.'}
        </span>
      </div>
      {estado.status === 'erro' && (
        <p className={styles.erro} role="alert">
          {estado.mensagem}
        </p>
      )}
      <div className={styles.acoesConfirmacao}>
        <Button type="button" variant="secondary" onClick={onCancelar}>
          Voltar
        </Button>
        <Button type="submit">Confirmar mudança</Button>
      </div>
    </form>
  );
}

export function ConfirmarPacote({
  conta,
  pacoteId,
  onCancelar,
  onConcluir,
}: {
  conta: ContaAdministrada;
  pacoteId: (typeof PACOTES_CREDITOS)[number]['id'];
  onCancelar: () => void;
  onConcluir: (estado: EstadoAdminAcesso) => void;
}) {
  const [estado, acao, pendente] = useActionState(concederPacoteAdmin, ESTADO_ADMIN_ACESSO);
  const pacote = PACOTES_CREDITOS.find((item) => item.id === pacoteId)!;

  useEffect(() => {
    if (estado.status === 'sucesso') onConcluir(estado);
  }, [estado, onConcluir]);

  if (pendente) {
    return (
      <Processando
        titulo="Adicionando o pacote"
        detalhe="Estamos atualizando o saldo e guardando o comprovante interno."
      />
    );
  }

  return (
    <form action={acao} className={styles.confirmacao}>
      <input type="hidden" name="usuario" value={conta.id} />
      <input type="hidden" name="pacote" value={pacote.id} />
      <span className={styles.iconeConfirmacao} aria-hidden="true">
        <Coins size={21} strokeWidth={1.7} />
      </span>
      <div>
        <p>Confirmar pacote</p>
        <h3>
          Adicionar {pacote.creditos} créditos a {nomeConta(conta)}?
        </h3>
        <span>
          O saldo passa de {conta.saldo} para {conta.saldo + pacote.creditos} créditos. A operação
          ficará registrada no histórico.
        </span>
      </div>
      {estado.status === 'erro' && (
        <p className={styles.erro} role="alert">
          {estado.mensagem}
        </p>
      )}
      <div className={styles.acoesConfirmacao}>
        <Button type="button" variant="secondary" onClick={onCancelar}>
          Voltar
        </Button>
        <Button type="submit">Adicionar pacote</Button>
      </div>
    </form>
  );
}
