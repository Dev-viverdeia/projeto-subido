import { describe, expect, it } from 'vitest';
import {
  categoriaDoAnexo,
  mimeBaseDoAnexo,
  nomeSeguroParaStorage,
  validarAnexosSobral,
} from './anexos-contrato';

describe('contrato dos anexos do Sobral AI', () => {
  it('reconhece imagem, documento e áudio', () => {
    expect(categoriaDoAnexo('image/png')).toBe('imagem');
    expect(categoriaDoAnexo('application/pdf')).toBe('documento');
    expect(categoriaDoAnexo('audio/webm;codecs=opus')).toBe('audio');
    expect(mimeBaseDoAnexo('audio/webm;codecs=opus')).toBe('audio/webm');
    expect(categoriaDoAnexo('application/x-msdownload')).toBeNull();
  });

  it('recusa mais de quatro arquivos e formatos não suportados', () => {
    const imagem = () => new File(['imagem'], 'foto.png', { type: 'image/png' });
    expect(validarAnexosSobral([imagem(), imagem(), imagem(), imagem(), imagem()])).toContain(
      'no máximo 4',
    );
    expect(
      validarAnexosSobral([
        new File(['bin'], 'programa.exe', { type: 'application/x-msdownload' }),
      ]),
    ).toContain('não é aceito');
  });

  it('normaliza o nome usado no caminho privado', () => {
    expect(nomeSeguroParaStorage('Proposta João / versão FINAL.pdf')).toBe(
      'Proposta-Joa-o-versa-o-FINAL.pdf',
    );
  });
});
