import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocumentoCertificado } from './DocumentoCertificado';

describe('documento co-branded', () => {
  it('separa o aviso de demonstração do nome e não afirma uma conclusão real', () => {
    render(
      <DocumentoCertificado
        nome="Rafael Milagre — CERTIFICADO DE DEMONSTRAÇÃO"
        titulo="IA aplicada"
        origem="formacao"
        concluidoEm="2026-09-08T12:00:00Z"
        codigo="registro-demo"
      />,
    );
    expect(screen.getByText('Rafael Milagre', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Certificado de demonstração')).toBeInTheDocument();
    expect(screen.getByText('Prévia ilustrativa · sem validade')).toBeInTheDocument();
    expect(screen.queryByText('Concluído em')).not.toBeInTheDocument();
    expect(screen.queryByText(/pela conclusão/)).not.toBeInTheDocument();
  });
  it('preserva as marcas oficiais e os dados reais de verificação', () => {
    render(
      <DocumentoCertificado
        nome="Pessoa Teste"
        titulo="IA no trabalho"
        origem="formacao"
        concluidoEm="2026-09-08T00:30:00.000Z"
        codigo="registro-real"
      />,
    );
    expect(screen.getByRole('img', { name: 'Subido' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Viver de IA' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IA no trabalho');
    expect(screen.getByText('7 de setembro de 2026')).toBeInTheDocument();
    expect(screen.getByText(/Código de verificação/).parentElement).toHaveTextContent(
      'registro-real',
    );
  });

  it('não inventa código, data, carga horária ou validade no modelo', () => {
    render(
      <DocumentoCertificado
        nome="Seu nome aqui"
        titulo="Sua próxima conquista"
        origem="formacao"
        compacto
        modelo
      />,
    );
    expect(screen.getByRole('article')).toHaveAccessibleName('Modelo de certificado');
    expect(screen.getByText('Prévia ilustrativa · sem validade')).toBeInTheDocument();
    expect(screen.queryByText(/Código de verificação/)).not.toBeInTheDocument();
    expect(document.querySelector('time')).toBeNull();
  });
});
