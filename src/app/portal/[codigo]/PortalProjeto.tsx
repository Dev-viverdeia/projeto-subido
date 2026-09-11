import { Check, ChevronDown, Clock3, MessageSquareText } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';

import { AprovacaoCliente } from './AprovacaoCliente';
import { AcordoProjetoPortal } from './AcordoProjetoPortal';
import { PendenciaCliente } from './PendenciaCliente';
import { ControleEscopoPortal, DecisaoMudancaEscopo } from './MudancaEscopoPortal';
import { TermoEncerramentoPortal } from './TermoEncerramentoPortal';
import { PosEntregaPortal } from './PosEntregaPortal';
import { CabecalhoPortal, dataPortal } from './CabecalhoPortal';
import { ArquivosPortal } from './ArquivosPortal';
import { EntregasPortal } from './EntregasPortal';
import { HistoricoPortal } from './HistoricoPortal';
import { RevisaoResultadoPortal } from './RevisaoResultadoPortal';
import { RevisaoPortal } from './RevisaoPortal';
import layout from './PortalProjeto.module.css';

export function PortalProjeto({
  codigo,
  projeto,
}: {
  codigo: string;
  projeto: ProjetoPortalCliente;
}) {
  const ultimaTarefa = projeto.tarefas.at(-1) ?? null;
  const aprovacoes = projeto.tarefas.filter((tarefa) => tarefa.clienteStatus === 'aguardando');
  const dependencias = projeto.dependencias.filter((acao) => acao.status === 'pendente');
  const mudancasAguardando = projeto.mudancasEscopo.filter(
    (mudanca) => mudanca.status === 'aguardando_cliente',
  );
  const totalAcoes = aprovacoes.length + dependencias.length + mudancasAguardando.length;
  const agruparRevisoes = aprovacoes.length + mudancasAguardando.length > 1;
  const ajustePendente = projeto.tarefas.find((tarefa) => tarefa.clienteStatus === 'ajustes');
  const concluido = projeto.status === 'concluido';

  const apenasAprovacao = aprovacoes.length === totalAcoes && aprovacoes.length > 0;
  const apenasDependencia = dependencias.length === totalAcoes && dependencias.length > 0;
  const tituloDecisao =
    apenasAprovacao && totalAcoes === 1
      ? 'Revise esta entrega.'
      : mudancasAguardando.length === totalAcoes && totalAcoes > 0
        ? 'Revise a mudança no projeto.'
        : apenasDependencia
          ? `${totalAcoes} ${totalAcoes === 1 ? 'item precisa' : 'itens precisam'} da sua confirmação.`
          : `${totalAcoes} ${totalAcoes === 1 ? 'item aguarda' : 'itens aguardam'} sua resposta.`;

  return (
    <main className={layout.pagina}>
      <div className={layout.canvas}>
        <CabecalhoPortal projeto={projeto} />
        {totalAcoes > 0 && (
          <section className={layout.centralDecisoes} aria-labelledby="decisoes-titulo">
            <header>
              <span className={layout.iconeDecisao}>
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <h2 id="decisoes-titulo">{tituloDecisao}</h2>
            </header>
            <div className={layout.listaAprovacoes}>
              {mudancasAguardando.map((mudanca, indice) => (
                <RevisaoPortal
                  key={mudanca.id}
                  titulo={mudanca.titulo}
                  tipo="mudanca"
                  primeira={indice === 0}
                  agrupar={agruparRevisoes}
                >
                  <DecisaoMudancaEscopo
                    codigo={codigo}
                    mudanca={mudanca}
                    emFila={agruparRevisoes}
                  />
                </RevisaoPortal>
              ))}
              {aprovacoes.map((tarefa, indice) => (
                <RevisaoPortal
                  key={tarefa.id}
                  titulo={tarefa.titulo}
                  tipo="entrega"
                  primeira={mudancasAguardando.length === 0 && indice === 0}
                  agrupar={agruparRevisoes}
                >
                  <AprovacaoCliente
                    codigo={codigo}
                    tarefa={tarefa}
                    emFila={agruparRevisoes}
                    aceiteFinal={tarefa.id === ultimaTarefa?.id && projeto.feitas === projeto.total}
                    encerramento={
                      tarefa.id === ultimaTarefa?.id && projeto.feitas === projeto.total
                        ? projeto.encerramento
                        : null
                    }
                    arquivos={projeto.arquivos.filter((arquivo) => arquivo.tarefaId === tarefa.id)}
                  />
                </RevisaoPortal>
              ))}
              {dependencias.map((acao) => (
                <PendenciaCliente key={acao.id} codigo={codigo} acao={acao} />
              ))}
            </div>
          </section>
        )}
        {!totalAcoes && !concluido && (
          <div className={layout.aviso}>
            {ajustePendente ? (
              <MessageSquareText size={20} aria-hidden="true" />
            ) : (
              <Check size={20} aria-hidden="true" />
            )}
            <div>
              <h2>
                {ajustePendente ? 'Seu pedido de ajuste foi recebido.' : 'Nenhuma ação pendente.'}
              </h2>
              <p>
                {ajustePendente
                  ? 'O profissional vai revisar o pedido.'
                  : 'As novas entregas aparecerão aqui para você revisar.'}
              </p>
            </div>
          </div>
        )}
        <div className={layout.trabalho}>
          <ArquivosPortal codigo={codigo} projeto={projeto} />
          <PosEntregaPortal projeto={projeto} />
          <EntregasPortal projeto={projeto} />
        </div>
        <div className={layout.detalhes}>
          <details className={layout.grupoDetalhes}>
            <summary>
              <div>
                <strong>Sobre o projeto</strong>
                <span>Objetivo e combinados</span>
              </div>
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <div className={layout.grupoConteudo}>
              <p className={layout.resumoProjeto}>{projeto.resumo}</p>
              <p className={layout.inicioProjeto}>Iniciado em {dataPortal(projeto.inicioEm)}</p>
              <AcordoProjetoPortal briefing={projeto.briefing} />
              <ControleEscopoPortal codigo={codigo} mudancas={projeto.mudancasEscopo} />
            </div>
          </details>

          {(projeto.encerramento || (concluido && projeto.evolucao?.compartilharCliente)) && (
            <details className={layout.grupoDetalhes}>
              <summary>
                <div>
                  <strong>Resultados e aceite</strong>
                  <span>{concluido ? 'Encerramento do projeto' : 'Próximos passos'}</span>
                </div>
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <div className={layout.grupoConteudo}>
                {projeto.encerramento ? (
                  <div>
                    <TermoEncerramentoPortal encerramento={projeto.encerramento} />
                  </div>
                ) : null}

                {concluido && projeto.evolucao && (
                  <RevisaoResultadoPortal evolucao={projeto.evolucao} />
                )}
              </div>
            </details>
          )}
          {projeto.eventos.length > 0 && (
            <details className={layout.grupoDetalhes}>
              <summary>
                <div>
                  <strong>Histórico</strong>
                  <span>Decisões e atualizações</span>
                </div>
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <HistoricoPortal projeto={projeto} />
            </details>
          )}
        </div>
      </div>

      <footer className={layout.rodape}>
        <SubidoLogo size={16} />
        <span>Acesso protegido</span>
      </footer>
    </main>
  );
}
