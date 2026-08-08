'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PerfilJornadaSchema, type EstadoPerfilJornada } from './schema';

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor : '';
}

export async function salvarPerfilJornada(
  _anterior: EstadoPerfilJornada,
  formData: FormData,
): Promise<EstadoPerfilJornada> {
  const leitura = PerfilJornadaSchema.safeParse({
    nicho: texto(formData.get('nicho')),
    projetoInicialId: texto(formData.get('projetoInicialId')),
    posicionamento: texto(formData.get('posicionamento')),
  });

  if (!leitura.success) {
    const porCampo: EstadoPerfilJornada['porCampo'] = {};
    for (const issue of leitura.error.issues) {
      const campo = issue.path[0];
      if (typeof campo === 'string' && !porCampo[campo as keyof typeof porCampo]) {
        porCampo[campo as keyof typeof porCampo] = issue.message;
      }
    }
    return { porCampo };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para salvar.' };

  const [projeto, existente] = await Promise.all([
    supabase
      .from('solucoes')
      .select('id')
      .eq('id', leitura.data.projetoInicialId)
      .eq('status', 'publicado')
      .maybeSingle(),
    supabase.from('jornada_perfis').select('dono').maybeSingle(),
  ]);

  if (projeto.error || existente.error) {
    console.error(
      `[jornada:preparar] ${projeto.error?.code ?? existente.error?.code ?? 'sem-codigo'}`,
    );
    return { erro: 'Não foi possível preparar sua jornada agora. Tente novamente.' };
  }
  if (!projeto.data) return { porCampo: { projetoInicialId: 'Escolha um projeto disponível.' } };

  const valores = {
    nicho: leitura.data.nicho,
    projeto_inicial_id: leitura.data.projetoInicialId,
    posicionamento: leitura.data.posicionamento,
  };
  const gravacao = existente.data
    ? await supabase.from('jornada_perfis').update(valores).eq('dono', user.id)
    : await supabase.from('jornada_perfis').insert({ dono: user.id, ...valores });

  if (gravacao.error) {
    console.error(`[jornada:salvar] ${gravacao.error.code}: ${gravacao.error.message}`);
    return { erro: 'Não foi possível salvar sua direção. Tente novamente em instantes.' };
  }

  revalidatePath('/inicio');
  return { sucesso: 'Ponto de partida salvo. O mapa já foi recalculado.' };
}
