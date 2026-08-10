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
 * datas verdadeiras de cada marcação — a
 * mesma fonte que alimenta as barras dos catálogos. O QUE É PENDÊNCIA
 * DECLARADA: a EMISSÃO (PDF, código de verificação), que depende do backend de
 * certificados — o botão fica apagado com o motivo escrito, nunca um download
 * que finge.
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
          titulo="Transforme conclusão em prova."
          descricao="Cada formação ou projeto concluído vira um registro com seu nome, o conteúdo e a data da conquista — pronto para imprimir ou salvar em PDF."
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />
      </div>
    </div>
  );
}
