'use client';

import { useFormStatus } from 'react-dom';
import { Check, CheckCircle2, ListChecks } from 'lucide-react';
import { aplicarPlanoCall } from '@/lib/calls/actions';
import { ETAPAS_MOVIMENTO_CRM, ROTULO_ETAPA, type EtapaCrm } from '@/lib/crm/etapas';
import styles from '../pagina.module.css';

function BotaoAplicar({ kickoff }: { kickoff: boolean }) {
  const { pending } = useFormStatus();

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

  return (
    <form action={aplicarPlanoCall} className={styles.formularioAcao} data-modo={modo}>
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
          defaultValue={acaoInicial}
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
          <input type="date" name="quando" defaultValue={dataInicial} />
        </label>
        {kickoff ? (
          <input type="hidden" name="etapa" value="manter" />
        ) : (
          <label>
            <span>Próxima etapa da venda</span>
            <select name="etapa" defaultValue={destinoInicial}>
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
                <input type="checkbox" name="compromissos" value={compromisso} defaultChecked />
                <span aria-hidden="true">
                  <Check size={13} />
                </span>
                <p>{compromisso}</p>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <footer className={styles.formularioRodape}>
        <small id="plano-call-ajuda">
          {kickoff
            ? 'Salva o próximo marco e os compromissos no histórico do cliente.'
            : 'Atualiza a próxima ação, a etapa da venda e os compromissos selecionados.'}
        </small>
        <BotaoAplicar kickoff={kickoff} />
      </footer>
    </form>
  );
}
