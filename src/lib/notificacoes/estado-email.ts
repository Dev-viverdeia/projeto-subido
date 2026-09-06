import type { StatusEmailEntrega } from './entrega';

export type RecuperacaoEmail = 'tentar' | 'corrigir' | 'verificar' | 'bloqueado' | 'nenhuma';

/** Apenas opções seguras chegam à interface; erros internos do provedor não. */
export function recuperacaoEmail(
  evento: {
    email_status: string;
    email_erro: string | null;
    email_tentativas: number;
    email_fingerprint: string | null;
    email_primeira_tentativa_em: string | null;
    email_atualizado_em: string | null;
  },
  agora = Date.now(),
): RecuperacaoEmail {
  if (['entregue', 'enviado', 'atrasado'].includes(evento.email_status)) return 'nenhuma';
  if (['reclamado', 'suprimido'].includes(evento.email_status)) return 'bloqueado';
  if (evento.email_status === 'devolvido') return 'corrigir';
  if (
    evento.email_status === 'nao_solicitado' ||
    ['envio_recusado', 'configuracao_indisponivel', 'destinatario_ausente'].includes(
      evento.email_erro ?? '',
    )
  )
    return 'tentar';
  if (
    evento.email_status === 'enviando' &&
    evento.email_atualizado_em &&
    agora - Date.parse(evento.email_atualizado_em) < 120_000
  )
    return 'nenhuma';
  if (
    !evento.email_fingerprint ||
    !evento.email_primeira_tentativa_em ||
    agora - Date.parse(evento.email_primeira_tentativa_em) >= 23 * 3_600_000
  )
    return 'bloqueado';
  return 'verificar';
}

export function tituloEmail(status: StatusEmailEntrega) {
  const titulos: Record<StatusEmailEntrega, string> = {
    nao_solicitado: 'Aviso por e-mail pendente',
    enviando: 'Enviando o aviso',
    enviado: 'E-mail enviado',
    entregue: 'Entrega confirmada',
    atrasado: 'E-mail a caminho',
    falhou: 'Envio não confirmado',
    devolvido: 'Endereço recusou o e-mail',
    reclamado: 'Envios interrompidos',
    suprimido: 'Envio bloqueado pelo provedor',
  };
  return titulos[status];
}
