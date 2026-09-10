import { LoaderCircle } from 'lucide-react';
import { IconeProduto } from '@/components/brand/IconeProduto';
import { TextoResposta } from './TextoResposta';
import styles from './Conversa.module.css';
type EtapaProcessamento =
  'enviando' | 'conferindo-envio' | 'lendo' | 'pensando' | 'finalizando' | 'conferindo' | null;

function descricaoDaEtapa(etapa: EtapaProcessamento, comArquivos: boolean): string {
  if (etapa === 'enviando') return 'Enviando mensagem';
  if (etapa === 'conferindo-envio') return 'Conferindo envio';
  if (etapa === 'lendo') return 'Analisando seus arquivos';
  if (etapa === 'finalizando') return 'Salvando resposta';
  if (etapa === 'conferindo') return 'Conferindo a resposta salva';
  if (comArquivos) return 'Preparando a resposta com seus dados';
  return 'Preparando uma resposta com seus dados';
}

export function RespostaEmAndamento({
  etapa,
  texto,
  parando,
  confirmando,
  comArquivos,
}: {
  etapa: EtapaProcessamento;
  texto: string | null;
  parando: boolean;
  confirmando: boolean;
  comArquivos: boolean;
}) {
  return (
    <>
      {etapa && !texto ? (
        <div className={styles.processando} role="status" aria-live="polite">
          <LoaderCircle className={styles.girando} size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>
            <strong>
              {parando
                ? 'Interrompendo…'
                : confirmando
                  ? 'Confirmando envio'
                  : descricaoDaEtapa(etapa, comArquivos)}
            </strong>
            {etapa === 'conferindo' && <small>Sem gerar uma nova resposta.</small>}
          </span>
        </div>
      ) : null}
      {texto !== null ? (
        <div
          className={styles.respostaConsultor}
          data-resposta-progressiva
          data-gerando={Boolean(etapa)}
        >
          <span className={styles.autorResposta}>
            <IconeProduto nome="sobral" tamanho={20} /> Sobral AI
          </span>
          <TextoResposta texto={texto} completa />
        </div>
      ) : null}
      {texto && etapa ? (
        <span className={styles.estadoResposta} role="status">
          {parando
            ? 'Interrompendo…'
            : etapa === 'conferindo'
              ? 'Conferindo a resposta salva…'
              : etapa === 'finalizando'
                ? 'Salvando resposta…'
                : 'Respondendo…'}
        </span>
      ) : null}
    </>
  );
}
