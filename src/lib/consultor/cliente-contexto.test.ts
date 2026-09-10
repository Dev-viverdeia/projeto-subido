import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';
import { completarSinaisComCliente } from './cliente-contexto';
import { sinaisDeQualidade } from './qualidade-cenarios';
import { ClienteSobralSchema } from './cliente';
vi.mock('server-only', () => ({}));
const ID = '11111111-1111-4111-8111-111111111111';
const DONO = '22222222-2222-4222-8222-222222222222';
const DATA = '2026-09-10T12:00:00Z';
const empresa = {
  id: 'empresa',
  nome: 'Clínica Aurora',
  setor: 'Saúde',
  resumo: 'Atendimento ambulatorial.',
  atualizado_em: DATA,
};
const oportunidade = {
  id: ID,
  titulo: 'Agenda com IA',
  etapa: 'descoberta',
  situacao: 'ativa',
  contato_principal_id: null,
  atualizado_em: DATA,
  proxima_acao: null,
  proxima_acao_em: null,
};
function clienteFalso(tabelas: Record<string, unknown[]>, erros: string[] = []) {
  const consultas: { tabela: string; filtros: unknown[][]; campos?: string; limite?: number }[] =
    [];
  const from = (tabela: string) => {
    const consulta: (typeof consultas)[number] = { tabela, filtros: [] };
    consultas.push(consulta);
    const resultado = {
      data: tabelas[tabela] ?? [],
      error: erros.includes(tabela) ? { code: 'TESTE' } : null,
    };
    const query = {
      select: (campos: string) => {
        consulta.campos = campos;
        return query;
      },
      eq: (...args: unknown[]) => {
        consulta.filtros.push(args);
        return query;
      },
      in: (...args: unknown[]) => {
        consulta.filtros.push(args);
        return query;
      },
      neq: (...args: unknown[]) => {
        consulta.filtros.push(['neq', ...args]);
        return query;
      },
      order: () => query,
      limit: (numero: number) => {
        consulta.limite = numero;
        return query;
      },
      maybeSingle: () => Promise.resolve({ ...resultado, data: resultado.data[0] ?? null }),
      then: (resolve: (r: typeof resultado) => unknown) => Promise.resolve(resultado).then(resolve),
    };
    return query;
  };
  return { client: { from } as unknown as SupabaseClient<Database>, consultas };
}
function dados(extra: Record<string, unknown[]> = {}): Record<string, unknown[]> {
  return { crm_empresas: [empresa], crm_oportunidades: [oportunidade], ...extra };
}
async function consultar(
  tabelas = dados(),
  pedido = 'Quero preparar a proposta da Clínica Aurora.',
  erros: string[] = [],
) {
  const banco = clienteFalso(tabelas, erros);
  const sinais = await completarSinaisComCliente(
    banco.client,
    DONO,
    sinaisDeQualidade(),
    pedido,
    [],
  );
  return { ...banco, sinais, cliente: sinais.cliente! };
}
describe('leitura limitada da ficha do cliente no Sobral', () => {
  it('aceita o título como resposta à escolha, sem exigir o nome do cliente de novo', async () => {
    const banco = clienteFalso(
      dados({
        crm_oportunidades: [oportunidade, { ...oportunidade, titulo: 'Relatórios de vendas' }],
      }),
    );
    const historico = [
      { papel: 'usuario', conteudo: 'Quero uma proposta para a Clínica Aurora.' },
      { papel: 'consultor', conteudo: 'Agenda com IA ou Relatórios de vendas?' },
    ];
    const r = await completarSinaisComCliente(
      banco.client,
      DONO,
      sinaisDeQualidade(),
      'A oportunidade Agenda com IA',
      historico,
    );
    expect(r.cliente?.ficha?.oportunidadeId).toBe(ID);
    const estudo = await completarSinaisComCliente(
      banco.client,
      DONO,
      sinaisDeQualidade(),
      'Quero estudar Agenda com IA',
      historico,
    );
    expect(estudo.cliente?.ficha).toBeNull();
  });
  it('separa hipóteses e fatos do enriquecimento, sem repassar dados pessoais extras', async () => {
    const r = await consultar(
      dados({
        crm_enriquecimentos: [
          {
            concluido_em: DATA,
            resultado: {
              resumo: 'Retrato da empresa.',
              empresa: {
                setor: 'Saúde',
                porte: null,
                cidade: null,
                estado: null,
                modeloNegocio: null,
              },
              fatos: [{ titulo: 'Canal', valor: 'Agenda pelo WhatsApp', origem: 'site' }],
              hipoteses: [
                {
                  titulo: 'Demora',
                  explicacao: 'Pode haver atraso.',
                  confianca: 'baixa',
                  comoValidar: 'Medir o tempo.',
                },
              ],
              oportunidades: [],
              perguntasDescoberta: [],
              proximaAcao: { acao: 'Validar o processo', porque: 'Não há medição.' },
              alertas: ['Site lido há um mês.'],
              inteligenciaContato: {
                canais: [],
                pessoas: [
                  {
                    nome: 'Pessoa possível',
                    cargo: null,
                    email: 'nao-repassar@example.invalid',
                    telefone: null,
                    linkedinUrl: null,
                    status: 'possivel',
                    evidencia: 'Referência pública.',
                  },
                ],
              },
            },
          },
        ],
      }),
    );
    expect(
      r.cliente.fatos.find((f) => f.fonte === 'Pesquisa' && f.natureza === 'hipotese')?.texto,
    ).toContain('Medir o tempo');
    expect(
      r.cliente.fatos.find((f) => f.fonte === 'Pesquisa' && f.natureza === 'registro')?.texto,
    ).toContain('WhatsApp');
    expect(JSON.stringify(r.cliente)).not.toContain('nao-repassar');
    expect(r.cliente.ficha?.incompleta).toBe(false);
  });
  it('consulta análises somente das reuniões vinculadas e mantém compromissos', async () => {
    const r = await consultar(
      dados({
        calls_reunioes: [
          { id: 'call-1', titulo: 'Descoberta', status: 'concluida', agendada_para: DATA },
        ],
        calls_analises: [
          {
            resumo: 'Demora confirmada.',
            objecoes: ['Precisa de supervisão.'],
            compromissos: ['Enviar escopo à diretora.'],
            proximos_passos: ['Revisar a proposta.'],
            atualizada_em: DATA,
          },
        ],
      }),
    );
    expect(r.consultas.find((c) => c.tabela === 'calls_analises')?.filtros).toContainEqual([
      'reuniao_id',
      ['call-1'],
    ]);
    expect(r.cliente.fatos.some((f) => f.texto.includes('diretora'))).toBe(true);
  });
  it('não consulta fichas em perguntas genéricas e remove foco automático', async () => {
    const r = await consultar(dados(), 'Quero estudar IA');
    expect(r.sinais.foco).toBeNull();
    expect(r.cliente.estado).toBe('sem_cliente');
    expect(r.consultas.map((c) => c.tabela)).toEqual(['crm_empresas']);
  });
  it('inclui fontes datadas e restringe todas as consultas ao dono e à oportunidade', async () => {
    const r = await consultar(
      dados({
        crm_eventos: [
          {
            titulo: 'WhatsApp recebido',
            descricao: 'Gerente confirmou 120 agendamentos por dia.',
            ocorrido_em: DATA,
          },
        ],
      }),
    );
    expect(r.sinais.foco?.oportunidadeId).toBe(ID);
    expect(r.cliente.fatos).toContainEqual(
      expect.objectContaining({
        fonte: 'Histórico',
        data: DATA,
        natureza: 'registro',
      }),
    );
    expect(r.cliente.fatos.find((f) => f.fonte === 'Histórico')?.texto).toContain(
      '120 agendamentos',
    );
    expect(ClienteSobralSchema.safeParse(r.cliente).success).toBe(true);
    for (const c of r.consultas) expect(c.filtros).toContainEqual(['dono', DONO]);
    for (const c of r.consultas.filter((c) =>
      [
        'crm_eventos',
        'crm_enriquecimentos',
        'calls_reunioes',
        'propostas',
        'projetos_execucao',
        'projeto_acoes',
      ].includes(c.tabela),
    )) {
      expect(c.filtros).toContainEqual(['oportunidade_id', ID]);
      expect(c.limite).toBeLessThanOrEqual(6);
    }
    expect(r.consultas.some((c) => /email|telefone|portal_codigo|\*/.test(c.campos ?? ''))).toBe(
      false,
    );
  });
  it('pergunta qual oportunidade sem preferir a mais recente', async () => {
    const r = await consultar(
      dados({
        crm_oportunidades: [
          oportunidade,
          { ...oportunidade, id: 'outro', titulo: 'Relatórios com IA' },
        ],
      }),
    );
    expect(r.cliente.estado).toBe('ambiguo');
    expect(r.cliente.opcoes).toHaveLength(2);
    expect(r.cliente.ficha).toBeNull();
    expect(r.consultas).toHaveLength(2);
  });
  it('distingue oportunidades pelo título junto ao nome da empresa', async () => {
    const r = await consultar(
      dados({
        crm_oportunidades: [
          oportunidade,
          { ...oportunidade, id: 'outro', titulo: 'Relatórios com IA' },
        ],
      }),
      'Clínica Aurora, oportunidade Agenda com IA',
    );
    expect(r.cliente.ficha?.oportunidadeId).toBe(ID);
  });
  it('não lê outra empresa por coincidência de título', async () => {
    expect((await consultar(dados(), 'Agenda com IA para a Escola Ipê')).cliente.ficha).toBeNull();
  });
  it('não confunde erro com ausência de informação', async () => {
    expect((await consultar(dados(), undefined, ['crm_empresas'])).cliente.estado).toBe(
      'indisponivel',
    );
    const r = await consultar(dados(), undefined, ['crm_eventos']);
    expect(r.cliente.ficha?.incompleta).toBe(true);
    expect(r.cliente.estado).toBe('consultado');
  });
  it('consulta ganho sem oferecer alteração comercial automática', async () => {
    const r = await consultar(dados({ crm_oportunidades: [{ ...oportunidade, etapa: 'ganho' }] }));
    expect(r.sinais.foco).toBeNull();
    expect(r.cliente.ficha?.oportunidadeId).toBe(ID);
  });
  it('mantém entrega e tarefa no orçamento mesmo com histórico cheio', async () => {
    const r = await consultar(
      dados({
        crm_eventos: Array.from({ length: 32 }, (_, i) => ({
          titulo: `Evento ${i}`,
          descricao: 'a'.repeat(1000),
          ocorrido_em: DATA,
        })),
        projetos_execucao: [
          {
            titulo: 'Entrega combinada',
            tipo_servico: 'recorrente',
            status: 'em_andamento',
            atualizado_em: DATA,
          },
        ],
        projeto_acoes: [{ titulo: 'Revisão mensal', status: 'pendente', atualizado_em: DATA }],
      }),
    );
    expect(r.cliente.fatos).toHaveLength(32);
    expect(r.cliente.fatos.some((f) => f.fonte === 'Entrega')).toBe(true);
    expect(r.cliente.fatos.some((f) => f.fonte === 'Tarefa')).toBe(true);
    expect(ClienteSobralSchema.safeParse(r.cliente).success).toBe(true);
  });
});
