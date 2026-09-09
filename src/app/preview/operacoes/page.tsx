import { notFound } from 'next/navigation';
import { SaudeAtendimento } from '@/components/operacoes/SaudeAtendimento';
import { atendimentoExemplo } from '@/components/operacoes/fixture';
import s from '../../(app)/admin/operacoes/page.module.css';
export default async function PreviewOperacoes({ searchParams }: PageProps<'/preview/operacoes'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { estado } = await searchParams;
  const resumo = atendimentoExemplo();
  if (estado === 'falha') {
    resumo.ia.expiradas = 2;
    resumo.entrada.atrasadas = 1;
    resumo.saida.sem_confirmacao = 1;
    resumo.pulsos[1]!.falhou = true;
    resumo.pulsos[1]!.falhas_seguidas = 3;
  }
  if (estado === 'sem-pulso') resumo.pulsos = [];
  return (
    <main className={s.pagina}>
      <header className={s.hero}>
        <div>
          <p>Demonstração · dados simulados</p>
          <h1>Saúde do sistema</h1>
          <span>IA, suporte e processamento.</span>
        </div>
      </header>
      <SaudeAtendimento resumo={estado === 'indisponivel' ? null : resumo} />
    </main>
  );
}
