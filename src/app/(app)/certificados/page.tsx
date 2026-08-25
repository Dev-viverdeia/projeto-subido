import type { Metadata } from 'next';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { EvolucaoProfissional } from '../_components/EvolucaoProfissional';
import entrada from '../_components/entrada.module.css';
import { GaleriaCertificados } from './_components/GaleriaCertificados';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Certificados' };

/**
 * CERTIFICADOS — o registro do que foi concluído em Formações e Projetos.
 *
 * O QUE É REAL: a conclusão. Ela deriva do progresso salvo na conta, com as
 * datas verdadeiras de cada marcação — a mesma fonte que alimenta as barras dos
 * catálogos. A emissão só é liberada depois de uma nova validação no servidor e
 * gera um código público de autenticidade.
 *
 * O servidor entrega os catálogos e o estado no layout autenticado. A galeria é
 * client porque reage às marcações otimistas sem esperar uma nova navegação.
 */
export default async function CertificadosPage() {
  const [formacoes, solucoes] = await Promise.all([listarFormacoes(), listarSolucoes()]);

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <EvolucaoProfissional
          etapa="certificados"
          titulo="Seus certificados."
          descricao="Formações certificam o aprendizado. Projetos certificam as aulas e a implementação concluídas."
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />
      </div>
    </div>
  );
}
