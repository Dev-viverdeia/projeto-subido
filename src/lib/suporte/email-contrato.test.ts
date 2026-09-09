import { describe, it, expect } from 'vitest';
import {
  caixaPostal,
  casoDoEndereco,
  enderecoResposta,
  idMensagemSeguro,
  respostaAutomatica,
  textoResposta,
  escaparHtml,
} from './email-contrato';
const id = '11111111-1111-4111-8111-111111111111',
  domain = 'subido.example',
  key = 'x'.repeat(48);
describe('endereço de resposta', () => {
  it('autentica o ticket sem confiar em assunto ou UUID sozinho', () => {
    const address = enderecoResposta(id, domain, key);
    expect(casoDoEndereco(address, domain, key)).toBe(id);
    expect(casoDoEndereco(caixaPostal(`Equipe <${address.toUpperCase()}>`)!, domain, key)).toBe(id);
    expect(address.split('@')[0]!.length).toBeLessThanOrEqual(64);
    expect(casoDoEndereco(address, domain, 'outra-chave')).toBeNull();
    expect(casoDoEndereco(address.replace('11111111', '21111111'), domain, key)).toBeNull();
    expect(casoDoEndereco(address + 'evil', domain, key)).toBeNull();
    expect(casoDoEndereco(`r-${id}@${domain}`, domain, key)).toBeNull();
  });
  it('aceita somente uma caixa postal e rejeita injeção de cabeçalhos', () => {
    expect(caixaPostal('Cliente <Nome@empresa.com>')).toBe('nome@empresa.com');
    expect(caixaPostal('a@b.com, c@d.com')).toBeNull();
    expect(caixaPostal('a@b.com\r\nBcc:evil@x.com')).toBeNull();
    expect(idMensagemSeguro('<x@example.test>')).toBe('<x@example.test>');
    expect(idMensagemSeguro('<x@example.test>\r\nBcc: evil')).toBeNull();
  });
  it('ignora robôs e mantém resposta sem ecoar o histórico', () => {
    expect(respostaAutomatica({ 'Auto-Submitted': 'auto-replied' })).toBe(true);
    expect(respostaAutomatica({ 'Auto-Submitted': 'no' })).toBe(false);
    expect(respostaAutomatica({ 'List-Id': 'newsletter' })).toBe(true);
    expect(textoResposta('Agora deu certo.\n\nEm ontem escreveu:\ntexto antigo')).toBe(
      'Agora deu certo.',
    );
    expect(escaparHtml('<img src=x onerror="x">')).not.toContain('<img');
  });
});
