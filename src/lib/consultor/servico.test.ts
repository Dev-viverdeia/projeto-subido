import { describe, expect, it, vi } from 'vitest';
import { DirecaoMensagemSchema, type AcaoSobral } from './direcao';
import { direcaoDaMensagem, type LeituraSobral } from './servico';
import { sinaisDeQualidade } from './qualidade-cenarios';
import { sinaisClienteQualidade } from './cliente-qualidade';
vi.mock('server-only', () => ({}));

function leitura(destino: AcaoSobral['destino'], usarFoco: boolean): LeituraSobral {
  const sinais = sinaisDeQualidade();
  const acao = {
    titulo: 'Criar a proposta do cliente',
    detalhe: 'Use os dados que o cliente confirmou na conversa.',
    evidencia: 'Rascunho da proposta disponível para revisão.',
    destino,
  };
  const direcao = {
    resposta: 'Você pode criar a proposta sem reunião.',
    memoria_anexos: '',
    diagnostico: 'O cliente já confirmou o escopo pelo WhatsApp.',
    foco: 'Preparar a proposta',
    proximo_passo: acao,
    acoes: [acao],
    recomendacoes: [],
    usar_venda_em_foco: usarFoco,
  };
  return {
    etapa: 'aprender',
    sinais,
    contextoHash: 'teste',
    rodada: { direcao, modelo: 'teste', respostaId: 'teste', tokens: 100 },
    plano: {
      etapa: 'aprender',
      diagnostico: direcao.diagnostico,
      foco: direcao.foco,
      proximoPasso: acao,
      acoes: [acao],
      sinais,
      modelo: 'teste',
      geradoEm: sinais.momento,
    },
  };
}

describe('associação da resposta ao cliente correto', () => {
  it('recibo da ficha é produzido pelo servidor, não pelo modelo', () => {
    const dados = leitura('/vendas', false);
    dados.sinais = sinaisClienteQualidade();
    const mensagem = DirecaoMensagemSchema.parse(direcaoDaMensagem(dados));
    expect(mensagem.ficha_consultada).toEqual(dados.sinais.cliente?.ficha);
    expect(mensagem.contexto_acao).toBeNull();
  });
  it.each(['/formacoes', '/solucoes', '/entregas', '/prospeccao', '/propostas/nova'] as const)(
    'não vincula %s à venda automática da conta',
    (destino) => {
      const mensagem = DirecaoMensagemSchema.parse(direcaoDaMensagem(leitura(destino, false)));
      expect(mensagem.contexto_acao).toBeNull();
      expect(mensagem.oportunidade_alvo).toBeNull();
    },
  );
  it('criar proposta leva ao formulário, não à confirmação de tarefa', () => {
    const mensagem = DirecaoMensagemSchema.parse(
      direcaoDaMensagem(leitura('/propostas/nova', true)),
    );
    expect(mensagem.contexto_acao).toBeNull();
    expect(mensagem.oportunidade_alvo).toBe(sinaisDeQualidade().foco?.oportunidadeId);
  });
  it('uma tarefa da venda identificada continua confirmável', () => {
    const mensagem = DirecaoMensagemSchema.parse(direcaoDaMensagem(leitura('/vendas', true)));
    expect(mensagem.contexto_acao?.empresa).toBe('Clínica Aurora');
  });
  it('não inventa cliente quando o modelo pede associação sem ficha', () => {
    const dados = leitura('/vendas', true);
    dados.sinais.foco = null;
    const mensagem = DirecaoMensagemSchema.parse(direcaoDaMensagem(dados));
    expect(mensagem.contexto_acao).toBeNull();
    expect(mensagem.oportunidade_alvo).toBeNull();
  });
});
