import { Fragment } from 'react';

/** Nós React: termos do usuário nunca viram HTML nem expressão regular. */
export function TrechoEncontrado({ texto, busca }: { texto: string; busca: string }) {
  const termo = busca.trim().toLowerCase();
  if (!termo) return <>{texto}</>;
  const partes = [];
  let inicio = 0;
  let posicao = texto.toLowerCase().indexOf(termo);
  while (posicao >= 0) {
    partes.push(
      <Fragment key={posicao}>
        {texto.slice(inicio, posicao)}
        <mark>{texto.slice(posicao, posicao + termo.length)}</mark>
      </Fragment>,
    );
    inicio = posicao + termo.length;
    posicao = texto.toLowerCase().indexOf(termo, inicio);
  }
  return (
    <>
      {partes}
      {texto.slice(inicio)}
    </>
  );
}
