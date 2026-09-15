'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, PencilLine, Plus } from 'lucide-react';
import { Button } from '@/design-system/via';
import { salvarContatoFicha } from '@/lib/crm/contato-actions';
import {
  contatoFichaSchema,
  type EntradaContatoFicha,
  type ResultadoContatoFicha,
} from '@/lib/crm/contato-schema';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import styles from './EditarContato.module.css';

type Falha = Extract<ResultadoContatoFicha, { ok: false }>;

export function EditarContato({
  inicial,
  salvar = salvarContatoFicha,
}: {
  inicial: EntradaContatoFicha;
  salvar?: (entrada: EntradaContatoFicha) => Promise<ResultadoContatoFicha>;
}) {
  const router = useRouter();
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const enviando = useRef(false);
  const [aberto, setAberto] = useState(false);
  const [campos, setCampos] = useState(inicial);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, iniciar] = useTransition();
  const fechar = () => {
    if (!enviando.current) setAberto(false);
  };
  const focarErro = () =>
    window.requestAnimationFrame(() =>
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus(),
    );

  return (
    <>
      <div className={styles.entrada}>
        <span role="status" className={styles.sucesso}>
          {salvo && (
            <>
              <Check size={16} aria-hidden="true" /> Contato salvo
            </>
          )}
        </span>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={(evento) => {
            evento.currentTarget.focus();
            setCampos({
              ...inicial,
              nome: inicial.nome === 'Contato a identificar' ? '' : inicial.nome,
            });
            setFalha(null);
            setSalvo(false);
            setAberto(true);
          }}
        >
          {inicial.contatoId ? (
            <PencilLine size={18} aria-hidden="true" />
          ) : (
            <Plus size={18} aria-hidden="true" />
          )}
          {inicial.contatoId ? 'Editar contato' : 'Adicionar contato'}
        </button>
      </div>
      <ModalOperacao
        open={aberto}
        onClose={fechar}
        title="Contato principal"
        size="sm"
        description="Atualiza o contato nas fichas deste cliente. Convites enviados não mudam."
        blocked={pendente}
        footer={
          <>
            <Button type="button" variant="secondary" disabled={pendente} onClick={fechar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={id}
              loading={pendente}
              disabled={pendente || Boolean(falha?.conflito)}
            >
              {pendente ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </>
        }
      >
        <form
          ref={form}
          id={id}
          noValidate
          aria-busy={pendente}
          className={styles.formulario}
          onSubmit={(evento) => {
            evento.preventDefault();
            if (enviando.current || falha?.conflito) return;
            const validacao = contatoFichaSchema.safeParse(campos);
            if (!validacao.success) {
              const porCampo: Falha['porCampo'] = {};
              for (const problema of validacao.error.issues) {
                const campo = problema.path[0];
                if (campo === 'nome' || campo === 'telefone' || campo === 'email')
                  porCampo[campo] ??= problema.message;
              }
              setFalha({ ok: false, erro: 'Revise os campos antes de salvar.', porCampo });
              focarErro();
              return;
            }
            enviando.current = true;
            setFalha(null);
            iniciar(async () => {
              try {
                const resultado = await salvar(validacao.data);
                if (resultado.ok) {
                  setAberto(false);
                  setSalvo(true);
                } else {
                  setFalha(resultado);
                  focarErro();
                  if (resultado.conflito) router.refresh();
                }
              } catch {
                setFalha({
                  ok: false,
                  erro: 'Não conseguimos confirmar a gravação. Seus campos continuam aqui; tente salvar novamente.',
                });
                focarErro();
              } finally {
                enviando.current = false;
              }
            });
          }}
        >
          {(['nome', 'telefone', 'email'] as const).map((campo) => (
            <label key={campo} className={styles.campo}>
              <span id={`${id}-${campo}-rotulo`}>
                {campo === 'nome' ? 'Nome' : campo === 'telefone' ? 'Telefone' : 'E-mail'}
              </span>
              <input
                name={campo}
                aria-labelledby={`${id}-${campo}-rotulo`}
                type={campo === 'telefone' ? 'tel' : campo === 'email' ? 'email' : 'text'}
                autoComplete={campo === 'nome' ? 'name' : campo === 'telefone' ? 'tel' : 'email'}
                maxLength={campo === 'nome' ? 160 : campo === 'telefone' ? 80 : 254}
                placeholder={
                  campo === 'nome'
                    ? 'Nome da pessoa, se souber'
                    : campo === 'telefone'
                      ? '(11) 99999-0000'
                      : 'nome@empresa.com.br'
                }
                value={campos[campo]}
                disabled={pendente}
                onChange={(evento) => {
                  setCampos({ ...campos, [campo]: evento.target.value });
                  if (falha?.porCampo?.[campo])
                    setFalha({ ...falha, porCampo: { ...falha.porCampo, [campo]: undefined } });
                }}
                data-autofocus={campo === 'nome' || undefined}
                aria-invalid={Boolean(falha?.porCampo?.[campo])}
                aria-describedby={falha?.porCampo?.[campo] ? `${id}-${campo}-erro` : undefined}
              />
              {falha?.porCampo?.[campo] && (
                <small id={`${id}-${campo}-erro`}>{falha.porCampo[campo]}</small>
              )}
            </label>
          ))}
          {falha && (
            <p role="alert" tabIndex={-1} className={styles.erro}>
              {falha.erro}
            </p>
          )}
          <p className={styles.nota}>Outros canais da empresa são preservados.</p>
        </form>
      </ModalOperacao>
    </>
  );
}
