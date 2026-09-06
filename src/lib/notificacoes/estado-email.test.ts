import { describe, expect, it } from 'vitest';
import { recuperacaoEmail, tituloEmail } from './estado-email';

const agora = Date.parse('2026-09-06T15:00:00Z');
const evento = {
  email_status: 'falhou',
  email_erro: 'envio_incerto',
  email_tentativas: 1,
  email_fingerprint: 'a'.repeat(64),
  email_primeira_tentativa_em: '2026-09-06T14:50:00Z',
  email_atualizado_em: '2026-09-06T14:59:30Z',
};

describe('recuperação do e-mail', () => {
  it('não chama enviado de entregue', () => {
    expect(tituloEmail('enviado')).toBe('E-mail enviado');
    expect(tituloEmail('entregue')).toBe('Entrega confirmada');
    expect(tituloEmail('falhou')).toBe('Envio não confirmado');
  });
  it.each(['enviado', 'entregue', 'atrasado'])('não oferece reenvio para %s', (email_status) => {
    expect(recuperacaoEmail({ ...evento, email_status }, agora)).toBe('nenhuma');
  });
  it('verifica o mesmo envio quando o resultado é incerto', () => {
    expect(recuperacaoEmail(evento, agora)).toBe('verificar');
  });
  it('bloqueia incerteza fora da janela do provedor e registros legados', () => {
    expect(recuperacaoEmail(evento, agora + 24 * 3_600_000)).toBe('bloqueado');
    expect(recuperacaoEmail({ ...evento, email_fingerprint: null }, agora)).toBe('bloqueado');
  });
  it('espera a tentativa em andamento e recupera uma tentativa interrompida', () => {
    expect(recuperacaoEmail({ ...evento, email_status: 'enviando' }, agora)).toBe('nenhuma');
    expect(recuperacaoEmail({ ...evento, email_status: 'enviando' }, agora + 120_000)).toBe(
      'verificar',
    );
  });
  it('permite corrigir endereço recusado e respeita bloqueio de spam', () => {
    expect(recuperacaoEmail({ ...evento, email_status: 'devolvido' }, agora)).toBe('corrigir');
    expect(recuperacaoEmail({ ...evento, email_status: 'reclamado' }, agora)).toBe('bloqueado');
    expect(recuperacaoEmail({ ...evento, email_status: 'suprimido' }, agora)).toBe('bloqueado');
  });
});
