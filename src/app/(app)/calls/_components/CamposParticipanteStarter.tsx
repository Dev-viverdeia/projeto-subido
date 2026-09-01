import { Input } from '@/design-system/via';
import type { EstadoAgendamento } from '@/lib/calls/actions';
import styles from './FormularioAgendarCall.module.css';

export function CamposParticipanteStarter({
  campos,
  erroEmpresa,
  erroContato,
  aoEditarEmpresa,
  aoEditarContato,
}: {
  campos?: EstadoAgendamento['campos'];
  erroEmpresa?: string;
  erroContato?: string;
  aoEditarEmpresa: () => void;
  aoEditarContato: () => void;
}) {
  return (
    <div className={styles.duasColunas}>
      <Input
        id="calls-empresa"
        data-autofocus
        name="empresa"
        label="Empresa"
        placeholder="Ex.: Clínica Horizonte"
        defaultValue={campos?.empresa ?? ''}
        error={erroEmpresa}
        onChange={aoEditarEmpresa}
        required
      />
      <Input
        id="calls-contato"
        name="contato"
        label="Pessoa convidada"
        placeholder="Ex.: Marina Costa"
        defaultValue={campos?.contato ?? ''}
        error={erroContato}
        onChange={aoEditarContato}
        required
      />
      <input type="hidden" name="oportunidade" value="" />
    </div>
  );
}
