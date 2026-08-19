'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { BrainCircuit, Coins, Database, Globe2, Layers3, LoaderCircle, X } from 'lucide-react';
import { Alert, Button } from '@/design-system/via';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import { iniciarEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { EsperaOperacao } from '../../../_components/EsperaOperacao';
import styles from './FormularioEnriquecimento.module.css';

const ETAPAS_CONFIRMACAO = [
  {
    titulo: 'Abrindo o enriquecimento',
    descricao: 'Estamos reservando os créditos e conectando a análise à ficha deste cliente.',
  },
] as const;

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

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
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const tituloId = useId();
  const descricaoId = useId();
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const saldoSuficiente = saldoCreditos >= CUSTO_ENRIQUECIMENTO_OPORTUNIDADE;
  const saldoDepois = saldoCreditos - CUSTO_ENRIQUECIMENTO_OPORTUNIDADE;

  useEffect(() => {
    if (!montado || !aberto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const quadro = requestAnimationFrame(() =>
      painel.current?.querySelector<HTMLElement>('button')?.focus(),
    );
    return () => {
      cancelAnimationFrame(quadro);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, montado]);

  function fechar() {
    if (enviando) return;
    setAberto(false);
    setErro(null);
    requestAnimationFrame(() => gatilho.current?.focus());
  }

  async function confirmar() {
    if (!saldoSuficiente || enviando) return;
    setErro(null);
    setEnviando(true);
    const resposta = await iniciarEnriquecimento({ oportunidade_id: oportunidadeId });
    setEnviando(false);
    if (resposta.falha) {
      setErro(resposta.falha);
      return;
    }

    setAberto(false);
    router.refresh();
  }

  return (
    <>
      {enviando && (
        <EsperaOperacao
          aberto
          rotulo="Enriquecimento da ficha"
          titulo="Preparando a análise"
          descricao="A plataforma está reunindo os dados já salvos nesta oportunidade."
          etapas={ETAPAS_CONFIRMACAO}
          nota="Assim que a solicitação for registrada, você poderá continuar trabalhando."
        />
      )}
      <button
        ref={gatilho}
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
          ? 'Enriquecendo oportunidade'
          : (rotulo ?? (temDossie ? 'Atualizar enriquecimento' : 'Enriquecer oportunidade'))}
      </button>

      {montado &&
        aberto &&
        createPortal(
          <div
            className={styles.scrim}
            data-testid="enriquecimento-scrim"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) fechar();
            }}
          >
            <div
              ref={painel}
              className={styles.dialogo}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloId}
              aria-describedby={descricaoId}
              onKeyDown={(evento) => {
                if (evento.key === 'Escape') fechar();
                if (evento.key !== 'Tab') return;
                const focaveis =
                  painel.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
                if (!focaveis?.length) return;
                const primeiro = focaveis[0];
                const ultimo = focaveis[focaveis.length - 1];
                if (evento.shiftKey && document.activeElement === primeiro) {
                  evento.preventDefault();
                  ultimo?.focus();
                } else if (!evento.shiftKey && document.activeElement === ultimo) {
                  evento.preventDefault();
                  primeiro?.focus();
                }
              }}
            >
              <header className={styles.topo}>
                <span className={styles.iconeTopo} aria-hidden="true">
                  <BrainCircuit size={22} strokeWidth={1.7} />
                </span>
                <div>
                  <p className={styles.sobretitulo}>Enriquecimento da ficha</p>
                  <h2 id={tituloId}>Enriquecer esta oportunidade?</h2>
                  <p id={descricaoId}>
                    A plataforma usa tudo que já está salvo na ficha. Você não precisa preencher
                    nenhum dado novamente.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.fechar}
                  onClick={fechar}
                  aria-label="Fechar"
                >
                  <X size={19} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </header>

              <div className={styles.conteudo}>
                {erro && (
                  <Alert tone="danger" size="compact">
                    {erro} Nenhum crédito foi usado.
                  </Alert>
                )}

                {!saldoSuficiente && (
                  <Alert tone="attn" size="compact">
                    Seu saldo é de {saldoCreditos} {saldoCreditos === 1 ? 'crédito' : 'créditos'}.
                    São necessários {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos para enriquecer a
                    ficha.
                  </Alert>
                )}

                <div className={styles.fontes} aria-label="Dados usados no enriquecimento">
                  <div>
                    <span>
                      <Database size={17} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <p>
                      <strong>CRM</strong>
                      <small>Empresa, contato e histórico da oportunidade</small>
                    </p>
                  </div>
                  <div>
                    <span>
                      <Layers3 size={17} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <p>
                      <strong>Calls</strong>
                      <small>Resumos, dores e próximos passos registrados</small>
                    </p>
                  </div>
                  <div>
                    <span>
                      <Globe2 size={17} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <p>
                      <strong>Fontes públicas</strong>
                      <small>Site salvo na ficha e informações públicas disponíveis</small>
                    </p>
                  </div>
                </div>

                <div className={styles.creditos} aria-label="Custo do enriquecimento">
                  <span className={styles.iconeCreditos} aria-hidden="true">
                    <Coins size={20} strokeWidth={1.7} />
                  </span>
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
              </div>

              <footer className={styles.acoes}>
                <p>Se a análise falhar, os créditos voltam automaticamente.</p>
                <div>
                  <Button type="button" variant="secondary" onClick={fechar} disabled={enviando}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    loading={enviando}
                    disabled={!saldoSuficiente}
                    onClick={() => void confirmar()}
                  >
                    Confirmar por {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos
                  </Button>
                </div>
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
