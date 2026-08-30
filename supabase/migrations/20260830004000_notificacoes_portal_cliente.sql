-- Rastreabilidade das notificações transacionais do Portal do Cliente.
-- O evento de negócio continua sendo a fonte da verdade; o e-mail é um efeito
-- observável e repetível, sem apagar a decisão caso o provedor fique indisponível.

begin;

alter table public.projeto_portal_eventos
  add column email_destinatario text,
  add column email_assunto text,
  add column email_provider_id text,
  add column email_status text not null default 'nao_solicitado',
  add column email_tentativas integer not null default 0,
  add column email_erro text,
  add column email_enviado_em timestamptz,
  add column email_entregue_em timestamptz,
  add column email_atualizado_em timestamptz;

alter table public.projeto_portal_eventos
  add constraint projeto_portal_eventos_email_status_valido
    check (email_status in (
      'nao_solicitado',
      'enviando',
      'enviado',
      'entregue',
      'atrasado',
      'falhou',
      'devolvido',
      'reclamado',
      'suprimido'
    )),
  add constraint projeto_portal_eventos_email_destinatario_tamanho
    check (email_destinatario is null or char_length(email_destinatario) <= 320),
  add constraint projeto_portal_eventos_email_assunto_tamanho
    check (email_assunto is null or char_length(email_assunto) <= 240),
  add constraint projeto_portal_eventos_email_erro_tamanho
    check (email_erro is null or char_length(email_erro) <= 500),
  add constraint projeto_portal_eventos_email_tentativas_valida
    check (email_tentativas >= 0);

create unique index projeto_portal_eventos_email_provider_unico
  on public.projeto_portal_eventos (email_provider_id)
  where email_provider_id is not null;

comment on column public.projeto_portal_eventos.email_status is
  'Estado observável da notificação no Resend; nunca substitui o evento de negócio.';
comment on column public.projeto_portal_eventos.email_provider_id is
  'Identificador retornado pelo provedor, usado para conciliar webhooks idempotentes.';

commit;
