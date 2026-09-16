'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, PencilLine } from 'lucide-react';
import { Button } from '@/design-system/via';
import { salvarVendaFicha } from '@/lib/crm/venda-actions';
import {
  vendaFichaSchema,
  type EntradaVendaFicha,
  type ResultadoVendaFicha,
} from '@/lib/crm/venda-schema';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import styles from './EditarContato.module.css';

type Falha = Extract<ResultadoVendaFicha, { ok: false }>;

export function EditarVenda({
  inicial,
  salvar = salvarVendaFicha,
}: {
  inicial: EntradaVendaFicha;
  salvar?: (entrada: EntradaVendaFicha) => Promise<ResultadoVendaFicha>;
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
              <Check size={16} aria-hidden="true" /> Venda salva
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
          <PencilLine size={18} aria-hidden="true" /> Editar venda
        </Button>
      </div>
      <ModalOperacao
        open={aberto}
        onClose={fechar}
        title="Editar venda"
        size="sm"
        blocked={pendente}
        description="Atualiza a ficha e o kanban. Propostas existentes não mudam."
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
            const validacao = vendaFichaSchema.safeParse(campos);
            if (!validacao.success) {
              const porCampo: Falha['porCampo'] = {};
              for (const problema of validacao.error.issues) {
                const campo = problema.path[0];
                if (campo === 'titulo' || campo === 'valor') porCampo[campo] ??= problema.message;
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
          {(['titulo', 'valor'] as const).map((campo) => (
            <label key={campo} className={styles.campo}>
              <span id={`${id}-${campo}-rotulo`}>
                {campo === 'titulo' ? 'Nome do projeto' : 'Valor previsto (R$)'}
              </span>
              <input
                name={campo}
                aria-labelledby={`${id}-${campo}-rotulo`}
                type="text"
                inputMode={campo === 'valor' ? 'decimal' : 'text'}
                autoComplete="off"

                maxLength={campo === 'titulo' ? 180 : 40}
                placeholder={campo === 'titulo' ? 'Nome do projeto' : 'Ex.: 12.500,00'}
                value={campos[campo]}
                disabled={pendente}
                data-autofocus={campo === 'titulo' || undefined}
                onChange={(evento) => {
                  setCampos({ ...campos, [campo]: evento.target.value });
                  if (falha?.porCampo?.[campo])
                    setFalha({ ...falha, porCampo: { ...falha.porCampo, [campo]: undefined } });
                }}
                aria-invalid={Boolean(falha?.porCampo?.[campo])}
                aria-describedby={
                  falha?.porCampo?.[campo]
                    ? `${id}-${campo}-erro`
                    : campo === 'valor'
                      ? `${id}-valor-ajuda`
                      : undefined
                }
              />
              {falha?.porCampo?.[campo] && (
                <small id={`${id}-${campo}-erro`}>{falha.porCampo[campo]}</small>
              )}
              {campo === 'valor' && (
                <small id={`${id}-valor-ajuda`}>Deixe vazio se ainda não definiu o valor.</small>
              )}
            </label>
          ))}
          {falha && (
            <p role="alert" tabIndex={-1} className={styles.erro}>
              {falha.erro}
            </p>
          )}
        </form>
      </ModalOperacao>
    </>
  );
}
