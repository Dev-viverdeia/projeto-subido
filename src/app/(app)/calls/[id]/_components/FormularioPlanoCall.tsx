'use client';

import { useFormStatus } from 'react-dom';
import { ArrowRight, Check, ListChecks, Sparkles } from 'lucide-react';
import { aplicarPlanoCall } from '@/lib/calls/actions';
import { ETAPAS_MOVIMENTO_CRM, ROTULO_ETAPA, type EtapaCrm } from '@/lib/crm/etapas';
import styles from '../pagina.module.css';

function BotaoAplicar() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined}>
      {pending ? 'Organizando a operação…' : 'Aplicar plano da call'}
      {pending ? (
        <Sparkles size={16} aria-hidden="true" />
      ) : (
        <ArrowRight size={16} aria-hidden="true" />
      )}
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
}: {
  reuniaoId: string;
  oportunidadeId: string;
  acaoInicial: string;
  dataInicial: string;
  etapaAtual: EtapaCrm;
  etapaSugerida: EtapaCrm;
  compromissos: string[];
}) {
  const destinoInicial = etapaSugerida === etapaAtual ? 'manter' : etapaSugerida;

  return (
    <form action={aplicarPlanoCall} className={styles.formularioAcao}>
      <input type="hidden" name="reuniao" value={reuniaoId} />
      <input type="hidden" name="oportunidade" value={oportunidadeId} />

      <header className={styles.formularioTopo}>
        <div>
          <span>
            <Sparkles size={14} aria-hidden="true" /> Plano recomendado pela IA
          </span>
          <p>Revise o essencial. Uma confirmação atualiza toda a jornada.</p>
        </div>
        <small>Você continua no controle</small>
      </header>

      <label className={styles.campoAcao}>
        <span>Próximo movimento</span>
        <textarea
          name="acao"
          rows={3}
          maxLength={500}
          defaultValue={acaoInicial}
          placeholder="Ex.: enviar diagnóstico revisado para o contato"
          aria-describedby="plano-call-ajuda"
          required
        />
      </label>

      <div className={styles.acaoCampos}>
        <label>
          <span>Data combinada</span>
          <input type="date" name="quando" defaultValue={dataInicial} />
        </label>
        <label>
          <span>Destino no pipeline</span>
          <select name="etapa" defaultValue={destinoInicial}>
            <option value="manter">Manter em {ROTULO_ETAPA[etapaAtual]}</option>
            {ETAPAS_MOVIMENTO_CRM.filter((etapa) => etapa.id !== etapaAtual).map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                Mover para {etapa.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      {compromissos.length > 0 && (
        <fieldset className={styles.compromissosCall}>
          <legend>
            <span>
              <ListChecks size={16} aria-hidden="true" /> Compromissos que entram no plano
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
          O resumo já está salvo. Aqui você confirma apenas as mudanças operacionais.
        </small>
        <BotaoAplicar />
      </footer>
    </form>
  );
}
