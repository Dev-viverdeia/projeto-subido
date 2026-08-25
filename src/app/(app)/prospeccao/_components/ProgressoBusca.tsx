'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import { EsperaOperacao } from '../../_components/EsperaOperacao';
import styles from './ProgressoBusca.module.css';

const ETAPAS = [
  {
    titulo: 'Buscando empresas',
    descricao: 'Procurando o tipo de negócio na cidade ou região escolhida.',
  },
  {
    titulo: 'Tirando repetições',
    descricao: 'Separando empresas novas das que você já recebeu.',
  },
  {
    titulo: 'Lendo o negócio',
    descricao: 'Reunindo site, presença digital e fatos públicos.',
  },
  {
    titulo: 'Localizando decisores',
    descricao: 'Procurando pessoas com papel de decisão ligadas à empresa.',
  },
  {
    titulo: 'Escolhendo o projeto',
    descricao: 'Relacionando cada empresa ao projeto de IA mais aderente.',
  },
  {
    titulo: 'Validando contatos',
    descricao: 'Organizando os melhores canais para iniciar a conversa.',
  },
] as const;

/**
 * Narração honesta da busca longa: as etapas correspondem ao pipeline
 * real, mas não exibem percentual ou prazo inventado. A última fica ativa até
 * a resposta do servidor substituir o formulário pela lista concluída.
 */
export function ProgressoBusca({
  quantidade,
  etapa = 1,
  detalhe,
}: {
  quantidade: number;
  etapa?: number;
  detalhe?: string | null;
}) {
  const [minimizado, setMinimizado] = useState(false);

  if (minimizado) {
    return (
      <div className={styles.minimizado} role="status" aria-live="polite">
        <span aria-hidden="true">
          <Spinner size="sm" tone="navy" />
        </span>
        <div>
          <strong>Montando sua lista</strong>
          <small>{detalhe ?? 'Você pode consultar outras listas enquanto a busca termina.'}</small>
        </div>
        <button type="button" onClick={() => setMinimizado(false)}>
          <Search size={14} aria-hidden="true" /> Ver andamento
        </button>
      </div>
    );
  }

  return (
    <EsperaOperacao
      aberto
      rotulo="Prospecção em andamento"
      titulo="Montando sua lista"
      descricao="Estamos buscando empresas e verificando os contatos públicos encontrados."
      detalhe={`${quantidade} empresas solicitadas`}
      etapas={ETAPAS}
      etapaAtual={Math.max(0, Math.min(etapa - 1, ETAPAS.length - 1))}
      nota={detalhe ?? 'Você pode acompanhar aqui ou continuar usando esta página.'}
      mensagemDemora="Algumas fontes estão respondendo mais devagar. Você pode sair desta janela; a busca continua e os créditos são devolvidos se ela falhar."
      demoraApos={35_000}
      acaoSecundaria={{
        rotulo: 'Continuar na plataforma',
        aoAcionar: () => setMinimizado(true),
      }}
    />
  );
}
