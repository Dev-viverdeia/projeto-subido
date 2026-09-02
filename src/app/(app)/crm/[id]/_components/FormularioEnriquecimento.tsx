'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Database, Globe2, Layers3, LoaderCircle } from 'lucide-react';
import { Alert, Button } from '@/design-system/via';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import { iniciarEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { EsperaOperacao } from '../../../_components/EsperaOperacao';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import styles from './FormularioEnriquecimento.module.css';

const ETAPAS_CONFIRMACAO = [
  {
    titulo: 'Reservando os créditos',
    descricao: 'O valor fica protegido enquanto a solicitação é registrada.',
  },
  {
    titulo: 'Preparando a ficha',
    descricao: 'Estamos organizando os dados desta ficha antes da pesquisa.',
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
  const saldoSuficiente = saldoCreditos >= CUSTO_ENRIQUECIMENTO_OPORTUNIDADE;
  const saldoDepois = saldoCreditos - CUSTO_ENRIQUECIMENTO_OPORTUNIDADE;

  function fechar() {
    if (enviando) return;
    setAberto(false);
    setErro(null);
  }

  async function confirmar() {
    if (!saldoSuficiente || enviando) return;
    setErro(null);
    setAberto(false);
    setEnviando(true);
    const resposta = await iniciarEnriquecimento({ oportunidade_id: oportunidadeId });
    if (resposta.falha) {
      setEnviando(false);
      setAberto(true);
      setErro(resposta.falha);
      return;
    }

    router.refresh();
    setEnviando(false);
  }

  return (
    <>
      {enviando && (
        <EsperaOperacao
          aberto
          rotulo="Enriquecimento da ficha"
          titulo="Preparando a análise"
          descricao="A plataforma está reunindo os dados já salvos nesta ficha."
          etapas={ETAPAS_CONFIRMACAO}
          intervalo={1_800}
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
        disabled={desabilitado}
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
          : (rotulo ?? (temDossie ? 'Atualizar dados' : 'Enriquecer dados'))}
      </button>

      <ModalOperacao
        open={aberto}
        onClose={fechar}
        label="Dados do cliente"
        title="Enriquecer esta oportunidade?"
        description="Usaremos o que já está salvo e fontes públicas."
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
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={enviando}
              disabled={!saldoSuficiente}
              onClick={() => void confirmar()}
            >
              Usar {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos
            </Button>
          </>
        }
      >
        <div className={styles.conteudo}>
          {erro && (
            <Alert tone="danger" size="compact">
              {erro} Nenhum crédito foi usado.
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
      </ModalOperacao>
    </>
  );
}
