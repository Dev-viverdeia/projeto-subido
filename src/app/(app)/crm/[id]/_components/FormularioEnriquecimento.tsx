'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Database, Globe2, Layers3, LoaderCircle } from 'lucide-react';
import { Alert, Button } from '@/design-system/via';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import { iniciarEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { EsperaOperacao } from '../../../_components/EsperaOperacao';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import { RecuperarEnriquecimento } from './RecuperarEnriquecimento';
import styles from './FormularioEnriquecimento.module.css';

const ETAPAS_CONFIRMACAO = [
  {
    titulo: 'Registrando a solicitação',
    descricao: 'Validando a ficha e a reserva de créditos.',
  },
] as const;

export function FormularioEnriquecimento({
  oportunidadeId,
  saldoCreditos,
  temDossie,
  rotulo,
  abertoInicial = false,
  tom = 'padrao',
  desabilitado = false,
}: {
  oportunidadeId: string;
  saldoCreditos: number;
  temDossie: boolean;
  rotulo?: string;
  abertoInicial?: boolean;
  tom?: 'padrao' | 'claro' | 'transparente' | 'secundario';
  desabilitado?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(abertoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [incerto, setIncerto] = useState(false);
  const [anteriorId, setAnteriorId] = useState<string | null>();
  const [atualizando, atualizar] = useTransition();
  const emCurso = useRef(false);
  const saldoSuficiente = saldoCreditos >= CUSTO_ENRIQUECIMENTO_OPORTUNIDADE;
  const saldoDepois = saldoCreditos - CUSTO_ENRIQUECIMENTO_OPORTUNIDADE;

  function fechar() {
    if (enviando) return;
    setAberto(false);
    if (!incerto) setErro(null);
  }

  async function confirmar() {
    if (!saldoSuficiente || emCurso.current || incerto) return;
    if (!navigator.onLine) {
      setErro('Sem conexão. Reconecte para enriquecer a ficha. Nenhuma solicitação foi enviada.');
      return;
    }
    emCurso.current = true;
    setErro(null);
    setAberto(false);
    setEnviando(true);
    try {
      const resposta = await iniciarEnriquecimento({ oportunidade_id: oportunidadeId });
      if (resposta.falha) {
        setAberto(true);
        setErro(resposta.falha);
        setIncerto(resposta.incerto ?? false);
        setAnteriorId(resposta.anteriorId);
      }
    } catch {
      setIncerto(true);
      setAberto(true);
      setErro(
        'Não conseguimos confirmar o início. Confira o andamento na ficha antes de tentar novamente.',
      );
    } finally {
      atualizar(() => router.refresh());
      setEnviando(false);
      emCurso.current = false;
    }
  }

  return (
    <>
      {!desabilitado && (enviando || (atualizando && !aberto)) && (
        <EsperaOperacao
          aberto
          rotulo="Enriquecimento da ficha"
          titulo="Preparando a análise"
          descricao="A plataforma está reunindo os dados já salvos nesta ficha."
          etapas={ETAPAS_CONFIRMACAO}
          etapaAtual={0}
          nota="Esta janela fecha assim que o enriquecimento for registrado."
        />
      )}
      <button
        type="button"
        className={
          tom === 'padrao'
            ? `via-btn ${temDossie ? 'via-btn--secondary' : 'via-btn--primary'} via-btn--md ${styles.gatilho}`
            : tom === 'secundario'
              ? `via-btn via-btn--secondary via-btn--md ${styles.gatilho}`
              : `${styles.gatilho} ${tom === 'claro' ? styles.gatilhoClaro : styles.gatilhoTransparente}`
        }
        data-tom={tom}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        disabled={desabilitado || enviando || atualizando}
      >
        {desabilitado ? (
          <LoaderCircle
            className={styles.iconeGirando}
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        ) : (
          <Layers3 size={16} strokeWidth={1.9} aria-hidden="true" />
        )}
        {desabilitado
          ? 'Enriquecendo dados'
          : incerto
            ? 'Conferir análise'
            : (rotulo ?? (temDossie ? 'Atualizar dados' : 'Enriquecer dados'))}
      </button>

      <ModalOperacao
        open={aberto && !desabilitado}
        onClose={fechar}
        label="Dados do cliente"
        title={incerto ? 'Andamento da análise' : 'Enriquecer esta oportunidade?'}
        description={incerto ? undefined : 'Usaremos o que já está salvo e fontes públicas.'}
        size="md"
        blocked={enviando}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={fechar}
              disabled={enviando}
              data-autofocus
            >
              {incerto ? 'Fechar' : 'Cancelar'}
            </Button>
            {!incerto && (
              <Button
                type="button"
                variant="primary"
                loading={enviando}
                disabled={!saldoSuficiente}
                onClick={() => void confirmar()}
              >
                Usar {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos
              </Button>
            )}
          </>
        }
      >
        {incerto && (
          <RecuperarEnriquecimento
            oportunidadeId={oportunidadeId}
            anteriorId={anteriorId}
            aoAbrirFicha={() => {
              fechar();
              atualizar(() => router.refresh());
            }}
          />
        )}
        {!incerto && (
          <div className={styles.conteudo}>
            {erro && (
              <Alert tone="danger" size="compact">
                {erro}
              </Alert>
            )}

            {!saldoSuficiente && (
              <Alert tone="attn" size="compact">
                Seu saldo é de {saldoCreditos} {saldoCreditos === 1 ? 'crédito' : 'créditos'}. São
                necessários {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos para enriquecer a ficha.
              </Alert>
            )}

            <div className={styles.fontes} aria-label="Dados usados no enriquecimento">
              <div>
                <span aria-hidden="true">
                  <Database size={17} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <p>
                  <strong>Ficha do cliente</strong>
                  <small>Empresa e contato</small>
                </p>
              </div>
              <div>
                <span aria-hidden="true">
                  <Layers3 size={17} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <p>
                  <strong>Reuniões</strong>
                  <small>Dores e próximos passos</small>
                </p>
              </div>
              <div>
                <span aria-hidden="true">
                  <Globe2 size={17} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <p>
                  <strong>Fontes públicas</strong>
                  <small>Site e dados disponíveis</small>
                </p>
              </div>
            </div>

            <div className={styles.creditos} aria-label="Custo do enriquecimento">
              <div>
                <small>Custo</small>
                <strong>{CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos</strong>
              </div>
              <div>
                <small>Saldo atual</small>
                <strong>{saldoCreditos}</strong>
              </div>
              <div>
                <small>Saldo depois</small>
                <strong>{saldoSuficiente ? saldoDepois : '—'}</strong>
              </div>
            </div>
            <p className={styles.garantia}>
              Se a análise falhar, os créditos voltam automaticamente.
            </p>
          </div>
        )}
      </ModalOperacao>
    </>
  );
}
