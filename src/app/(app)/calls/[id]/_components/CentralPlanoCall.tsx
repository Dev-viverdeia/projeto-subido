import { BadgeCheck, CalendarClock, GitBranch, ListChecks, Sparkles } from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import { etapaVisivel, ROTULO_ETAPA, type EtapaCrm } from '@/lib/crm/etapas';
import { FormularioPlanoCall } from './FormularioPlanoCall';
import styles from '../pagina.module.css';

function dataInput(iso: string | null): string {
  if (!iso) return '';
  const formatador = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
  const data = formatador.format(new Date(iso));
  return data >= formatador.format(new Date()) ? data : '';
}

function sugerirEtapa(posCall: PosCall): EtapaCrm {
  const atual = etapaVisivel(posCall.oportunidade.etapa);
  if (atual === 'ganho' || atual === 'perdido') return atual;
  if (posCall.reuniao.tipo === 'kickoff' || posCall.reuniao.tipo === 'entrega') return 'ganho';
  if (
    posCall.reuniao.tipo === 'descoberta' &&
    (posCall.analise?.sinaisCompra.length ?? 0) > 0 &&
    (posCall.analise?.oportunidadesProjeto.length ?? 0) > 0
  ) {
    return 'proposta';
  }
  return atual;
}

export function CentralPlanoCall({
  posCall,
  acaoSugerida,
}: {
  posCall: PosCall;
  acaoSugerida: string;
}) {
  const etapaAtual = etapaVisivel(posCall.oportunidade.etapa);
  const etapaRecomendada = sugerirEtapa(posCall);
  const compromissos = posCall.analise?.compromissos ?? [];
  const planoAplicado = posCall.sincronizacao.acoesPlano.some((acao) => acao.status === 'pendente');

  return (
    <section
      id="plano-da-call"
      className={styles.centralAcao}
      aria-labelledby="plano-da-call-titulo"
    >
      <div className={styles.centralAcaoContexto}>
        <div className={styles.acaoMarca}>
          <CalendarClock size={19} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <p className={styles.sobretitulo}>Continuidade automática</p>
        <h2 id="plano-da-call-titulo">Transforme a conversa em execução</h2>
        <p>A IA já organizou os fatos. Você só valida o que muda o CRM e o trabalho do projeto.</p>

        <ol className={styles.fluxoSincronizacao}>
          <li data-concluido={posCall.sincronizacao.historicoCrm || undefined}>
            <span>
              <BadgeCheck size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Resumo no histórico</strong>
              <small>
                {posCall.sincronizacao.historicoCrm
                  ? 'Fatos registrados no CRM'
                  : 'Registro em processamento'}
              </small>
            </div>
          </li>
          <li>
            <span>
              <GitBranch size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Pipeline preparado</strong>
              <small>
                {etapaRecomendada === etapaAtual
                  ? `Manter em ${ROTULO_ETAPA[etapaAtual]}`
                  : `${ROTULO_ETAPA[etapaAtual]} → ${ROTULO_ETAPA[etapaRecomendada]}`}
              </small>
            </div>
          </li>
          <li data-concluido={planoAplicado || undefined}>
            <span>
              <ListChecks size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>{planoAplicado ? 'Plano sincronizado' : 'Compromissos prontos'}</strong>
              <small>
                {posCall.sincronizacao.projetoAtivo
                  ? posCall.sincronizacao.projetoAtivo.titulo
                  : 'Acompanham o lead até a entrega'}
              </small>
            </div>
          </li>
        </ol>

        <span className={styles.acaoDestino}>
          <Sparkles size={13} aria-hidden="true" /> Uma revisão · três destinos
        </span>
      </div>

      <FormularioPlanoCall
        reuniaoId={posCall.reuniao.id}
        oportunidadeId={posCall.oportunidade.id}
        acaoInicial={acaoSugerida}
        dataInicial={dataInput(posCall.oportunidade.proximaAcaoEm)}
        etapaAtual={etapaAtual}
        etapaSugerida={etapaRecomendada}
        compromissos={compromissos}
      />
    </section>
  );
}
