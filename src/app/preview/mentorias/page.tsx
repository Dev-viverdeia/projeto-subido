import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MentoriasVista } from '@/app/(app)/mentorias/_components/MentoriasVista';
import pagina from '@/app/(app)/mentorias/pagina.module.css';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import styles from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Mentorias' };

const AGORA = '2026-09-01T18:00:00.000Z';

const SESSOES: SessaoMentoria[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Como transformar o diagnóstico em uma proposta de IA',
    descricao: 'Leve um caso comercial e saia com o escopo do próximo passo.',
    inicioIso: '2026-09-02T18:00:00.000Z',
    fimIso: '2026-09-02T19:30:00.000Z',
    vagas: 24,
    custoCreditos: 1,
    salaUrl: null,
    inscritos: 16,
    euInscrito: false,
    creditosUsados: null,
    mentor: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      nome: 'Felipe Sobral',
      headline: 'Projetos e operação de IA',
      foto_url: null,
      trilha: 'implementacao',
    },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Descoberta comercial para projetos de atendimento',
    descricao: 'Perguntas e sinais para transformar uma call em oportunidade real.',
    inicioIso: '2026-09-03T17:00:00.000Z',
    fimIso: '2026-09-03T18:00:00.000Z',
    vagas: 20,
    custoCreditos: 1,
    salaUrl: null,
    inscritos: 12,
    euInscrito: true,
    creditosUsados: 1,
    mentor: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      nome: 'Guilherme Barbosa',
      headline: 'Vendas consultivas e posicionamento',
      foto_url: null,
      trilha: 'comercial',
    },
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Validação técnica antes da entrega',
    descricao: 'Como validar qualidade, segurança e resultado com o cliente.',
    inicioIso: '2026-09-08T18:00:00.000Z',
    fimIso: '2026-09-08T19:00:00.000Z',
    vagas: 24,
    custoCreditos: 2,
    salaUrl: null,
    inscritos: 8,
    euInscrito: false,
    creditosUsados: null,
    mentor: {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      nome: 'Rafael Milagre',
      headline: 'Estratégia e implementação de IA',
      foto_url: null,
      trilha: 'produto',
    },
  },
];

export default function PreviewMentoriasPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <header className={pagina.cabecalho}>
          <div className={pagina.intro}>
            <p className={pagina.sobretitulo}>Mentorias</p>
            <h1>Leve um caso. Saia com direção.</h1>
            <p className={pagina.descricao}>
              Escolha uma sessão para destravar uma venda, um projeto ou uma entrega.
            </p>
          </div>
          <div className={pagina.regra}>
            <p>Créditos sem surpresa</p>
            <strong>O custo aparece antes do check-in.</strong>
            <span>Cancelou antes do início? O valor volta para o seu saldo.</span>
          </div>
        </header>
        <MentoriasVista
          sessoes={SESSOES}
          agoraIso={AGORA}
          vistaInicial="agenda"
          saldoInicial={18}
        />
      </div>
    </main>
  );
}
