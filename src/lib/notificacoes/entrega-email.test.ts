import { describe, expect, it } from 'vitest';
import {
  emailDecisaoCliente,
  emailPendenciaResolvida,
  emailValidacaoSolicitada,
} from './entrega-email';

describe('e-mails da entrega', () => {
  it('monta a solicitação de validação com alternativa em texto', () => {
    const email = emailValidacaoSolicitada({
      empresa: 'Clínica Aurora',
      projeto: 'SDR com IA',
      tarefa: 'Validar atendimento',
      link: 'https://subido.viverdeia.ai/portal/abc',
      profissional: 'Rafael',
      nota: 'Teste o fluxo no WhatsApp.',
    });

    expect(email.assunto).toContain('Clínica Aurora');
    expect(email.html).toContain('Revisar entrega');
    expect(email.texto).toContain('https://subido.viverdeia.ai/portal/abc');
  });

  it('escapa conteúdo do cliente antes de montar o HTML', () => {
    const email = emailDecisaoCliente({
      empresa: 'Cliente <script>',
      projeto: 'Projeto',
      tarefa: 'Etapa',
      link: 'https://subido.viverdeia.ai/entregas/abc',
      decisao: 'ajustes',
      comentario: '<img src=x onerror=alert(1)>',
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<img src=x');
    expect(email.html).toContain('&lt;img src=x');
  });

  it('avisa o profissional quando uma pendência sai do caminho', () => {
    const email = emailPendenciaResolvida({
      empresa: 'Clínica Aurora',
      projeto: 'SDR com IA',
      tarefa: 'Liberar acesso ao WhatsApp',
      link: 'https://subido.viverdeia.ai/entregas/abc',
    });

    expect(email.assunto).toContain('cliente resolveu');
    expect(email.html).toContain('Uma pendência saiu do caminho');
    expect(email.texto).toContain('Liberar acesso ao WhatsApp');
  });
});
