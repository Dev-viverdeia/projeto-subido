'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system/via';
import { adicionarAgente, configurarAgente } from '@/lib/suporte/actions';
import type { AgenteSuporte } from '@/lib/suporte/contrato';
import s from './suporte.module.css';
export function EquipeSuporte({ agentes }: { agentes: AgenteSuporte[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [retorno, setRetorno] = useState('');
  const [pendente, iniciar] = useTransition();
  return (
    <details className={s.pergunta}>
      <summary>Equipe e avisos por e-mail</summary>
      <div className={s.lista}>
        <p className={s.meta}>
          Pessoas adicionadas podem atender pedidos, mas não recebem acesso à administração
          financeira.
        </p>
        {agentes.map((a) => (
          <div className={s.linha} key={a.usuario}>
            <span>{a.nome}</span>
            <div className={s.acoes}>
              <label className={s.checkbox}>
                <input
                  type="checkbox"
                  checked={a.notificar}
                  disabled={pendente}
                  onChange={(e) => {
                    const notificar = e.target.checked;
                    iniciar(async () => {
                      try {
                        const r = await configurarAgente({ ...a, notificar });
                        setRetorno(r.ok ? 'Preferência salva.' : r.erro);
                        router.refresh();
                      } catch {
                        setRetorno('Não foi possível salvar. Tente novamente.');
                      }
                    });
                  }}
                />
                Receber avisos
              </label>
              <Button
                variant="ghost"
                disabled={pendente}
                onClick={() =>
                  iniciar(async () => {
                    try {
                      const r = await configurarAgente({ ...a, remover: true });
                      setRetorno(r.ok ? 'Pessoa removida da equipe de suporte.' : r.erro);
                      router.refresh();
                    } catch {
                      setRetorno('Não foi possível remover.');
                    }
                  })
                }
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
        <form
          className={s.acoes}
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              try {
                const r = await adicionarAgente(email);
                setRetorno(r.ok ? 'Pessoa adicionada à equipe.' : r.erro);
                if (r.ok) setEmail('');
                router.refresh();
              } catch {
                setRetorno('Não foi possível adicionar.');
              }
            });
          }}
        >
          <label className={s.campo}>
            E-mail de uma conta do Subido
            <input
              className={s.input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button type="submit" loading={pendente}>
            Adicionar à equipe
          </Button>
        </form>
        {retorno && (
          <p role="status" className={s.meta}>
            {retorno}
          </p>
        )}
      </div>
    </details>
  );
}
