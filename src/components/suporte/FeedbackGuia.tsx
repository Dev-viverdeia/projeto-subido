'use client';
import { useState, useTransition } from 'react';
import { avaliarGuia } from '@/lib/suporte/actions';
import s from './suporte.module.css';
export function FeedbackGuia({ slug }: { slug: string }) {
  const [retorno, setRetorno] = useState('');
  const [pendente, iniciar] = useTransition();
  return (
    <div className={s.lista}>
      <div className={s.acoes}>
        <span className={s.meta}>Esta orientação ajudou?</span>
        {[true, false].map((util) => (
          <button
            className={s.chip}
            key={String(util)}
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                try {
                  const r = await avaliarGuia(slug, util);
                  setRetorno(r.ok ? 'Obrigado. Sua avaliação ajuda a melhorar os guias.' : r.erro);
                } catch {
                  setRetorno('Não foi possível salvar a avaliação. Tente novamente.');
                }
              })
            }
          >
            {util ? 'Sim' : 'Ainda preciso de ajuda'}
          </button>
        ))}
      </div>
      {retorno && (
        <p role="status" className={s.meta}>
          {retorno}
        </p>
      )}
    </div>
  );
}
