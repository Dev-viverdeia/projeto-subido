'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Building2, ContactRound, Database, Globe2, Layers3, X } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { iniciarEnriquecimento } from '@/lib/crm/invocar-enriquecimento';
import { EsperaOperacao } from '../../../_components/EsperaOperacao';
import styles from './FormularioEnriquecimento.module.css';

const ETAPAS_PESQUISA = [
  {
    titulo: 'Preparando a pesquisa',
    descricao: 'Estamos validando os dados informados e iniciando a busca nas fontes públicas.',
  },
] as const;

export function FormularioEnriquecimento({
  oportunidadeId,
  dominioInicial,
  linkedinInicial,
  temDossie,
  rotulo,
  abertoInicial = false,
}: {
  oportunidadeId: string;
  dominioInicial: string | null;
  linkedinInicial: string | null;
  temDossie: boolean;
  rotulo?: string;
  abertoInicial?: boolean;
}) {
  const router = useRouter();
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) painel.current?.querySelector<HTMLElement>('input')?.focus();
  }, [aberto]);

  function fechar() {
    if (enviando) return;
    setAberto(false);
    setErro(null);
    requestAnimationFrame(() => gatilho.current?.focus());
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    const dados = new FormData(evento.currentTarget);
    const texto = (nome: string) => {
      const valor = dados.get(nome);
      return typeof valor === 'string' ? valor.trim() : '';
    };
    const dominio = texto('dominio');
    const linkedin = texto('linkedin');
    const contexto = texto('contexto');
    if (!dominio && !contexto) {
      setErro('Informe o site da empresa ou escreva o que você já sabe sobre ela.');
      return;
    }

    setEnviando(true);
    const resposta = await iniciarEnriquecimento({
      oportunidade_id: oportunidadeId,
      dominio: dominio || undefined,
      linkedin_url: linkedin || undefined,
      contexto: contexto || undefined,
    });
    setEnviando(false);
    if (resposta.falha) {
      setErro(resposta.falha);
      return;
    }

    setAberto(false);
    router.refresh();
  }

  return (
    <>
      {enviando && (
        <EsperaOperacao
          aberto
          rotulo="Pesquisa comercial"
          titulo="Iniciando a pesquisa"
          descricao="Estamos organizando o contexto desta oportunidade antes de consultar as fontes."
          etapas={ETAPAS_PESQUISA}
        />
      )}
      <button
        ref={gatilho}
        type="button"
        className={`via-btn ${temDossie ? 'via-btn--secondary' : 'via-btn--primary'} via-btn--md ${styles.gatilho}`}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
      >
        <Layers3 size={16} strokeWidth={1.9} aria-hidden="true" />
        {rotulo ?? (temDossie ? 'Atualizar pesquisa' : 'Pesquisar empresa')}
      </button>

      {aberto && (
        <div
          className={styles.scrim}
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) fechar();
          }}
        >
          <div
            ref={painel}
            className={styles.dialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enriquecimento-titulo"
            onKeyDown={(evento) => {
              if (evento.key === 'Escape') fechar();
              if (evento.key !== 'Tab') return;
              const focaveis = painel.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
              );
              if (!focaveis?.length) return;
              const primeiro = focaveis[0];
              const ultimo = focaveis[focaveis.length - 1];
              if (evento.shiftKey && document.activeElement === primeiro) {
                evento.preventDefault();
                ultimo?.focus();
              } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primeiro?.focus();
              }
            }}
          >
            <header className={styles.topo}>
              <div>
                <p className={styles.sobretitulo}>Pesquisa comercial</p>
                <h2 id="enriquecimento-titulo">Pesquisar esta empresa</h2>
                <p>
                  Juntamos o que já está no CRM com fontes públicas para preparar sua próxima
                  conversa. Fatos e hipóteses aparecem separados.
                </p>
              </div>
              <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar">
                <X size={19} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.fontes} aria-label="Fontes usadas na análise">
              <span>
                <Database size={15} aria-hidden="true" /> CRM e calls
              </span>
              <span>
                <Globe2 size={15} aria-hidden="true" /> Site público
              </span>
              <span>
                <Building2 size={15} aria-hidden="true" /> Suas informações
              </span>
            </div>

            <form className={styles.formulario} onSubmit={(evento) => void enviar(evento)}>
              {erro && (
                <Alert tone="danger" size="compact">
                  {erro}
                </Alert>
              )}

              <Input
                id="enriquecimento-dominio"
                name="dominio"
                label="Site da empresa"
                placeholder="empresa.com.br"
                defaultValue={dominioInicial ?? ''}
                hint="Usamos apenas conteúdo público do site."
                inputMode="url"
              />

              <Input
                id="enriquecimento-linkedin"
                name="linkedin"
                label="LinkedIn do contato"
                placeholder="https://www.linkedin.com/in/..."
                defaultValue={linkedinInicial ?? ''}
                hint="Opcional. Ajuda a identificar o papel dessa pessoa na decisão."
                iconLeft={<ContactRound size={16} strokeWidth={1.8} />}
                inputMode="url"
              />

              <label className={styles.campoTexto} htmlFor="enriquecimento-contexto">
                <span>Contexto que você já tem</span>
                <textarea
                  id="enriquecimento-contexto"
                  name="contexto"
                  rows={5}
                  maxLength={4000}
                  placeholder="Ex.: chegou por indicação, quer reduzir o tempo de resposta e usa WhatsApp no atendimento."
                />
                <small>
                  Opcional. Quanto mais concreto o contexto, melhores serão as perguntas.
                </small>
              </label>

              <div className={styles.acoes}>
                <Button type="button" variant="secondary" onClick={fechar} disabled={enviando}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={enviando}>
                  Começar pesquisa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
