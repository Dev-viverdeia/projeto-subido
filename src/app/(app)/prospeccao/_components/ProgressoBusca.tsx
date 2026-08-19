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
    titulo: 'Procurando contatos',
    descricao: 'Buscando telefone, e-mail, site e redes sociais.',
  },
  {
    titulo: 'Buscando possíveis decisores',
    descricao: 'Procurando pessoas com cargo de decisão ligadas à empresa.',
  },
  {
    titulo: 'Organizando os resultados',
    descricao: 'Removendo repetições e preparando a lista para consulta.',
  },
] as const;

/**
 * Narração honesta da busca longa: as quatro etapas correspondem ao pipeline
 * real, mas não exibem percentual ou prazo inventado. A última fica ativa até
 * a resposta do servidor substituir o formulário pela lista concluída.
 */
export function ProgressoBusca({ quantidade }: { quantidade: number }) {
  const [minimizado, setMinimizado] = useState(false);

  if (minimizado) {
    return (
      <div className={styles.minimizado} role="status" aria-live="polite">
        <span aria-hidden="true">
          <Spinner size="sm" tone="navy" />
        </span>
        <div>
          <strong>Montando sua lista</strong>
          <small>Você pode consultar outras listas enquanto a busca termina.</small>
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
      intervalo={14_000}
      nota="Você pode acompanhar aqui ou continuar usando esta página."
      mensagemDemora="As fontes estão levando mais tempo que o normal. A busca continua ativa e, se não terminar, os créditos voltam para o saldo."
      demoraApos={24_000}
      acaoSecundaria={{
        rotulo: 'Continuar na plataforma',
        aoAcionar: () => setMinimizado(true),
      }}
    />
  );
}
