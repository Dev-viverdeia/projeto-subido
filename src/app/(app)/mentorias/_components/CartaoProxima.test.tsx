import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { CartaoProxima } from './CartaoProxima';

/**
 * O hero cobria TRÊS dos cinco estados. `lotada` e `fora-da-janela` caíam no
 * mesmo lugar — só "Ver detalhes", sem dizer por quê —, enquanto a linha da
 * agenda dez pixels abaixo explicava os dois. O elemento mais destacado da tela
 * era o que menos informava, e nada em tsc, eslint ou build enxerga isso.
 */
const BASE: SessaoMentoria = {
  id: 'm1',
  titulo: 'Plantão de implantação',
  descricao: '',
  inicioIso: '2026-08-10T19:00:00.000Z',
  fimIso: '2026-08-10T20:30:00.000Z',
  vagas: 30,
  salaUrl: null,
  mentor: {
    id: 'p1',
    nome: 'Equipe Subido',
    headline: 'Time de implementação',
    foto_url: null,
    trilha: 'implementacao',
  },
  inscritos: 12,
  euInscrito: false,
};

const AGORA = new Date('2026-08-10T10:00:00.000Z');

function montar(estado: Parameters<typeof CartaoProxima>[0]['estado'], sessao = BASE) {
  return render(
    <CartaoProxima
      sessao={sessao}
      estado={estado}
      agora={AGORA}
      gravando={false}
      aoAbrirDetalhe={vi.fn()}
      aoFazerCheckin={vi.fn()}
    />,
  );
}

describe('cartão da próxima sessão', () => {
  it('lotada DIZ que está lotada, com o número', () => {
    montar('lotada', { ...BASE, inscritos: 30 });
    expect(screen.getByText(/Sessão lotada — 30 de 30 vagas/)).toBeDefined();
    expect(screen.queryByRole('button', { name: /check-in/i })).toBeNull();
  });

  it('fora da janela DIZ quando o check-in abre', () => {
    montar('fora-da-janela');
    expect(screen.getByText(/Check-in abre/)).toBeDefined();
    expect(screen.queryByRole('button', { name: /check-in/i })).toBeNull();
  });

  /* Os quatro dados eram uma frase em mono que obrigava a decodificar a POSIÇÃO
     para saber o que era cada número — o mesmo defeito que o modal da sessão já
     tinha corrigido, e que aqui tinha ficado. */
  it('os quatro dados têm rótulo, não são uma frase em mono', () => {
    montar('checkin-aberto');
    for (const rotulo of ['Quando', 'Horário', 'Duração', 'Vagas']) {
      expect(screen.getByText(rotulo)).toBeDefined();
    }
    expect(screen.getByText('12/30')).toBeDefined();
  });

  it('inscrito mostra confirmação e não oferece check-in de novo', () => {
    montar('inscrito');
    expect(screen.getByText('Check-in confirmado')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Fazer check-in' })).toBeNull();
  });

  it('ao vivo leva à sala da sessão', () => {
    montar('ao-vivo');
    const entrar = screen.getByRole('link', { name: 'Entrar na sala' });
    expect(entrar.getAttribute('href')).toContain('/mentorias/');
  });
});
