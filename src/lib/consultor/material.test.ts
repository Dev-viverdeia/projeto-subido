import { describe, expect, it } from 'vitest';
import {
  MaterialDaMensagemSchema,
  ResumoMaterialSchema,
  SalvarMaterialSchema,
  destinoResumoSalvo,
} from './material';

const id = '11111111-1111-4111-8111-111111111111';
const resumo = {
  titulo: 'Atendimento com IA',
  escopo: 'Responder dúvidas aprovadas.',
  decisoes: '',
  tarefas: '',
  pendencias: 'Confirmar orçamento.',
};
describe('resumo revisável do material', () => {
  it('preserva desconhecidos vazios e separa pendências', () => {
    expect(ResumoMaterialSchema.parse(resumo)).toEqual(resumo);
    expect(
      SalvarMaterialSchema.safeParse({ ...resumo, mensagem: id, oportunidade: id, revisado: 'sim' })
        .success,
    ).toBe(true);
  });
  it('exige revisão, ficha e conteúdo útil; limita os campos', () => {
    const base = { ...resumo, mensagem: id, oportunidade: id, revisado: 'sim' };
    for (const alteracao of [
      { revisado: false },
      { oportunidade: 'x' },
      { mensagem: 'x' },
      { escopo: 'x'.repeat(1201) },
      { titulo: 'x'.repeat(121) },
      { escopo: '  ', pendencias: '' },
    ])
      expect(SalvarMaterialSchema.safeParse({ ...base, ...alteracao }).success).toBe(false);
  });
  it('aceita somente referências de anexos e elimina campos não previstos', () => {
    const material = {
      resumo,
      oportunidade: null,
      fontes: [{ id, nome: 'reuniao.pdf', caminhoStorage: 'segredo' }],
    };
    expect(MaterialDaMensagemSchema.parse(material).fontes[0]).toEqual({ id, nome: 'reuniao.pdf' });
    expect(MaterialDaMensagemSchema.safeParse({ ...material, fontes: [] }).success).toBe(false);
    expect(
      MaterialDaMensagemSchema.safeParse({ ...material, fontes: Array(5).fill(material.fontes[0]) })
        .success,
    ).toBe(false);
  });
  it('o link aponta para o registro exato, não só para a página da ficha', () => {
    expect(destinoResumoSalvo({ id, oportunidade: id, salvoEm: '' })).toBe(
      `/vendas/${id}?resumo=${id}#resumo-material`,
    );
  });
});
