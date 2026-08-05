import type { Metadata } from 'next';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { GaleriaCertificados } from './_components/GaleriaCertificados';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Certificados' };

/**
 * CERTIFICADOS — o registro do que foi concluído em Formações e Soluções.
 *
 * O QUE É REAL: a conclusão. Ela deriva do progresso local (aulas e etapas
 * marcadas neste navegador), com as datas verdadeiras de cada marcação — a
 * mesma fonte que alimenta as barras dos catálogos. O QUE É PENDÊNCIA
 * DECLARADA: a EMISSÃO (PDF, código de verificação), que depende do backend de
 * certificados — o botão fica apagado com o motivo escrito, nunca um download
 * que finge.
 *
 * O servidor entrega os catálogos; quem sabe o que foi concluído é o CLIENTE
 * (localStorage via useSyncExternalStore, snapshot vazio no SSR — o padrão da
 * casa). Por isso a galeria é client e esta página é só dado e moldura.
 */
export default async function CertificadosPage() {
  const [formacoes, solucoes] = await Promise.all([listarFormacoes(), listarSolucoes()]);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Certificados" oculto />

      <header className={`${entrada.bloco} ${styles.cabeca}`}>
        <p className={styles.eyebrow}>Reconhecimento</p>
        <h1 className={styles.titulo}>Certificados.</h1>
        <p className={styles.apoio}>
          Cada formação ou solução concluída vira um certificado aqui. A emissão em PDF chega com o
          backend de certificados — a conclusão já fica registrada.
        </p>
      </header>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />
      </div>
    </div>
  );
}
