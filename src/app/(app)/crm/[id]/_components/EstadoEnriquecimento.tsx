'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleAlert, Database, Globe2, Layers3, ScanSearch, X } from 'lucide-react';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import type { StatusEnriquecimento } from '@/lib/crm/enriquecimento';
import { EsperaOperacao } from '../../../_components/EsperaOperacao';
import styles from './EstadoEnriquecimento.module.css';

const TENTATIVAS = 60;
const INTERVALO = 4000;
const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;
const ETAPAS = [
  {
    titulo: 'Reunindo o histórico',
    descricao: 'Lendo os dados da empresa, do contato, das calls e da Prospecção.',
  },
  {
    titulo: 'Pesquisando a empresa',
    descricao: 'Consultando o site e outras fontes públicas disponíveis.',
  },
  {
    titulo: 'Preparando sua próxima conversa',
    descricao: 'Organizando fatos, projetos aderentes e perguntas personalizadas para a call.',
  },
] as const;

export function EstadoEnriquecimento({
  status,
  erro,
  acao,
}: {
  status: StatusEnriquecimento;
  erro: string | null;
  acao?: ReactNode;
}) {
  const router = useRouter();
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const [tentativas, setTentativas] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(true);
  const [mostrarFalha, setMostrarFalha] = useState(true);
  const ativo = status === 'na_fila' || status === 'processando';

  useEffect(() => {
    if (!ativo || tentativas >= TENTATIVAS) return;
    const timer = setTimeout(() => {
      setTentativas((numero) => numero + 1);
      router.refresh();
    }, INTERVALO);
    return () => clearTimeout(timer);
  }, [ativo, router, tentativas]);

  useEffect(() => {
    if (!montado || status !== 'falhou' || !mostrarFalha) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [montado, mostrarFalha, status]);

  if (status === 'falhou') {
    return (
      <>
        <section className={styles.falha} role="alert" aria-labelledby="pesquisa-falhou-titulo">
          <span className={styles.iconeFalha}>
            <ScanSearch size={21} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div>
            <p className={styles.sobretitulo}>Enriquecimento interrompido</p>
            <h2 id="pesquisa-falhou-titulo">Não foi possível atualizar a ficha.</h2>
            <p>
              {erro ?? 'O processamento não foi concluído.'} Os {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE}{' '}
              créditos foram devolvidos automaticamente.
            </p>
          </div>
          {acao && !mostrarFalha && <div className={styles.acaoFalha}>{acao}</div>}
        </section>

        {montado &&
          mostrarFalha &&
          createPortal(
            <div className={styles.scrimFalha}>
              <section
                className={styles.dialogoFalha}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="enriquecimento-erro-titulo"
                aria-describedby="enriquecimento-erro-descricao"
              >
                <button
                  type="button"
                  className={styles.fecharFalha}
                  onClick={() => setMostrarFalha(false)}
                  aria-label="Fechar aviso"
                >
                  <X size={18} strokeWidth={1.8} aria-hidden="true" />
                </button>
                <span className={styles.iconeDialogoFalha} aria-hidden="true">
                  <CircleAlert size={24} strokeWidth={1.7} />
                </span>
                <p className={styles.sobretitulo}>Enriquecimento interrompido</p>
                <h2 id="enriquecimento-erro-titulo">A ficha não foi atualizada.</h2>
                <p id="enriquecimento-erro-descricao">
                  {erro ?? 'O processamento não foi concluído.'} Seu saldo já recebeu de volta os{' '}
                  {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos.
                </p>
                <div className={styles.acoesDialogoFalha}>
                  <button type="button" onClick={() => setMostrarFalha(false)}>
                    Voltar para a ficha
                  </button>
                  {acao}
                </div>
              </section>
            </div>,
            document.body,
          )}
      </>
    );
  }

  if (!ativo) return null;

  return (
    <>
      <EsperaOperacao
        key={status}
        aberto={mostrarModal}
        rotulo="Enriquecimento em andamento"
        titulo={status === 'na_fila' ? 'Preparando a pesquisa' : 'Atualizando a ficha do cliente'}
        descricao="A plataforma está transformando os dados desta oportunidade em contexto para a venda do projeto de IA."
        etapas={ETAPAS}
        etapaInicial={status === 'processando' ? 1 : 0}
        intervalo={18_000}
        nota="Você pode acompanhar aqui ou continuar usando a ficha. O processamento segue no servidor."
        mensagemDemora="A pesquisa está levando mais tempo que o normal, mas continua ativa no servidor."
        demoraApos={24_000}
        acaoSecundaria={{
          rotulo: 'Continuar usando a ficha',
          aoAcionar: () => setMostrarModal(false),
        }}
      />

      <section
        className={styles.estado}
        aria-live="polite"
        aria-label="Enriquecimento em andamento"
      >
        <div className={styles.cabecalho}>
          <div>
            <p className={styles.sobretitulo}>Enriquecimento em andamento</p>
            <h2>
              {status === 'na_fila' ? 'Preparando a pesquisa' : 'Atualizando a ficha do cliente'}
            </h2>
            <p>
              Você pode continuar trabalhando. A ficha será atualizada quando os novos dados
              estiverem prontos.
            </p>
          </div>
          <button
            type="button"
            className={styles.abrirProgresso}
            onClick={() => setMostrarModal(true)}
          >
            Ver andamento
          </button>
        </div>

        <ol className={styles.mapa} aria-label="Etapas do enriquecimento">
          <li data-estado="concluida">
            <span>
              <Check size={14} aria-hidden="true" />
            </span>
            <div>
              <strong>Reunir histórico</strong>
              <small>CRM, Prospecção e calls</small>
            </div>
            <Database size={16} aria-hidden="true" />
          </li>
          <li data-estado={status === 'processando' ? 'concluida' : 'atual'}>
            <span>{status === 'processando' ? <Check size={14} aria-hidden="true" /> : '02'}</span>
            <div>
              <strong>Consultar fontes</strong>
              <small>Site e dados públicos</small>
            </div>
            <Globe2 size={16} aria-hidden="true" />
          </li>
          <li data-estado={status === 'processando' ? 'atual' : 'futura'}>
            <span>03</span>
            <div>
              <strong>Preparar a conversa</strong>
              <small>Fatos, projetos e perguntas</small>
            </div>
            <Layers3 size={16} aria-hidden="true" />
          </li>
        </ol>
      </section>
    </>
  );
}
