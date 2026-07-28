import { describe, expect, it } from 'vitest';
import { DocumentoSolucao } from './schema';
import { paraMarkdown } from './markdown';

/**
 * O Markdown é o formato em que o projeto SAI da plataforma — vai para uma
 * proposta, um Notion, um e-mail para o cliente. Um erro aqui não aparece em
 * nenhuma tela: aparece no documento que o implementador já entregou.
 *
 * O documento de teste é validado pelo próprio schema antes de virar Markdown.
 * Sem isso, um campo renomeado no `schema.ts` deixaria este teste passando com
 * um objeto que o produto nunca produziria.
 */
const DOC = DocumentoSolucao.parse({
  titulo: 'Atendimento automático no WhatsApp',
  resumo: 'Responde fora do horário e marca a consulta na agenda que a recepção já usa.',
  viabilidade: { nivel: 'moderada', justificativa: 'O prontuário não expõe API pública.' },
  arquitetura: 'A mensagem chega no webhook do n8n, que monta o contexto e chama o modelo.',
  ferramentas: [{ nome: 'n8n', papel: 'Orquestra o fluxo.', custo: 'freemium' }],
  etapas: [
    { titulo: 'Levantar os pedidos comuns', descricao: 'Exportar e classificar.', ferramentas: [] },
    { titulo: 'Criar o webhook', descricao: 'Apontar a callback URL.', ferramentas: ['n8n'] },
    { titulo: 'Rodar em sombra', descricao: 'Gravar sem responder.', ferramentas: [] },
  ],
  prompts: [{ titulo: 'Sistema do agente', conteudo: '# Não é título\n- Não é lista' }],
  riscos: [{ risco: 'Soar como orientação clínica.', mitigacao: 'Bloquear e escalar.' }],
  economia: { horas_por_mes: 46, premissas: ['380 mensagens/mês fora do horário.'] },
  fora_do_escopo: ['Escrita no prontuário.'],
});

describe('paraMarkdown', () => {
  const md = paraMarkdown(DOC);

  it('abre com o título em h1 e o resumo logo abaixo', () => {
    expect(md.startsWith('# Atendimento automático no WhatsApp\n')).toBe(true);
    expect(md).toContain(DOC.resumo);
  });

  it('numera as etapas com dois dígitos, na ordem da ficha', () => {
    expect(md).toContain('### 01. Levantar os pedidos comuns');
    expect(md).toContain('### 03. Rodar em sombra');
    expect(md.indexOf('### 01.')).toBeLessThan(md.indexOf('### 03.'));
  });

  /**
   * A cerca de código não é estética. Prompts frequentemente começam linhas com
   * `#` ou `-`; colados crus, viram título e lista no destino e o prompt chega
   * ao cliente desfigurado.
   */
  it('cerca o prompt em bloco de código para o Markdown de dentro não vazar', () => {
    const bloco = md.slice(md.indexOf('### Sistema do agente'));
    expect(bloco).toContain('```\n# Não é título\n- Não é lista\n```');
  });

  it('leva a estimativa junto das premissas que a produziram', () => {
    expect(md).toContain('**46 h/mês**');
    expect(md).toContain('- 380 mensagens/mês fora do horário.');
    /* O número nunca aparece sem a conta: é a mesma regra da ficha. */
    expect(md.indexOf('**46 h/mês**')).toBeLessThan(md.indexOf('Premissas desta conta'));
  });

  it('mantém o fora do escopo, que é o que torna o resto crível', () => {
    expect(md).toContain('## Fora do escopo');
    expect(md).toContain('- Escrita no prontuário.');
  });

  it('não deixa seção vazia quando não há prompts', () => {
    const semPrompts = paraMarkdown({ ...DOC, prompts: [] });
    expect(semPrompts).not.toContain('## Prompts');
  });

  it('sai com as seções na MESMA ordem da ficha na tela', () => {
    const ordem = [
      '# ',
      '**Viabilidade:**',
      '## Como funciona',
      '## Ferramentas',
      '## Passo a passo',
      '## Prompts',
      '## Economia estimada',
      '## Riscos',
      '## Fora do escopo',
    ].map((t) => md.indexOf(t));

    expect(ordem.every((i) => i !== -1)).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
  });
});
