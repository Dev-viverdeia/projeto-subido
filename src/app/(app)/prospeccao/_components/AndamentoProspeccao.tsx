'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/design-system/via';
import { enviarLeadAoCrm, registrarContatoProspeccao } from '@/lib/prospeccao/actions';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';
import { BotaoEnviarCrm } from './BotaoEnviarCrm';
import { rotuloStatusProspeccao, type StatusProspeccao } from './dossie';
import styles from './ModalProspeccao.module.css';

export function AndamentoProspeccao({
  lead,
  status: statusInicial,
  ultimoCanal,
  tentativas,
  oportunidade,
}: {
  lead: string;
  status: StatusProspeccao;
  ultimoCanal: string | null;
  tentativas: number;
  oportunidade: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(statusInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function atualizar(proximo: Exclude<StatusProspeccao, 'no_crm'>) {
    setErro(null);
    iniciar(async () => {
      const resultado = await registrarContatoProspeccao({
        lead,
        canal: ultimoCanal as CanalContatoProspeccao | null,
        status: proximo,
      });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setStatus(proximo);
      router.refresh();
    });
  }

  const etapa =
    status === 'no_crm' ? 3 : status === 'conversa_iniciada' ? 2 : status === 'novo' ? 0 : 1;

  return (
    <aside className={styles.andamento} aria-labelledby="andamento-titulo">
      <div className={styles.andamentoTopo}>
        <p id="andamento-titulo">Andamento</p>
        <span data-status={status}>{rotuloStatusProspeccao(status)}</span>
      </div>

      <ol className={styles.passosContato}>
        <li data-estado={etapa > 0 ? 'concluido' : 'atual'}>
          <span>{etapa > 0 ? <Check size={13} /> : '1'}</span>
          <div>
            <strong>Escolha um canal</strong>
            <small>Abra WhatsApp, e-mail ou uma rede social.</small>
          </div>
        </li>
        <li data-estado={etapa > 1 ? 'concluido' : etapa === 1 ? 'atual' : 'futuro'}>
          <span>{etapa > 1 ? <Check size={13} /> : '2'}</span>
          <div>
            <strong>Confirme a conversa</strong>
            <small>Marque quando alguém da empresa responder.</small>
          </div>
        </li>
        <li data-estado={etapa > 2 ? 'concluido' : etapa === 2 ? 'atual' : 'futuro'}>
          <span>{etapa > 2 ? <Check size={13} /> : '3'}</span>
          <div>
            <strong>Crie a oportunidade</strong>
            <small>Leve contexto e contatos qualificados ao CRM.</small>
          </div>
        </li>
      </ol>

      <div className={styles.resumoTentativas}>
        <span>Tentativas registradas</span>
        <strong>{tentativas}</strong>
      </div>

      {erro && <p className={styles.erroAndamento}>{erro}</p>}

      <div className={styles.acoesAndamento}>
        {status === 'no_crm' && oportunidade ? (
          <Link href={`/crm/${oportunidade}`} className="via-btn via-btn--primary via-btn--md">
            <span className="via-btn__label">Abrir oportunidade</span>
            <ArrowRight size={16} />
          </Link>
        ) : status === 'conversa_iniciada' ? (
          <form action={enviarLeadAoCrm}>
            <input type="hidden" name="lead" value={lead} />
            <BotaoEnviarCrm rotulo="Criar oportunidade no CRM" />
          </form>
        ) : status === 'sem_interesse' ? (
          <Button
            variant="secondary"
            iconLeft={<RotateCcw size={15} />}
            loading={pendente}
            onClick={() => atualizar('novo')}
          >
            Retomar prospecção
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              loading={pendente}
              disabled={status === 'novo'}
              iconLeft={<Check size={15} />}
              onClick={() => atualizar('conversa_iniciada')}
            >
              Alguém respondeu
            </Button>
            <Button
              variant="ghost"
              disabled={pendente}
              iconLeft={<X size={15} />}
              onClick={() => atualizar('sem_interesse')}
            >
              Marcar sem interesse
            </Button>
          </>
        )}
      </div>

      {status === 'novo' && (
        <p className={styles.ajudaAndamento}>
          Abra um canal de contato para iniciar esta prospecção.
        </p>
      )}
      {status === 'tentando_contato' && (
        <p className={styles.ajudaAndamento}>
          O CRM só será criado quando você confirmar que a conversa começou.
        </p>
      )}
    </aside>
  );
}
