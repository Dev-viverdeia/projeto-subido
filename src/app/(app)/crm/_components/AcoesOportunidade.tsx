'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import {
  Archive,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  FileSignature,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/design-system/via';
import { MenuAcoesVenda } from './MenuAcoesVenda';
import { alterarSituacaoOportunidade } from '@/lib/crm/situacao-actions';
import { moverOportunidadeKanban } from '@/lib/crm/actions';
import { estaNoFluxo, type SituacaoCrm } from '@/lib/crm/situacao';
import {
  MOTIVOS_PERDA_CRM,
  rotuloEtapaVisivel,
  type EtapaCrm,
  type MotivoPerdaCrm,
} from '@/lib/crm/etapas';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import { ModalOperacao } from '../../_components/ModalOperacao';
import styles from './AcoesOportunidade.module.css';

type Acao = SituacaoCrm | 'perdido';
const ROTULOS: Record<Acao, string> = {
  ativa: 'Restaurar oportunidade',
  arquivada: 'Arquivar oportunidade',
  desclassificada: 'Desclassificar oportunidade',
  perdido: 'Marcar como perdida',
};
const MOTIVOS: Record<Acao, readonly { id: string; rotulo: string }[]> = {
  ativa: [],
  perdido: MOTIVOS_PERDA_CRM,
  arquivada: [
    { id: 'Retomar mais adiante', rotulo: 'Retomar mais adiante' },
    { id: 'Manter apenas no histórico', rotulo: 'Manter apenas no histórico' },
  ],
  desclassificada: [
    { id: 'Fora do perfil de cliente', rotulo: 'Fora do perfil de cliente' },
    { id: 'Sem aderência ao serviço', rotulo: 'Sem aderência ao serviço' },
    { id: 'Cadastro duplicado', rotulo: 'Cadastro duplicado' },
    { id: 'Dados inválidos', rotulo: 'Dados inválidos' },
  ],
};

