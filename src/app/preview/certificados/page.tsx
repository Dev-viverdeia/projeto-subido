import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EvolucaoProfissional } from '@/app/(app)/_components/EvolucaoProfissional';
import { GaleriaCertificados } from '@/app/(app)/certificados/_components/GaleriaCertificados';
import type { FormacaoResumo, SolucaoResumo } from '@/lib/conteudo/queries';
import type { EstadoProgressoConta } from '@/lib/progresso/local';
import styles from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Certificados' };

const FORMACOES: FormacaoResumo[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'chatgpt-para-o-trabalho',
    titulo: 'ChatGPT para o trabalho',
    resumo: 'Use IA com contexto, segurança e método no trabalho real.',
    capa_url: null,
    publicado_em: '2026-08-01T00:00:00.000Z',
    criado_em: '2026-07-01T00:00:00.000Z',
    modulos: 1,
    aulas: 2,
    aulaIds: ['aula-chatgpt-1', 'aula-chatgpt-2'],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'agentes-de-ia',
    titulo: 'Agentes de IA para operações',
    resumo: 'Planeje agentes úteis, seguros e conectados ao processo do cliente.',
    capa_url: null,
    publicado_em: '2026-08-01T00:00:00.000Z',
    criado_em: '2026-07-01T00:00:00.000Z',
    modulos: 2,
    aulas: 3,
    aulaIds: ['aula-agentes-1', 'aula-agentes-2', 'aula-agentes-3'],
  },
];

const SOLUCOES: SolucaoResumo[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'nina-sdr',
    titulo: 'Nina — SDR de Atendimento e Qualificação',
    resumo: 'Implemente uma operação de atendimento e qualificação para um cliente.',
    categoria: 'Atendimento',
    publicado_em: '2026-08-01T00:00:00.000Z',
    criado_em: '2026-07-01T00:00:00.000Z',
    etapaIds: ['nina-1', 'nina-2'],
    ferramentas: ['OpenAI'],
    projeto: null,
  },
];

const PROGRESSO: EstadoProgressoConta = {
  aulas: {
    'aula-chatgpt-1': '2026-08-28T12:00:00.000Z',
    'aula-chatgpt-2': '2026-08-29T12:00:00.000Z',
    'aula-agentes-1': '2026-08-30T12:00:00.000Z',
    'aula-agentes-2': '2026-08-31T12:00:00.000Z',
  },
  formacoes: {
    'chatgpt-para-o-trabalho': '2026-08-29T12:00:00.000Z',
    'agentes-de-ia': '2026-08-30T12:00:00.000Z',
  },
  etapas: {},
  solucoes: {},
};

export default function PreviewCertificadosPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <EvolucaoProfissional
          etapa="certificados"
          titulo="Comprove o que você concluiu."
          descricao="Cada certificado vira uma prova pública do que você aprendeu e implementou."
        />
        <GaleriaCertificados
          formacoes={FORMACOES}
          solucoes={SOLUCOES}
          progressoPreview={PROGRESSO}
        />
      </div>
    </main>
  );
}
