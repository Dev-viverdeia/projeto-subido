import type { Metadata } from 'next';
import { obterSaldoCreditos } from '@/lib/creditos/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
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
 * Cabeçalho e agenda usam blocos de entrada independentes para preservar a
 * hierarquia visual sem atrasar a informação principal.
 */
export default async function MentoriasPage({ searchParams }: PageProps<'/mentorias'>) {
  const agora = new Date();
  const [vista, sessoes, saldo] = await Promise.all([
    searchParams.then(lerVistaInicial),
    listarAgenda(),
    obterSaldoCreditos(),
  ]);

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <header className={styles.cabecalho}>
          <div className={styles.intro}>
            <p className={styles.sobretitulo}>Mentorias</p>
            <h1>Leve um caso. Saia com direção.</h1>
            <p className={styles.descricao}>
              Escolha uma sessão para destravar uma venda, um projeto ou uma entrega.
            </p>
          </div>

          <div className={styles.regra}>
            <p>Créditos sem surpresa</p>
            <strong>O custo aparece antes do check-in.</strong>
            <span>Cancelou antes do início? O valor volta para o seu saldo.</span>
          </div>
        </header>
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <MentoriasVista
          sessoes={sessoes}
          agoraIso={agora.toISOString()}
          vistaInicial={vista}
          saldoInicial={saldo}
        />
      </div>
    </div>
  );
}
