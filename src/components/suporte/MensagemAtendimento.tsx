import { Download, LockKeyhole } from 'lucide-react';
import type { MensagemSuporte } from '@/lib/suporte/contrato';
import s from './suporte.module.css';

export function MensagemAtendimento({
  mensagem: m,
  equipe,
  publico,
  atendimento,
}: {
  mensagem: MensagemSuporte;
  equipe: boolean;
  publico: boolean;
  atendimento: string;
}) {
  if (m.papel === 'sistema') return <p className={s.sistema}>{m.texto}</p>;
  return (
    <article className={s.mensagem} data-papel={m.papel} data-interna={m.interna}>
      <div className={s.autorMensagem}>
        <strong>
          {m.interna && <LockKeyhole size={15} aria-hidden="true" />}
          {m.interna
            ? 'Nota interna · só a equipe vê'
            : m.papel === 'equipe'
              ? m.nome_autor || 'Equipe Subido'
              : equipe
                ? 'Usuário'
                : 'Você'}
        </strong>
        <time className={s.meta} dateTime={m.criado_em}>
          {new Date(m.criado_em).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
          })}
        </time>
      </div>
      {m.canal === 'email' && <span className={s.meta}>Recebida por e-mail</span>}
      <p>{m.texto}</p>
      {m.arquivos.length > 0 && (
        <div className={s.anexos}>
          {m.arquivos.map((a) => (
            <a
              className={s.arquivo}
              key={a.id}
              href={`/api/suporte/anexos/${a.id}${publico ? `?atendimento=${atendimento}` : ''}`}
            >
              <Download size={16} />
              <span>{a.nome}</span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
