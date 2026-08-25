import { describe, expect, it } from 'vitest';
import { campoBrasiliaParaIso, isoParaCampoBrasilia, mentoriaAdminSchema } from './admin';

describe('horários de mentorias', () => {
  it('converte o horário de Brasília sem mudar a hora informada', () => {
    const iso = campoBrasiliaParaIso('2026-09-03T19:30');
    expect(iso).toBe('2026-09-03T22:30:00.000Z');
    expect(isoParaCampoBrasilia(iso ?? '')).toBe('2026-09-03T19:30');
  });

  it('recusa datas impossíveis', () => {
    expect(campoBrasiliaParaIso('2026-02-31T19:30')).toBeNull();
  });
});

describe('cadastro de mentoria', () => {
  it('recusa encerramento anterior ao início', () => {
    const resultado = mentoriaAdminSchema.safeParse({
      titulo: 'Clínica de projetos',
      descricao: '',
      mentor_id: '6d6aa4ce-f471-4b3a-83d8-9356ab751a43',
      inicio: '2026-09-03T19:30',
      fim: '2026-09-03T18:30',
      vagas: '30',
      custo_creditos: '2',
      sala_url: '',
      status: 'publicado',
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((issue) => issue.path[0] === 'fim')).toBe(true);
    }
  });
});
