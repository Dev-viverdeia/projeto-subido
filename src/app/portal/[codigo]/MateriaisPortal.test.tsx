import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/tipos';
import { ArquivosPortal } from './ArquivosPortal';
import { EntregasPortal } from './EntregasPortal';
import { linkSuporte, PosEntregaPortal } from './PosEntregaPortal';
import { CabecalhoPortal } from './CabecalhoPortal';

const PROJETO: ProjetoPortalCliente = {
  id: 'projeto',
  titulo: 'Atendimento com IA',
  empresa: 'Empresa',
  resumo: '',
  objetivo: '',
  status: 'concluido',
  inicioEm: '2026-09-01',
  prazoEm: null,
  feitas: 2,
  total: 5,
  tarefas: [],
  arquivos: [],
  eventos: [],
  dependencias: [],
  mudancasEscopo: [],
  briefing: null,
  encerramento: null,
  evolucao: null,
};

describe('materiais e suporte do portal', () => {
  it('não promete aceite nem 100% de execução para uma conclusão manual', () => {
    render(<CabecalhoPortal projeto={PROJETO} />);
    expect(screen.getByText('Entrega registrada pelo profissional')).toBeVisible();
    expect(screen.queryByText('Aceite confirmado')).toBeNull();
    expect(screen.queryByText('100%')).toBeNull();
  });

  it('mostra estado vazio com orientação e sem botões de download falsos', () => {
    render(<ArquivosPortal codigo="codigo" projeto={PROJETO} />);
    expect(screen.getByText('Nenhum arquivo liberado')).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('mostra quatro arquivos, mantém os demais acessíveis e preserva a rota protegida', () => {
    render(
      <ArquivosPortal
        codigo="codigo"
        projeto={{
          ...PROJETO,
          arquivos: Array.from({ length: 6 }, (_, i) => ({
            id: String(i),
            tarefaId: null,
            titulo: `Documento ${i + 1}`,
            descricao: 'Instruções completas.',
            nomeOriginal: 'manual.pdf',
            mimeType: 'application/pdf',
            tamanhoBytes: 1000,
            versao: 2,
            publicadoEm: '2026-09-01',
          })),
        }}
      />,
    );
    const primeiro = screen.getByRole('link', { name: 'Baixar Documento 1, versão 2' });
    expect(primeiro).toBeVisible();
    expect(primeiro).toHaveAttribute('href', '/portal/codigo/arquivos/0');
    expect(primeiro.closest('details')).toBeNull();
    const ultimo = screen.getByText('Documento 6');
    expect(ultimo).not.toBeVisible();
    fireEvent.click(screen.getByText('Ver mais 2 arquivos'));
    expect(ultimo).toBeVisible();
    fireEvent.click(screen.getByLabelText('Detalhes de Documento 1'));
    expect(screen.getAllByText('Instruções completas.')[0]).toBeVisible();
    expect(screen.queryByText('Versões aprovadas para você')).toBeNull();
  });

  it('mantém suporte honesto quando o profissional ainda não definiu um canal', () => {
    render(<PosEntregaPortal projeto={PROJETO} />);
    expect(screen.getByText('Use o contato combinado com o profissional.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Falar com o suporte' })).toBeNull();
    expect(screen.queryByText('Garantia e continuidade')).toBeNull();
  });

  it('não apresenta tarefas internas como entregas já compartilhadas', () => {
    render(<EntregasPortal projeto={PROJETO} />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it.each([
    ['suporte@exemplo.com', 'mailto:suporte@exemplo.com'],
    [' https://example.com/atendimento ', 'https://example.com/atendimento'],
    ['Fale com Camila pelo WhatsApp', null],
    ['javascript:alert(1)', null],
    ['data:text/html,conteudo', null],
    ['https://usuario:senha@example.com', null],
    ['suporte@exemplo.com?bcc=outro@exemplo.com', null],
    ['http://example.com', null],
  ])('transforma o canal em link somente quando seguro: %s', (canal, esperado) => {
    expect(linkSuporte(canal)).toBe(esperado);
  });
});
