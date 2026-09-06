'use client';

import { startTransition, useActionState, useState } from 'react';
import { Check, CheckCircle2, ListChecks } from 'lucide-react';
import { salvarPlanoCall, type EstadoPlanoCall } from '@/lib/calls/plano-actions';
import { RetornoOperacao } from '../../../_components/RetornoOperacao';
import { ETAPAS_MOVIMENTO_CRM, ROTULO_ETAPA, type EtapaCrm } from '@/lib/crm/etapas';
import styles from '../pagina.module.css';

function BotaoAplicar({ kickoff, pending }: { kickoff: boolean; pending: boolean }) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined}>
      {pending
        ? kickoff
          ? 'Salvando próximos passos…'
          : 'Atualizando a venda…'
        : kickoff
          ? 'Salvar próximos passos'
          : 'Confirmar e atualizar a venda'}
      {!pending && <CheckCircle2 size={16} aria-hidden="true" />}
    </button>
  );
}

export function FormularioPlanoCall({
  reuniaoId,
  oportunidadeId,
  acaoInicial,
  dataInicial,
  etapaAtual,
  etapaSugerida,
  compromissos,
  modo = 'venda',
}: {
  reuniaoId: string;
  oportunidadeId: string;
  acaoInicial: string;
  dataInicial: string;
  etapaAtual: EtapaCrm;
  etapaSugerida: EtapaCrm;
  compromissos: string[];
  modo?: 'venda' | 'kickoff';
}) {
  const kickoff = modo === 'kickoff';
  const destinoInicial = etapaSugerida === etapaAtual ? 'manter' : etapaSugerida;
  const [acao, setAcao] = useState(acaoInicial);
  const [quando, setQuando] = useState(dataInicial);
  const [etapa, setEtapa] = useState<string>(destinoInicial);
  const [selecionados, setSelecionados] = useState(compromissos);
  const [editado, setEditado] = useState(false);
  const [estado, salvar, pendente] = useActionState<EstadoPlanoCall, FormData>(
    async (anterior, dados) => {
      try {
        const resultado = await salvarPlanoCall(anterior, dados);
        setEditado(false);
        return resultado;
      } catch {
        return {
          tituloErro: 'Salvamento não confirmado',
          erro: 'Não conseguimos confirmar o salvamento. Sua revisão continua aqui; tente novamente.',
        };
      }
    },
    {},
  );

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        if (pendente) return;
        const dados = new FormData(evento.currentTarget);
        startTransition(() => salvar(dados));
      }}
      className={styles.formularioAcao}
      data-modo={modo}
      onChange={() => setEditado(true)}
    >
      <input type="hidden" name="reuniao" value={reuniaoId} />
      <input type="hidden" name="oportunidade" value={oportunidadeId} />

      <header className={styles.formularioTopo}>
        <div>
          <span>{kickoff ? 'Próximos passos' : 'Revisão antes de salvar'}</span>
          <p>
            {kickoff
              ? 'Ajuste o próximo marco antes de revisar o acordo.'
              : 'A IA sugere. Você ajusta e confirma.'}
          </p>
        </div>
        <small>Você confirma</small>
      </header>

      <label className={styles.campoAcao}>
        <span>{kickoff ? 'Próximo marco do projeto' : 'Próxima ação da venda'}</span>
        <textarea
          name="acao"
          rows={3}
          maxLength={500}
          value={acao}
          onChange={(evento) => setAcao(evento.target.value)}
          disabled={pendente}
          minLength={3}
          placeholder={
            kickoff
              ? 'Ex.: liberar os acessos necessários para iniciar'
              : 'Ex.: enviar o resumo revisado para o contato'
          }
          aria-describedby="plano-call-ajuda"
          required
        />
      </label>

      <div className={styles.acaoCampos}>
        <label>
          <span>Data combinada</span>
          <input
            type="date"
            name="quando"
            value={quando}
            onChange={(evento) => setQuando(evento.target.value)}
            disabled={pendente}
          />
        </label>
        {kickoff ? (
          <input type="hidden" name="etapa" value="manter" />
        ) : (
          <label>
            <span>Próxima etapa da venda</span>
            <select
              name="etapa"
              value={etapa}
              onChange={(evento) => setEtapa(evento.target.value)}
              disabled={pendente}
            >
              <option value="manter">Manter em {ROTULO_ETAPA[etapaAtual]}</option>
              {ETAPAS_MOVIMENTO_CRM.filter((etapa) => etapa.id !== etapaAtual).map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  Mover para {etapa.rotulo}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {compromissos.length > 0 && (
        <fieldset className={styles.compromissosCall}>
          <legend>
            <span>
              <ListChecks size={16} aria-hidden="true" />{' '}
              {kickoff ? 'Compromissos do kickoff' : 'Compromissos que serão salvos'}
            </span>
            <small>{compromissos.length} detectados</small>
          </legend>
          <div>
            {compromissos.map((compromisso, indice) => (
              <label key={`${compromisso}-${indice}`}>
                <input
                  type="checkbox"
                  name="compromissos"
                  value={compromisso}
                  checked={selecionados.includes(compromisso)}
                  disabled={pendente}
                  onChange={(evento) => {
                    const marcado = evento.target.checked;
                    setSelecionados((atuais) =>
                      marcado
                        ? [...atuais, compromisso]
                        : atuais.filter((item) => item !== compromisso),
                    );
                  }}
                />
                <span aria-hidden="true">
                  <Check size={13} />
                </span>
                <p>{compromisso}</p>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {estado.erro && !pendente && (
        <RetornoOperacao
          tom="erro"
          titulo={estado.tituloErro ?? 'O plano não foi salvo'}
          descricao={estado.erro}
        />
      )}
      {estado.sucesso && !editado && !pendente && (
        <RetornoOperacao tom="sucesso" titulo={estado.sucesso} />
      )}

      <footer className={styles.formularioRodape}>
        <small id="plano-call-ajuda">
          {kickoff
            ? 'Salva o próximo marco e os compromissos no histórico do cliente.'
            : 'Atualiza a próxima ação, a etapa da venda e os compromissos selecionados.'}
        </small>
        <BotaoAplicar kickoff={kickoff} pending={pendente} />
      </footer>
    </form>
  );
}
