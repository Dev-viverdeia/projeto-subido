import { describe, expect, it } from 'vitest';
import {
  dadosPerfilCertificado,
  LINKEDIN_PERFIL,
  linkPublicacaoLinkedIn,
} from './compartilhamento';

describe('compartilhamento de certificados', () => {
  it('codifica o link público sem permitir injetar parâmetros no LinkedIn', () => {
    const publico = 'https://subido.viverdeia.ai/certificado/teste?x=1&texto=João';
    const url = new URL(linkPublicacaoLinkedIn(publico));
    expect(url.origin).toBe('https://www.linkedin.com');
    expect(url.searchParams.get('url')).toBe(publico);
    expect([...url.searchParams.keys()]).toEqual(['url']);
  });
  it('usa o formulário de certificação sem prometer autofill', () => {
    expect(new URL(LINKEDIN_PERFIL).searchParams.get('startTask')).toBe('CERTIFICATION_NAME');
    expect(new URL(LINKEDIN_PERFIL).searchParams.has('name')).toBe(false);
  });
  it('preserva acentos, código e mês no mesmo fuso do documento', () => {
    const campos = dadosPerfilCertificado(
      'IA & saúde',
      'registro-123',
      'https://example.com/cert',
      '2026-09-01T00:30:00Z',
    );
    expect(campos).toContainEqual({ rotulo: 'Nome', valor: 'IA & saúde' });
    expect(campos).toContainEqual({ rotulo: 'Data de emissão', valor: 'agosto de 2026' });
    expect(campos).toContainEqual({ rotulo: 'Código da credencial', valor: 'registro-123' });
    expect(campos).toContainEqual({ rotulo: 'Organização emissora', valor: 'Viver de IA' });
  });
  it('não inventa uma data de emissão', () => {
    for (const data of [null, undefined, 'inválido']) {
      expect(
        dadosPerfilCertificado('IA', 'registro', 'url', data).some(
          (c) => c.rotulo === 'Data de emissão',
        ),
      ).toBe(false);
    }
  });
});
