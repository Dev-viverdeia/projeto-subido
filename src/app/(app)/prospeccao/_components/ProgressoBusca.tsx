import { EsperaOperacao } from '../../_components/EsperaOperacao';

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
  return (
    <EsperaOperacao
      aberto
      rotulo="Prospecção em andamento"
      titulo="Montando sua lista"
      descricao="Estamos buscando empresas e verificando os contatos públicos encontrados."
      detalhe={`${quantidade} empresas solicitadas`}
      etapas={ETAPAS}
      intervalo={14_000}
    />
  );
}
