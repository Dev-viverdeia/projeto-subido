import { z } from 'zod';
import { FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CAMPOS_MATERIAL, ResumoMaterialSchema } from '@/lib/consultor/material';
import styles from './ResumoSalvoMaterial.module.css';
import { FocarResumoMaterial } from './FocarResumoMaterial';

/** O link abre este registro exato, mesmo depois que ele sai das atividades recentes. */
export async function ResumoSalvoMaterial({
  oportunidade,
  registro,
}: {
  oportunidade: string;
  registro: string;
}) {
  if (!z.uuid().safeParse(registro).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_eventos')
    .select('titulo,dados,criado_em')
    .eq('id', registro)
    .eq('oportunidade_id', oportunidade)
    .eq('fonte', 'sobral_material')
    .maybeSingle();
  const validacao = z.object({ resumo: ResumoMaterialSchema }).safeParse(data?.dados);
  if (error || !data || !validacao.success)
    return (
      <section id="resumo-material" className={styles.registro}>
        <p>Não foi possível abrir este resumo. Recarregue a ficha para tentar novamente.</p>
      </section>
    );
  const resumo = validacao.data.resumo;
  return (
    <section
      id="resumo-material"
      tabIndex={-1}
      className={styles.registro}
      aria-label="Resumo salvo na ficha"
    >
      <FocarResumoMaterial registro={registro} />
      <header>
        <FileCheck2 size={24} aria-hidden="true" />
        <div>
          <span>
            Material revisado ·{' '}
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeZone: 'America/Sao_Paulo',
            }).format(new Date(data.criado_em))}
          </span>
          <h2>{resumo.titulo}</h2>
        </div>
      </header>
      <div className={styles.campos}>
        {CAMPOS_MATERIAL.filter((campo) => resumo[campo.nome]).map((campo) => (
          <details key={campo.nome} open={campo.nome === 'escopo'}>
            <summary>{campo.rotulo}</summary>
            <p>{resumo[campo.nome]}</p>
          </details>
        ))}
      </div>
      <footer>Registro do material revisado por você. Não cria tarefas nem altera a venda.</footer>
    </section>
  );
}
