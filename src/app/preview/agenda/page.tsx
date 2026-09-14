import { notFound } from 'next/navigation';
import { PainelCalls } from '@/app/(app)/calls/_components/PainelCalls';
import { lerFiltrosAgenda, TAMANHO_PAGINA_AGENDA } from '@/lib/calls/agenda-filtros';
import { callPassouDaJanela, callPodeAbrir } from '@/lib/calls/tipos';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from '../mapa-jornada/preview.module.css';

const AGORA = new Date('2026-09-14T14:00:00Z');
const REUNIOES: ReuniaoCall[] = Array.from({ length: 267 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  titulo: i > 252 ? `Conversa sobre atendimento ${i - 252}` : `Revisão do projeto ${i + 1}`,
  tipo: i > 252 ? 'descoberta' : 'entrega',
  status: i > 252 ? 'agendada' : i === 252 ? 'cancelada' : 'concluida',
  agendadaPara: new Date(AGORA.getTime() + (i - 253) * 86_400_000).toISOString(),
  duracaoMinutos: 45,
  codigoPublico: `00000000-0000-4000-8000-${String(i + 1000).padStart(12, '0')}`,
  liveCoachAtivo: false,
  oportunidadeId: '11111111-1111-4111-8111-111111111111',
  oportunidade: 'Assistente de atendimento',
  empresa: i % 2 === 0 ? 'Clínica Aurora' : 'Moura Imóveis',
  contato: i % 2 === 0 ? 'Camila Rios' : 'Lucas Moura',
  convidadoEmail: 'cliente@example.test',
  googleSyncStatus: 'sincronizado',
  googleEventUrl: null,
  googleSyncErro: null,
  criadaEm: AGORA.toISOString(),
  atualizadaEm: AGORA.toISOString(),
}));
REUNIOES.push({
  ...REUNIOES[0]!,
  id: '99999999-9999-4999-8999-999999999999',
  titulo: 'Conversa que precisa de revisão',
  status: 'agendada',
});

export default async function PreviewAgenda({ searchParams }: PageProps<'/preview/agenda'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const filtros = lerFiltrosAgenda(parametros);
  const resultados = REUNIOES.filter((r) =>
    filtros.visao === 'historico'
      ? !callPodeAbrir(r.status)
      : filtros.visao === 'pendentes'
        ? callPassouDaJanela(r, AGORA)
        : callPodeAbrir(r.status) && !callPassouDaJanela(r, AGORA),
  )
    .filter((r) =>
      [r.titulo, r.empresa, r.contato, r.oportunidade, r.convidadoEmail].some((s) =>
        s?.toLowerCase().includes(filtros.busca.toLowerCase()),
      ),
    )
    .sort(
      (a, b) =>
        (a.agendadaPara.localeCompare(b.agendadaPara) || a.id.localeCompare(b.id)) *
        (filtros.visao === 'proximas' ? 1 : -1),
    )
    .filter(
      (r) =>
        !filtros.cursor ||
        (r.agendadaPara.localeCompare(filtros.cursor.data) ||
          r.id.localeCompare(filtros.cursor.id)) *
          (filtros.visao === 'proximas' ? 1 : -1) >
          0,
    );
  const reunioes = resultados.slice(0, TAMANHO_PAGINA_AGENDA);
  const ultima = reunioes.at(-1);
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>Início</span>
          <span>Vendas</span>
          <a href="#conteudo" className={styles.ativo}>
            Reuniões
          </a>
        </nav>
      </aside>
      <main id="conteudo" className={styles.conteudo}>
        <PainelCalls
          reunioes={reunioes}
          agora={AGORA}
          oportunidades={[]}
          comercialLiberado={false}
          calendar={{
            configurado: true,
            conectado: true,
            email: 'profissional@example.test',
            status: 'ativa',
            ultimoErro: null,
          }}
          navegacao={{
            filtros,
            base: '/preview/agenda',
            proximoCursor:
              resultados.length > TAMANHO_PAGINA_AGENDA && ultima
                ? { data: ultima.agendadaPara, id: ultima.id }
                : undefined,
          }}
        />
      </main>
    </div>
  );
}
