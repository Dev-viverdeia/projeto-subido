import 'server-only';

import { z } from 'zod';
import { encerrarGravacao } from '@/lib/calls/gravacao';
import { processarPosCall } from '@/lib/calls/processamento';
import { falharListaProspeccao } from '@/lib/prospeccao/admin';
import { processarListaProspeccao } from '@/lib/prospeccao/processar';
import { BuscaProspeccaoSchema } from '@/lib/prospeccao/schema';
import {
  concluirOperacao,
  recuperarEnriquecimentosAbandonados,
  registrarFalhaOperacao,
  reivindicarOperacoes,
} from './admin';
import type { OperacaoJob } from './tipos';

const PayloadProspeccaoSchema = z.object({
  dono: z.uuid(),
  lista: z.uuid(),
  busca: BuscaProspeccaoSchema,
});

const PayloadPosCallSchema = z.object({ reuniaoId: z.uuid() });

async function executar(job: OperacaoJob): Promise<Record<string, string | number | boolean>> {
  if (job.tipo === 'prospeccao') {
    const payload = PayloadProspeccaoSchema.parse(job.payload);
    return processarListaProspeccao(payload);
  }

  if (job.tipo === 'pos_call') {
    const { reuniaoId } = PayloadPosCallSchema.parse(job.payload);
    await encerrarGravacao(reuniaoId);
    const status = await processarPosCall(reuniaoId);

    if (status === 'falhou' || status === 'ja_processando') {
      throw new Error(
        status === 'ja_processando'
          ? 'A análise já está sendo processada; a fila tentará confirmar o resultado novamente.'
          : 'A análise pós-reunião não foi concluída.',
      );
    }
    if (status === 'nao_encontrada') {
      const erro = new Error('A reunião vinculada a esta operação não foi encontrada.');
      erro.name = 'reuniao_nao_encontrada';
      throw erro;
    }
    return { status };
  }

  throw new Error(`Tipo de operação não processável pelo worker: ${job.tipo}`);
}

async function processarJob(job: OperacaoJob) {
  try {
    const resultado = await executar(job);
    await concluirOperacao(job, resultado);
    return { id: job.id, status: 'concluida' as const };
  } catch (causa) {
    console.error(`[operacoes:${job.tipo}] tentativa ${job.tentativas} falhou:`, causa);
    const atualizado = await registrarFalhaOperacao(job, causa);

    if (atualizado.status === 'falhou' && job.tipo === 'prospeccao') {
      const payload = PayloadProspeccaoSchema.safeParse(job.payload);
      if (payload.success) {
        await falharListaProspeccao(
          payload.data.dono,
          payload.data.lista,
          atualizado.erro_mensagem ?? 'A busca não pôde ser concluída.',
        );
      }
    }

    return { id: job.id, status: atualizado.status };
  }
}

export async function processarOperacaoPorId(jobId: string) {
  const [job] = await reivindicarOperacoes({ limite: 1, jobId });
  if (!job) return { processadas: 0 };
  await processarJob(job);
  return { processadas: 1 };
}

export async function processarLoteOperacoes(limite = 4) {
  const recuperados = await recuperarEnriquecimentosAbandonados();
  const jobs = await reivindicarOperacoes({ limite });
  const resultados = await Promise.all(jobs.map(processarJob));
  return {
    reivindicadas: jobs.length,
    concluidas: resultados.filter((item) => item.status === 'concluida').length,
    reagendadas: resultados.filter((item) => item.status === 'pendente').length,
    falhas: resultados.filter((item) => item.status === 'falhou').length,
    enriquecimentosRecuperados: recuperados,
  };
}
