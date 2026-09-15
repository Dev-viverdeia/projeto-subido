import { describe, expect, it } from 'vitest';
import { destinoFerramenta, nomeArquivoMaterial, resumirRequisito } from './kit-visual';
import nina from '@/app/preview/nina/fixture.json';
import prospeccao from '@/app/preview/prospeccao-projeto/fixture.json';
import reunioes from '@/app/preview/reunioes-projeto/fixture.json';

describe('Apresentação dos materiais', () => {
  it.each([nina, prospeccao, reunioes])(
    'resume apenas requisitos do conteúdo conhecido',
    (projeto) => {
      for (const texto of projeto.roteiro.escopo.preRequisitos) {
        const resumo = resumirRequisito(texto);
        expect(resumo).not.toBeNull();
        expect(resumo!.titulo.length).toBeLessThan(texto.length);
      }
    },
  );
  it.each([
    'Novo acesso da empresa',
    'constructor',
    '__proto__',
    'Acesso oficial ao WhatsApp Business Platform com nova condição',
  ])('não aplica rótulo antigo a texto diferente: %s', (texto) => {
    expect(resumirRequisito(texto)).toBeNull();
  });
  it.each(['Supabase', 'OpenAI', 'OpenAI API', 'WhatsApp Business Platform', 'Google Calendar'])(
    'abre um destino oficial explícito para %s',
    (titulo) => {
      expect(new URL(destinoFerramenta(titulo)!).protocol).toBe('https:');
    },
  );
  it.each([
    'constructor',
    '__proto__',
    'javascript:alert(1)',
    'https://site-inventado.test',
    'Ferramenta nova',
  ])('não transforma título em endereço: %s', (titulo) => {
    expect(destinoFerramenta(titulo)).toBeNull();
  });
  it('gera nomes de arquivo seguros e reconhecíveis', () => {
    expect(nomeArquivoMaterial('Matriz de qualificação')).toBe('matriz-de-qualificacao.txt');
    expect(nomeArquivoMaterial('../../<script>')).toBe('script.txt');
    expect(nomeArquivoMaterial('☁')).toBe('material.txt');
    expect(nomeArquivoMaterial('a'.repeat(300))).toHaveLength(104);
  });
});
