import { describe, expect, it } from 'vitest';
import { empresasDoPedido, mencionados } from './cliente';
const empresas = [{ nome: 'Clínica Aurora' }, { nome: 'Escola Ipê' }, { nome: 'Aurora' }];
const historico = [{ papel: 'usuario', conteudo: 'Quero abordar a Clínica Aurora.' }];
describe('cliente citado na conversa', () => {
  it('reconhece acentos e pontuação, priorizando o nome específico', () => {
    expect(mencionados('A CLINICA AURORA, por favor.', empresas)).toEqual([empresas[0]]);
  });
  it('não confunde parte de palavra nem segmento com uma empresa', () => {
    expect(mencionados('auroral e aurorasil', empresas)).toEqual([]);
    expect(mencionados('uma clínica em Florianópolis', empresas)).toEqual([]);
  });
  it('troca de cliente pelo pedido atual', () => {
    expect(empresasDoPedido('Agora a Escola Ipê.', historico, empresas)).toEqual([empresas[1]]);
  });
  it('retoma referência explícita, sem arrastar a ficha para uma pergunta de estudo', () => {
    expect(empresasDoPedido('Uma proposta para essa empresa.', historico, empresas)).toEqual([
      empresas[0],
    ]);
    expect(empresasDoPedido('Quero estudar fundamentos de IA', historico, empresas)).toEqual([]);
  });
  it('não atravessa um cliente sem ficha nem uma mudança de assunto', () => {
    const depois = [
      ...historico,
      { papel: 'usuario', conteudo: 'Me ajude com a Loja Desconhecida.' },
    ];
    expect(empresasDoPedido('Faça uma mensagem para eles.', depois, empresas)).toEqual([]);
    expect(empresasDoPedido('Uma proposta para outro cliente.', historico, empresas)).toEqual([]);
  });
  it('não considera cliente citado só pela IA como escolha do usuário', () => {
    expect(
      empresasDoPedido(
        'Uma proposta para eles.',
        [{ papel: 'consultor', conteudo: 'Clínica Aurora' }],
        empresas,
      ),
    ).toEqual([]);
  });
  it('preserva ambiguidade entre nomes e homônimos', () => {
    expect(mencionados('Clínica Aurora e Escola Ipê', empresas)).toHaveLength(2);
    expect(mencionados('Clínica Aurora', [empresas[0]!, empresas[0]!])).toHaveLength(2);
  });
  it('não escolhe uma ficha explicitamente descartada', () => {
    expect(mencionados('Não é a Clínica Aurora, é outra empresa.', empresas)).toEqual([]);
  });
});
