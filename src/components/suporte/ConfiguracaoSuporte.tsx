'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/design-system/via';
import { salvarConfiguracaoSuporte } from '@/lib/suporte/actions';
import s from './suporte.module.css';

export function ConfiguracaoSuporte({
  horario,
  aviso,
  meta_horas,
}: {
  horario: string;
  aviso: string;
  meta_horas: number;
}) {
  const [mensagem, setMensagem] = useState('');
  const [pendente, iniciar] = useTransition();
  return (
    <details className={s.pergunta}>
      <summary>Horário e avisos da central</summary>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          const dados = new FormData(e.currentTarget);
          iniciar(async () => {
            try {
              const r = await salvarConfiguracaoSuporte({
                horario: dados.get('horario'),
                aviso: dados.get('aviso'),
                meta_horas: Number(dados.get('meta_horas')),
              });
              setMensagem(r.ok ? 'Configuração salva.' : r.erro);
            } catch {
              setMensagem('Não foi possível salvar. Tente novamente.');
            }
          });
        }}
      >
        <label className={s.campo}>
          Horário de atendimento
          <input
            className={s.input}
            name="horario"
            defaultValue={horario}
            placeholder="Ex.: segunda a sexta, das 9h às 18h · Brasília"
            maxLength={180}
          />
        </label>
        <label className={s.campo}>
          Aviso temporário
          <textarea
            className={s.textarea}
            name="aviso"
            defaultValue={aviso}
            maxLength={300}
            placeholder="Deixe vazio para não exibir um aviso."
          />
        </label>
        <label className={s.campo}>
          Meta interna de primeira resposta (horas)
          <input
            className={s.input}
            name="meta_horas"
            type="number"
            min={1}
            max={168}
            defaultValue={meta_horas}
            required
          />
        </label>
        <span className={s.meta}>
          A meta organiza a equipe. Não é uma promessa exibida ao cliente.
        </span>
        <Button type="submit" loading={pendente}>
          Salvar configuração
        </Button>
        {mensagem && <p role="status">{mensagem}</p>}
      </form>
    </details>
  );
}
