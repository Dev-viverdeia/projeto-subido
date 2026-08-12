import Link from 'next/link';
import { ArrowRight, BadgeCheck, ClipboardCheck, GitBranch, ListChecks } from 'lucide-react';
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
        <p className={styles.sobretitulo}>Antes de atualizar o CRM</p>
        <h2 id="plano-da-call-titulo">Revise o que muda a partir desta call</h2>
        <p>O histórico já foi preservado. Agora você confirma somente as mudanças operacionais.</p>

        <ol className={styles.fluxoSincronizacao}>
          <li data-concluido={posCall.sincronizacao.historicoCrm || undefined}>
            <span>
              <BadgeCheck size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Histórico da conversa</strong>
              <small>
                {posCall.sincronizacao.historicoCrm
                  ? 'Já registrado no CRM'
                  : 'Registro em processamento'}
              </small>
            </div>
          </li>
          <li>
            <span>
              <GitBranch size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Etapa do pipeline</strong>
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
              <strong>
                {planoAplicado ? 'Compromissos sincronizados' : 'Compromissos da call'}
              </strong>
              <small>
                {planoAplicado
                  ? 'Ações já criadas para acompanhamento'
                  : `${compromissos.length} para revisar antes de criar ações`}
              </small>
            </div>
          </li>
        </ol>

        <p className={styles.garantiaRevisao}>Nada muda no pipeline sem sua confirmação.</p>
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

      {posCall.reuniao.tipo === 'kickoff' &&
        posCall.analise?.briefingOperacional &&
        posCall.sincronizacao.projetoAtivo && (
          <Link
            className={styles.briefingPreparado}
            href={`/solucoes/execucao/${posCall.sincronizacao.projetoAtivo.id}#briefing-kickoff`}
          >
            <span>
              <ClipboardCheck size={17} aria-hidden="true" />
            </span>
            <div>
              <strong>Briefing do kickoff preparado</strong>
              <small>
                Objetivo, responsáveis, acessos e limites estão prontos para sua revisão.
              </small>
            </div>
            <span className={styles.briefingPreparadoAcao}>
              Revisar no projeto <ArrowRight size={15} aria-hidden="true" />
            </span>
          </Link>
        )}
    </section>
  );
}
