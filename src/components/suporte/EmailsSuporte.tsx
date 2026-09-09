'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/design-system/via';
import { revisarEmailSuporte } from '@/lib/suporte/actions';
import s from './suporte.module.css';
export function EmailsSuporte({
  itens,
}: {
  itens: { id: string; atendimento: string | null; estado: string; motivo: string | null }[];
}) {
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <details className={s.pergunta}>
      <summary>E-mails que precisam de atenção ({itens.length})</summary>
      <p className={s.meta}>
        O original foi preservado. Confira o remetente antes de usar anexos ou links. Reprocessar
        mantém todas as verificações de segurança.
      </p>
      {itens.map((item) => (
        <div className={s.linha} key={item.id}>
          <div>
            <strong>{item.motivo || 'Recebimento em análise'}</strong>
            <div className={s.acoes}>
              <a className={s.atalho} href={`/api/suporte/email/${item.id}/original`}>
                Baixar e-mail original
              </a>
              {item.atendimento && (
                <Link className={s.atalho} href={`/suporte/equipe/${item.atendimento}`}>
                  Ver atendimento
                </Link>
              )}
            </div>
          </div>
          <div className={s.acoes}>
            {(['reprocessar', 'ignorar'] as const).map((acao) => (
              <Button
                key={acao}
                variant="secondary"
                disabled={pendente}
                onClick={() =>
                  iniciar(async () => {
                    setErro('');
                    try {
                      const r = await revisarEmailSuporte(item.id, acao);
                      if (!r.ok) setErro(r.erro);
                      else router.refresh();
                    } catch {
                      setErro('Não foi possível atualizar. Tente novamente.');
                    }
                  })
                }
              >
                {acao === 'reprocessar' ? 'Reprocessar' : 'Ignorar'}
              </Button>
            ))}
          </div>
        </div>
      ))}
      {erro && (
        <p role="alert" className={s.erro}>
          {erro}
        </p>
      )}
    </details>
  );
}
