'use client';

import { useRef, useState } from 'react';
import type { ConflitoHorario } from '@/lib/calls/conflitos-modelo';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
import { FormularioAgendarCall } from '@/app/(app)/calls/_components/FormularioAgendarCall';
import { GerenciarAgenda } from '@/app/(app)/calls/_components/GerenciarAgenda';
import styles from '../mapa-jornada/preview.module.css';

const reuniao: ReuniaoCall = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Descoberta com Clínica Aurora',
  empresa: 'Clínica Aurora',
  contato: 'Camila',
  tipo: 'descoberta',
  status: 'agendada',
  agendadaPara: '2099-10-10T15:00:00.000Z',
  duracaoMinutos: 45,
  codigoPublico: '22222222-2222-4222-8222-222222222222',
  liveCoachAtivo: true,
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  oportunidade: 'Atendimento com IA',
  convidadoEmail: 'camila@example.test',
  googleSyncStatus: 'sincronizado',
  googleEventUrl: null,
  googleSyncErro: null,
  criadaEm: '2026-09-14T15:00:00Z',
  atualizadaEm: '2026-09-14T15:00:00Z',
};

/** Somente transporte local de teste. A página é 404 no build de produção. */
export function ConflitosPreview({
  reagendar,
  varios,
  alternativas,
}: {
  reagendar: boolean;
  varios: boolean;
  alternativas?: string;
}) {
  const opcoes = useRef<string[]>([]);
  const [consultas, setConsultas] = useState(0);
  async function conferir(form: FormData): Promise<ConflitoHorario | undefined> {
    setConsultas((valor) => valor + 1);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const data = form.get('agendadaPara');
    if (typeof data !== 'string') throw new Error('Horário ausente no teste');
    const inicio = new Date(data).toISOString();
    const duracao = Number(form.get('duracao'));
    const confirmacao = `${inicio}:${duracao}`;
    if (form.get('confirmacaoHorario') === confirmacao) return;
    if (alternativas === 'sim' && opcoes.current.includes(inicio)) return;
    opcoes.current = Array.from({ length: 3 }, (_, i) => {
      const horario = new Date(data);
      horario.setDate(horario.getDate() + 2);
      horario.setHours(9, i * 30, 0, 0);
      return horario.toISOString();
    });
    return {
      inicio,
      duracao,
      confirmacao,
      total: varios ? 9 : 1,
      alternativas:
        alternativas === 'vazio'
          ? []
          : alternativas === 'sim' || alternativas === 'ocupou'
            ? opcoes.current
            : undefined,
      reunioes: Array.from({ length: varios ? 5 : 1 }, (_, i) => ({
        id: String(i),
        titulo:
          i === 0
            ? 'Kickoff do atendimento · Moura Imóveis'
            : `Revisão do projeto de atendimento e automação ${i}`,
        inicio,
        duracao: 60,
      })),
    };
  }
  return (
    <main className={styles.conteudo}>
      <h1>Reuniões</h1>
      <output aria-label="Consultas simuladas">{consultas}</output>
      {reagendar ? (
        <GerenciarAgenda
          reuniao={reuniao}
          abertoInicial
          alterarAction={async (_anterior, form) => {
            const conflito = await conferir(form);
            return conflito ? { status: 'erro', conflito } : { status: 'concluido' };
          }}
        />
      ) : (
        <FormularioAgendarCall
          oportunidades={[
            {
              id: reuniao.oportunidadeId,
              titulo: 'Atendimento com IA',
              etapa: 'descoberta',
              empresa: 'Clínica Aurora',
              dominio: null,
              contato: 'Camila',
              contatoEmail: 'camila@example.test',
            },
          ]}
          oportunidadeInicial={reuniao.oportunidadeId}
          abertoInicial
          calendar={{
            configurado: true,
            conectado: true,
            email: 'profissional@example.test',
            status: 'ativa',
            ultimoErro: null,
          }}
          rascunho={{
            agendadaPara: '2099-10-10T12:00',
            duracao: '45',
            convidadoEmail: 'camila@example.test',
          }}
          agendarAction={async (_anterior, form) => {
            const conflito = await conferir(form);
            return conflito
              ? { conflito }
              : { erro: 'Simulação concluída. Nenhum convite foi enviado.' };
          }}
        />
      )}
    </main>
  );
}
