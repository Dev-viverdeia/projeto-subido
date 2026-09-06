'use client';

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';

type RetornoEntrega = { erro?: string; sucesso?: string; aviso?: string };
const assinar = () => () => {};
const clientePronto = () => true;
const servidorPronto = () => false;

/** Form action reseta campos mesmo quando a ação retorna um erro recuperável. */
export function useFormularioEntrega(
  action: (estado: RetornoEntrega, dados: FormData) => Promise<RetornoEntrega>,
) {
  const pronto = useSyncExternalStore(assinar, clientePronto, servidorPronto);
  const trava = useRef(false);
  const [editado, setEditado] = useState(false);
  const [operacao, setOperacao] = useState('');
  const [retorno, executar, pendente] = useActionState(
    async (estado: RetornoEntrega, dados: FormData) => {
      try {
        return await action(estado, dados);
      } catch {
        return {
          erro: 'Não foi possível confirmar o salvamento. Seu texto continua aqui. Tente novamente.',
        };
      } finally {
        trava.current = false;
      }
    },
    {},
  );

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pronto || trava.current) return;
    const dados = new FormData(evento.currentTarget);
    const botao = (evento.nativeEvent as SubmitEvent).submitter;
    if (botao instanceof HTMLButtonElement && botao.name) dados.set(botao.name, botao.value);
    setOperacao(botao instanceof HTMLButtonElement ? botao.value : '');
    setEditado(false);
    trava.current = true;
    startTransition(() => executar(dados));
  }

  return {
    estado: editado ? { ...retorno, sucesso: undefined } : retorno,
    enviar,
    editar: () => setEditado(true),
    pendente,
    bloqueado: !pronto || pendente,
    operacao,
  };
}
