'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/design-system/via';
import { AjudaNaFalha } from '@/components/suporte/AjudaNaFalha';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import type { StatusEnriquecimento } from '@/lib/crm/enriquecimento';
import { EsperaOperacao } from '../../../_components/EsperaOperacao';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import { useAcompanhamentoOperacao } from '../../../_components/useAcompanhamentoOperacao';
import styles from './EstadoEnriquecimento.module.css';

const ETAPAS = [
  {
    titulo: 'Reunindo o histórico',
    descricao: 'Lendo a ficha, as reuniões e os dados da Prospecção.',
  },
  {
    titulo: 'Consultando fontes públicas',
    descricao: 'Pesquisando a empresa a partir dos dados salvos.',
  },
  {
    titulo: 'Preparando a conversa',
    descricao: 'Organizando fatos e perguntas para sua próxima reunião.',
  },
] as const;

export function EstadoEnriquecimento({
  status,
  erro,
  acao,
  etapa,
  oportunidadeId,
}: {
  status: StatusEnriquecimento;
  erro: string | null;
  acao?: ReactNode;
  etapa?: string | null;
  oportunidadeId?: string;
}) {
  const [mostrarModal, setMostrarModal] = useState(true);
  const [mostrarFalha, setMostrarFalha] = useState(true);
  const ativo = status === 'na_fila' || status === 'processando';
  const online = useAcompanhamentoOperacao(ativo);
  const indice = etapa === 'gerar_dossie' ? 2 : etapa === 'ler_site' ? 1 : 0;

  if (status === 'falhou') {
    const mensagem = `${erro ?? 'O processamento não foi concluído.'} Os ${CUSTO_ENRIQUECIMENTO_OPORTUNIDADE} créditos foram devolvidos.`;
    return (
      <>
        {!mostrarFalha && (
          <AjudaNaFalha
            contexto="enriquecimento"
            pagina={oportunidadeId ? `/vendas/${oportunidadeId}` : undefined}
            titulo="Não foi possível atualizar a ficha."
            descricao={mensagem}
            acao={acao}
          />
        )}
        <ModalOperacao
          open={mostrarFalha}
          onClose={() => setMostrarFalha(false)}
          label="Enriquecimento interrompido"
          title="A ficha não foi atualizada."
          description={mensagem}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setMostrarFalha(false)} data-autofocus>
                Voltar para a ficha
              </Button>
              {acao}
            </>
          }
        />
      </>
    );
  }
  if (!ativo) return null;

  return (
    <>
      <EsperaOperacao
        aberto={mostrarModal}
        rotulo="Enriquecimento em andamento"
        titulo={status === 'na_fila' ? 'Preparando a pesquisa' : 'Atualizando a ficha do cliente'}
        descricao="Usando os dados da ficha para preparar sua próxima conversa."
        etapas={ETAPAS}
        etapaAtual={indice}
        nota={
          online
            ? 'Você pode sair desta janela. A análise continua em segundo plano.'
            : 'Sem conexão. O andamento será atualizado quando a internet voltar.'
        }
        mensagemDemora={
          online ? 'Ainda aguardando o resultado. Você pode continuar usando a ficha.' : undefined
        }
        demoraApos={45000}
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
            <h2>{status === 'na_fila' ? 'Pesquisa na fila' : ETAPAS[indice].titulo}</h2>
            <p>
              {online
                ? 'A ficha será atualizada quando os dados estiverem prontos.'
                : 'Sem conexão. A consulta será retomada quando a internet voltar.'}
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
      </section>
    </>
  );
}