export function AcoesOportunidade({
  oportunidade,
  compacto = false,
  desabilitado = false,
  aoMover,
}: {
  oportunidade: OportunidadeCrm;
  compacto?: boolean;
  desabilitado?: boolean;
  aoMover?: (item: OportunidadeCrm, etapa: EtapaCrm) => void;
}) {
  const router = useRouter();
  const motivoId = useId();
  const [acao, setAcao] = useState<Acao | null>(null);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [pending, iniciar] = useTransition();
  const noFluxo = estaNoFluxo(oportunidade);
  function abrir(proxima: Acao) {
    setErro('');
    setMotivo('');
    setAcao(proxima);
  }
  function confirmar() {
    if (!acao || pending) return;
    if (acao !== 'ativa' && !motivo) {
      setErro('Escolha um motivo para continuar.');
      return;
    }
    iniciar(async () => {
      try {
        const resultado =
          acao === 'perdido'
            ? await moverOportunidadeKanban({
                id: oportunidade.id,
                etapa: 'perdido',
                motivoPerda: motivo as MotivoPerdaCrm,
              })
            : await alterarSituacaoOportunidade({
                id: oportunidade.id,
                situacao: acao,
                anterior: oportunidade.situacao ?? 'ativa',
                motivo,
              });
        if (!resultado.ok) {
          setErro(resultado.erro);
          return;
        }
        setAcao(null);
        router.refresh();
      } catch (error) {
        unstable_rethrow(error);
        setErro('Não conseguimos confirmar a mudança. Atualize a página antes de tentar de novo.');
      }
    });
  }
  const movimento = (etapa: EtapaCrm) => {
    if (aoMover) aoMover(oportunidade, etapa);
    else
      iniciar(async () => {
        try {
          const resultado = await moverOportunidadeKanban({ id: oportunidade.id, etapa });
          if (!resultado.ok) setErro(resultado.erro);
          else router.refresh();
        } catch (error) {
          unstable_rethrow(error);
          setErro('Não foi possível mover a venda. Atualize a página.');
        }
      });
  };
  return (
    <div
      className={styles.acoes}
      data-no-dnd
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <MenuAcoesVenda
        rotulo={`Ações de ${oportunidade.empresa}`}
        compacto={compacto}
        disabled={pending || desabilitado}
        grupos={
          noFluxo
            ? [
                {
                  id: 'proposta',
                  items: [
                    {
                      id: 'criar',
                      label: 'Criar proposta',
                      icon: <FileSignature size={18} />,
                      onSelect: () =>
                        router.push(`/propostas/nova?oportunidade=${oportunidade.id}`),
                      disabled: oportunidade.etapa === 'perdido',
                    },
                  ],
                },
                {
                  id: 'mover',
                  label: 'Mover para',
                  items: (['novo_lead', 'descoberta', 'proposta', 'ganho'] as const).map(
                    (etapa) => ({
                      id: etapa,
                      label: etapa === 'ganho' ? 'Ganho' : rotuloEtapaVisivel(etapa),
                      icon:
                        etapa === 'ganho' ? <CheckCircle2 size={18} /> : <ArrowUpRight size={18} />,
                      disabled: oportunidade.etapa === etapa || pending || desabilitado,
                      onSelect: () => movimento(etapa),
                    }),
                  ),
                },
                {
                  id: 'retirar',
                  label: 'Retirar do fluxo',
                  items: [
                    {
                      id: 'arquivar',
                      label: 'Arquivar',
                      icon: <Archive size={18} />,
                      onSelect: () => abrir('arquivada'),
                    },
                    {
                      id: 'desclassificar',
                      label: 'Desclassificar',
                      icon: <Ban size={18} />,
                      disabled: oportunidade.etapa === 'ganho',
                      onSelect: () => abrir('desclassificada'),
                    },
                    {
                      id: 'perder',
                      label: 'Marcar como perdida',
                      icon: <XCircle size={18} />,
                      disabled: oportunidade.etapa === 'perdido',
                      onSelect: () =>
                        aoMover ? aoMover(oportunidade, 'perdido') : abrir('perdido'),
                    },
                  ],
                },
              ]
            : [
                {
                  id: 'restaurar',
                  items: [
                    {
                      id: 'ativa',
                      label: 'Restaurar oportunidade',
                      icon: <RotateCcw size={18} />,
                      onSelect: () => abrir('ativa'),
                    },
                  ],
                },
              ]
        }
      />
      {erro && !acao && (
        <p role="alert" className={styles.erro}>
          {erro}
        </p>
      )}
      <ModalOperacao
        open={Boolean(acao)}
        onClose={() => setAcao(null)}
        blocked={pending}
        size="sm"
        title={acao ? `${ROTULOS[acao]}?` : ''}
        description={oportunidade.empresa}
        footer={
          <>
            <Button variant="secondary" disabled={pending} onClick={() => setAcao(null)}>
              Cancelar
            </Button>
            <Button loading={pending} disabled={pending} onClick={confirmar}>
              {pending ? 'Salvando' : acao ? ROTULOS[acao] : 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className={styles.confirmacao}>
          <p>
            {acao === 'ativa'
              ? oportunidade.etapa === 'perdido'
                ? 'Remove o arquivamento. A venda continua como perdida.'
                : `Volta para ${rotuloEtapaVisivel(oportunidade.etapa)}, com o histórico preservado.`
              : acao === 'perdido'
                ? 'Sai do quadro e conta como perda nas métricas.'
                : oportunidade.etapa === 'ganho' || oportunidade.etapa === 'perdido'
                  ? 'Fica no histórico, com o resultado da venda preservado. Você pode restaurar depois.'
                  : 'Sai do quadro, sem contar como perda. Você pode restaurar depois.'}
          </p>
          {acao && acao !== 'ativa' && (
            <div className={styles.campo}>
              <label htmlFor={motivoId}>Motivo</label>
              <select
                id={motivoId}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setErro('');
                }}
                disabled={pending}
                data-autofocus
              >
                <option value="">Selecione um motivo</option>
                {MOTIVOS[acao].map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.rotulo}
                  </option>
                ))}
              </select>
            </div>
          )}
          <small>Reuniões, propostas e entregas existentes não serão canceladas.</small>
          {erro && (
            <p role="alert" className={styles.erro}>
              {erro}
            </p>
          )}
        </div>
      </ModalOperacao>
    </div>
  );
}
