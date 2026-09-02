const ROTEIRO_KICKOFF = [
  {
    titulo: 'Resultado e sucesso',
    apoio: 'O que muda e como validar.',
  },
  {
    titulo: 'Responsáveis e acessos',
    apoio: 'Quem libera o quê para começar.',
  },
  {
    titulo: 'Acordo para revisar',
    apoio: 'Limites, decisões e próximos passos.',
  },
] as const;

const ROTEIRO_REUNIAO = [
  { titulo: 'Transcrição privada', apoio: 'Ligada à ficha do cliente.' },
  { titulo: 'Resumo para revisar', apoio: 'Decisões e próximos passos.' },
] as const;

const COACH = {
  titulo: 'Coach privado',
  apoio: 'Sugestões visíveis só para você.',
} as const;

export function RoteiroSala({
  kickoff,
  mostrarCoach,
}: {
  kickoff: boolean;
  mostrarCoach: boolean;
}) {
  const itens = kickoff
    ? ROTEIRO_KICKOFF
    : mostrarCoach
      ? [...ROTEIRO_REUNIAO, COACH]
      : ROTEIRO_REUNIAO;

  return (
    <ol>
      {itens.map((item, indice) => (
        <li key={item.titulo}>
          <span>{String(indice + 1).padStart(2, '0')}</span>
          <div>
            <strong>{item.titulo}</strong>
            <small>{item.apoio}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
