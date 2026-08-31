import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  FileSignature,
  GitBranch,
  ListChecks,
  Target,
} from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import { montarSaidaPosCall } from '@/lib/calls/saida-pos-call';
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
  resumo,
  nota,
  sentimento,
}: {
  posCall: PosCall;
  acaoSugerida: string;
  resumo: string | null;
  nota: number | null;
  sentimento: string;
}) {
  const etapaAtual = etapaVisivel(posCall.oportunidade.etapa);
  const etapaRecomendada = sugerirEtapa(posCall);
  const compromissos = posCall.analise?.compromissos ?? [];
  const planoAplicado = posCall.sincronizacao.acoesPlano.some((acao) => acao.status === 'pendente');
  const saida = montarSaidaPosCall(posCall);
  const IconeSaida =
    saida.tipo === 'proposta'
      ? FileSignature
      : saida.tipo === 'projeto'
        ? BriefcaseBusiness
        : Target;

  return (
    <section
      id="plano-da-call"
      className={styles.centralAcao}
      aria-labelledby="plano-da-call-titulo"
    >
      <div className={styles.centralAcaoContexto}>
        <div className={styles.contextoTopoCall}>
          <div>
            <p className={styles.sobretitulo}>Resumo e próximos passos</p>
            <h2 id="plano-da-call-titulo">O que ficou decidido</h2>
          </div>
          {nota !== null && (
            <div className={styles.notaCentral} aria-label={`Leitura comercial ${nota} de 100`}>
              <strong>{nota}</strong>
              <span>/100</span>
            </div>
          )}
        </div>
        {resumo && <p className={styles.resumoCentral}>{resumo}</p>}
        <small className={styles.sentimentoCentral}>Tom percebido: {sentimento}</small>

        <ol className={styles.fluxoSincronizacao}>
          <li data-concluido={posCall.sincronizacao.historicoCrm || undefined}>
            <span>
              <BadgeCheck size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Resumo na ficha</strong>
              <small>
                {posCall.sincronizacao.historicoCrm
                  ? 'Já registrado na ficha'
                  : 'Registro em processamento'}
              </small>
            </div>
          </li>
          <li>
            <span>
              <GitBranch size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Etapa da venda</strong>
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
              <strong>{planoAplicado ? 'Compromissos salvos' : 'Compromissos da reunião'}</strong>
              <small>
                {planoAplicado
                  ? 'Ações já criadas na ficha'
                  : `${compromissos.length} para revisar antes de salvar`}
              </small>
            </div>
          </li>
        </ol>

        <p className={styles.garantiaRevisao}>Você revisa antes de salvar na ficha.</p>
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

      <Link
        id="proximo-passo-pos-call"
        className={styles.proximaSaidaCall}
        href={saida.href}
        data-tipo={saida.tipo}
      >
        <span className={styles.proximaSaidaIcone}>
          <IconeSaida size={18} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className={styles.proximaSaidaTexto}>
          <small>{saida.rotulo}</small>
          <strong>{saida.titulo}</strong>
          <span>{saida.descricao}</span>
        </span>
        <span className={styles.proximaSaidaAcao}>
          {saida.acao} <ArrowRight size={15} aria-hidden="true" />
        </span>
      </Link>
    </section>
  );
}
