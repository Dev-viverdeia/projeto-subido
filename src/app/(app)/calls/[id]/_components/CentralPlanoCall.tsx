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
}: {
  posCall: PosCall;
  acaoSugerida: string;
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
        <p className={styles.sobretitulo}>Atualizar a venda</p>
        <h2 id="plano-da-call-titulo">Revise o que será salvo</h2>
        <p>A transcrição já foi salva. Confirme a próxima ação, a etapa e os compromissos.</p>

        <ol className={styles.fluxoSincronizacao}>
          <li data-concluido={posCall.sincronizacao.historicoCrm || undefined}>
            <span>
              <BadgeCheck size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Histórico da conversa</strong>
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

        <p className={styles.garantiaRevisao}>Nada muda na venda sem sua confirmação.</p>
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
