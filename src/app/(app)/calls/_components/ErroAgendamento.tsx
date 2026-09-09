import type { EstadoAgendamento } from '@/lib/calls/actions';
import { AjudaNaFalha } from '@/components/suporte/AjudaNaFalha';

export function ErroAgendamento({
  estado,
  conectarHref,
  guardarRascunho,
}: {
  estado: EstadoAgendamento;
  conectarHref: string;
  guardarRascunho: () => void;
}) {
  if (!estado.erro) return null;
  return (
    <AjudaNaFalha
      contexto={estado.reconectar ? 'agenda' : 'reuniao'}
      pagina="/reunioes"
      titulo={
        estado.reconectar
          ? 'Reconecte sua agenda'
          : estado.entrar
            ? 'Entre novamente'
            : 'Confira o agendamento'
      }
      descricao={estado.erro}
      acao={
        estado.reconectar ? (
          <a href={conectarHref} onClick={guardarRascunho}>
            Reconectar agenda
          </a>
        ) : estado.entrar ? (
          <a href="/entrar" target="_blank" rel="noopener noreferrer">
            Entrar novamente
          </a>
        ) : estado.conferir ? (
          <a href="/reunioes" target="_blank" rel="noopener noreferrer">
            Ver reuniões
          </a>
        ) : undefined
      }
    />
  );
}
