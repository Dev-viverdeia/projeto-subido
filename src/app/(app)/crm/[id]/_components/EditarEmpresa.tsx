'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, PencilLine } from 'lucide-react';
import { Button } from '@/design-system/via';
import { salvarEmpresaFicha } from '@/lib/crm/empresa-actions';
import {
  empresaFichaSchema,
  type EntradaEmpresaFicha,
  type ResultadoEmpresaFicha,
} from '@/lib/crm/empresa-schema';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import styles from './EditarContato.module.css';

type Falha = Extract<ResultadoEmpresaFicha, { ok: false }>;

export function EditarEmpresa({
  inicial,
  salvar = salvarEmpresaFicha,
}: {
  inicial: EntradaEmpresaFicha;
  salvar?: (entrada: EntradaEmpresaFicha) => Promise<ResultadoEmpresaFicha>;
}) {
  const router = useRouter();
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const botaoEditar = useRef<HTMLButtonElement>(null);
  const enviando = useRef(false);
  const [aberto, setAberto] = useState(false);
  const [campos, setCampos] = useState(inicial);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, iniciar] = useTransition();
  useEffect(() => {
    if (!salvo || pendente) return;
    // A atualização da ficha pode substituir o gatilho após o modal devolver o foco.
    const quadro = window.requestAnimationFrame(() => {
      if (document.activeElement === document.body)
        botaoEditar.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [salvo, pendente]);
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
              <Check size={16} aria-hidden="true" /> Empresa salva
            </>
          )}
        </span>
        <Button
          ref={botaoEditar}
          type="button"
          variant="secondary"
          aria-haspopup="dialog"
          onClick={(evento) => {
            evento.currentTarget.focus();
            setCampos(inicial);
            setFalha(null);
            setSalvo(false);
            setAberto(true);
          }}
        >
          <PencilLine size={18} aria-hidden="true" /> Editar empresa
        </Button>
      </div>
      <ModalOperacao
        open={aberto}
        onClose={fechar}
        title="Empresa"
        size="sm"
        blocked={pendente}
        description="Atualiza as fichas deste cliente. Propostas e convites enviados não mudam."
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
            const validacao = empresaFichaSchema.safeParse(campos);
            if (!validacao.success) {
              const porCampo: Falha['porCampo'] = {};
              for (const problema of validacao.error.issues) {
                const campo = problema.path[0];
                if (campo === 'nome' || campo === 'site') porCampo[campo] ??= problema.message;
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
          {(['nome', 'site'] as const).map((campo) => (
            <label key={campo} className={styles.campo}>
              <span id={`${id}-${campo}-rotulo`}>
                {campo === 'nome' ? 'Nome da empresa' : 'Site (opcional)'}
              </span>
              <input
                name={campo}
                aria-labelledby={`${id}-${campo}-rotulo`}
                type="text"
                inputMode={campo === 'site' ? 'url' : 'text'}
                autoComplete={campo === 'nome' ? 'organization' : 'url'}
                autoCapitalize={campo === 'site' ? 'none' : undefined}
                maxLength={campo === 'nome' ? 160 : 2048}
                placeholder={campo === 'nome' ? 'Nome da empresa' : 'empresa.com.br'}
                value={campos[campo]}
                disabled={pendente}
                data-autofocus={campo === 'nome' || undefined}
                onChange={(evento) => {
                  setCampos({ ...campos, [campo]: evento.target.value });
                  if (falha?.porCampo?.[campo])
                    setFalha({ ...falha, porCampo: { ...falha.porCampo, [campo]: undefined } });
                }}
                aria-invalid={Boolean(falha?.porCampo?.[campo])}
                aria-describedby={
                  falha?.porCampo?.[campo]
                    ? `${id}-${campo}-erro`
                    : campo === 'site'
                      ? `${id}-site-ajuda`
                      : undefined
                }
              />
              {falha?.porCampo?.[campo] && (
                <small id={`${id}-${campo}-erro`}>{falha.porCampo[campo]}</small>
              )}
              {campo === 'site' && (
                <small id={`${id}-site-ajuda`}>
                  Pode colar o link completo. Salvamos apenas o domínio.
                </small>
              )}
            </label>
          ))}
          {falha && (
            <p role="alert" tabIndex={-1} className={styles.erro}>
              {falha.erro}
            </p>
          )}
          <p className={styles.nota}>Sem custo de créditos. A pesquisa existente não é refeita.</p>
        </form>
      </ModalOperacao>
    </>
  );
}
