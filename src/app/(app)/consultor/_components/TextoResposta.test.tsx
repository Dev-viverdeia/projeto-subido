import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TextoResposta } from './TextoResposta';
import { RecomendacoesResposta } from './RecomendacoesResposta';

describe('leitura segura da resposta', () => {
  const texto = [
    'Primeiro parágrafo.',
    'Detalhes com <script>alert(1)</script>.',
    'Fim. '.repeat(250),
  ].join('\n\n');
  it('escapa HTML e mantém todo o conteúdo no HTML do servidor', () => {
    const html = renderToStaticMarkup(<TextoResposta texto={texto} />);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Ler resposta completa');
    expect(html).toContain('Fim. '.repeat(249));
  });
  it('não recolhe a resposta enquanto gera ou quando ficou interrompida', () => {
    const html = renderToStaticMarkup(<TextoResposta texto={texto} completa />);
    expect(html).not.toContain('<details');
    expect(html).toContain('Fim. '.repeat(249));
  });
  it('não cria seção vazia nem dobra se existe só uma recomendação', () => {
    expect(renderToStaticMarkup(<RecomendacoesResposta cartoes={[]} />)).toBe('');
    const html = renderToStaticMarkup(
      <RecomendacoesResposta
        cartoes={[
          {
            tipo: 'aula',
            chave: 'aula-qa',
            titulo: 'Aula de exemplo',
            rotulo: 'Aula',
            href: '/formacoes',
            motivo: 'Uma indicação para revisar a proposta.',
          },
        ]}
      />,
    );
    expect(html).toContain('Abrir aula: Aula de exemplo');
    expect(html).not.toContain('Mais 1');
    expect(html).toContain('Uma indicação para revisar a proposta.');
  });
});
