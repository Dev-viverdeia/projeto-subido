import type { Metadata } from 'next';
import { listarAgenda } from '@/lib/mentorias/queries';
import { EvolucaoProfissional } from '../_components/EvolucaoProfissional';
import entrada from '../_components/entrada.module.css';
import { lerVistaInicial } from '../_components/filtros/urlFiltros';
import { MentoriasVista } from './_components/MentoriasVista';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Mentorias' };

/**
 * Agenda de mentorias — do BANCO.
 *
 * O BLOQUEIO QUE ESTA PÁGINA CARREGAVA CAIU. Até aqui a agenda vinha de
 * `gerarAgendaExemplo(new Date())`, que posicionava sessões em volta do instante
 * da visita: horário, vagas e lotação inventados a cada request. O comentário
 * que morava aqui dizia, com todas as letras, que a tela não podia ir ao ar para
 * assinante nesse estado. Agora ela lê `mentorias`/`mentores`/`mentoria_inscricoes`
 * e o que aparece é o que existe.
 *
 * A rota é dinâmica, então `new Date()` é o instante real de cada visita — é ele
 * que decide o que está ao vivo, o que já encerrou e onde a janela de check-in
 * abriu. Nada disso é flag gravada.
 *
 * NASCE VAZIA, e isso é o certo: não há mentoria cadastrada ainda. O estado
 * vazio é a tela honesta até a primeira sessão entrar pelo admin.
 *
 * O cabeçalho fica FORA do `entrada.bloco`: oculto ele não tem o que animar, e um
 * wrapper de altura zero continua sendo item flex e comeria o `gap` da página.
 */
export default async function MentoriasPage({ searchParams }: PageProps<'/mentorias'>) {
  const agora = new Date();
  const [vista, sessoes] = await Promise.all([searchParams.then(lerVistaInicial), listarAgenda()]);

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <EvolucaoProfissional
          etapa="mentorias"
          titulo="Tire dúvidas sobre um caso real."
          descricao="Escolha uma sessão, faça o check-in e leve uma dúvida específica do projeto que está vendendo ou implementando."
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <MentoriasVista sessoes={sessoes} agoraIso={agora.toISOString()} vistaInicial={vista} />
      </div>
    </div>
  );
}
