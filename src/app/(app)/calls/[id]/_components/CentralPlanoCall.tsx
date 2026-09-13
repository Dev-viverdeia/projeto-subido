import { ChevronRight } from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import { etapaVisivel, type EtapaCrm } from '@/lib/crm/etapas';
import { FormularioPlanoCall } from './FormularioPlanoCall';
import styles from './PosCallFoco.module.css';

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
}: {
  posCall: PosCall;
  acaoSugerida: string;
  resumo: string | null;
}) {
  const etapaAtual = etapaVisivel(posCall.oportunidade.etapa);
  const etapaRecomendada = sugerirEtapa(posCall);
  const compromissos = posCall.analise?.compromissos ?? [];
  const kickoff = posCall.reuniao.tipo === 'kickoff';
  const decisoes = posCall.analise?.status === 'concluida' ? posCall.analise.decisoes : [];

  return (
    <section
      id="plano-da-call"
      className={styles.central}
      aria-label="Decisões e próximos passos"
      data-sem-analise={!posCall.analise || undefined}
    >
      {posCall.analise && (
        <div className={styles.decisoes}>
          <h2>{kickoff ? 'O que ficou combinado' : 'O que ficou decidido'}</h2>
          {posCall.analise && (
            <p className={styles.apoio}>Extraído da conversa. Confira com o que foi combinado.</p>
          )}
          {decisoes.length ? (
            <ul className={styles.listaDecisoes}>
              {decisoes.slice(0, 3).map((decisao, indice) => (
                <li key={indice}>{decisao}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.vazio}>
              Nenhuma decisão explícita registrada. Defina o próximo passo com o cliente.
            </p>
          )}
          {decisoes.length > 3 && (
            <details className={styles.detalhe}>
              <summary>
                Mais {decisoes.length - 3} {decisoes.length === 4 ? 'decisão' : 'decisões'}{' '}
                <ChevronRight size={18} aria-hidden="true" />
              </summary>
              <ul className={styles.listaDecisoes}>
                {decisoes.slice(3).map((decisao, indice) => (
                  <li key={indice}>{decisao}</li>
                ))}
              </ul>
            </details>
          )}
          {resumo && (
            <details className={styles.detalhe}>
              <summary>
                Resumo da conversa <ChevronRight size={18} aria-hidden="true" />
              </summary>
              <p className={styles.resumo}>{resumo}</p>
            </details>
          )}
          {posCall.analise && (
            <p className={styles.registro}>
              {posCall.sincronizacao.historicoCrm
                ? 'Resumo salvo na ficha do cliente'
                : 'Resumo ainda não registrado na ficha'}
            </p>
          )}
        </div>
      )}

      <FormularioPlanoCall
        reuniaoId={posCall.reuniao.id}
        oportunidadeId={posCall.oportunidade.id}
        acaoInicial={acaoSugerida}
        dataInicial={dataInput(posCall.oportunidade.proximaAcaoEm)}
        etapaAtual={etapaAtual}
        etapaSugerida={etapaRecomendada}
        compromissos={compromissos}
        modo={kickoff ? 'kickoff' : 'venda'}
      />
    </section>
  );
}
