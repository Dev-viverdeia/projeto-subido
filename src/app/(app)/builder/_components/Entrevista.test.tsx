import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RespostaClarificacao } from '@/lib/builder/schema';
import { Entrevista } from './Entrevista';

/**
 * A REGRA QUE ESTE TESTE PROTEGE É A MAIS FÁCIL DE PERDER NUM REDESENHO:
 * nenhuma resposta é obrigatória.
 *
 * Ela estava escrita e implementada na versão em lista, e uma pergunta por vez é
 * exatamente o layout que convida a travar o avanço "para a pessoa não pular".
 * Travar é a forma mais rápida de fazer alguém escrever "não sei" cinco vezes —
 * resposta pior que campo vazio, porque entra no prompt como se fosse informação.
 *
 * O resto prende a navegação: "Voltar" só a partir da segunda (na primeira não
 * tem destino), e a última pergunta troca o rótulo em vez de avançar para o nada.
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/* O mock tipa os argumentos que o componente realmente passa — sem isso o
   `mock.calls` volta como tupla vazia e o teste não consegue ler o que foi
   enviado, que é justamente o que ele precisa conferir. */
const pedirGeracao = vi.fn<
  (
    id: string,
    respostas: RespostaClarificacao[],
  ) => Promise<{
    falha: null;
  }>
>(() => Promise.resolve({ falha: null }));

vi.mock('@/lib/builder/invocar', () => ({
  pedirGeracao: (id: string, respostas: RespostaClarificacao[]) => pedirGeracao(id, respostas),
}));

const PERGUNTAS: RespostaClarificacao[] = [
  { pergunta: 'Você já usa WhatsApp Business?', porque: 'Muda a integração.', resposta: '' },
  { pergunta: 'Como é o vendedor ideal?', porque: 'Define o tom.', resposta: '' },
  { pergunta: 'Qual o volume por dia?', porque: 'Define o custo.', resposta: '' },
];

function montar() {
  return render(<Entrevista id="p1" ideia="Um vendedor no WhatsApp" perguntas={PERGUNTAS} />);
}

beforeEach(() => {
  pedirGeracao.mockClear();
});

describe('entrevista', () => {
  it('mostra uma pergunta por vez, com a posição', () => {
    montar();
    expect(screen.getByText('Você já usa WhatsApp Business?')).toBeDefined();
    expect(screen.queryByText('Como é o vendedor ideal?')).toBeNull();
    expect(screen.getByText(/Pergunta 1 de 3/)).toBeDefined();
  });

  /* A regra central: avançar NUNCA depende de ter texto. */
  it('avança com o campo vazio', async () => {
    const user = userEvent.setup();
    montar();

    const avancar = screen.getByRole('button', { name: 'Próxima pergunta' });
    expect(avancar).toHaveProperty('disabled', false);

    await user.click(avancar);
    expect(screen.getByText('Como é o vendedor ideal?')).toBeDefined();
  });

  /* Botão que não faz nada ensina a ignorar os que fazem. */
  it('"Voltar" não existe na primeira e aparece na segunda', async () => {
    const user = userEvent.setup();
    montar();

    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDefined();
  });

  it('voltar preserva o que já foi escrito', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByRole('textbox'), 'uso a API oficial');
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByRole('textbox')).toHaveProperty('value', 'uso a API oficial');
  });

  it('na última, o rótulo vira gerar — e não há para onde avançar', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));

    expect(screen.queryByRole('button', { name: 'Próxima pergunta' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Gerar o projeto' }));
    expect(pedirGeracao).toHaveBeenCalledTimes(1);
  });

  /* O envio leva TODAS as respostas, não só a da tela — o estado é da entrevista
     inteira, não da pergunta visível. */
  it('envia o conjunto inteiro, incluindo as vazias', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByRole('textbox'), 'primeira');
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    await user.click(screen.getByRole('button', { name: 'Gerar o projeto' }));

    const respostas = pedirGeracao.mock.calls[0]?.[1] ?? [];
    expect(respostas).toHaveLength(3);
    expect(respostas[0]?.resposta).toBe('primeira');
    expect(respostas[1]?.resposta).toBe('');
  });

  it('o contador do campo acompanha o que foi digitado', async () => {
    const user = userEvent.setup();
    montar();

    expect(screen.getByText('0 / 2000')).toBeDefined();
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(screen.getByText('3 / 2000')).toBeDefined();
  });
});
