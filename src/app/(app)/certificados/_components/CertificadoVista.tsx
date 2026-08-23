'use client';

import Link from 'next/link';
import { Check, Copy, Link as LinkIcon, LoaderCircle, Printer, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, Modal, Spinner } from '@/design-system/via';
import {
  contarConcluidas,
  contarEtapasFeitas,
  estadoDoProgresso,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { Visto } from '../../_components/PillEstado';
import { dataCurta } from '../../builder/_components/statusBuilder';
import styles from './CertificadoVista.module.css';
import { emitirCertificado } from '@/lib/certificados/actions';

/**
 * A FOLHA do certificado + as ações em volta dela.
 *
 * A folha é papel: superfície CLARA em proporção A4 paisagem, moldura dupla de
 * hairline navy, tinta navy e mono para os dados — imprime bonito e sem
 * desperdício (fundo navy em impressora é tanque de tinta; navegador costuma
 * descartar fundos de qualquer jeito). O navy fica na moldura da tela.
 *
 * "Salvar em PDF" é o diálogo de impressão do navegador (`window.print()`), e
 * o CSS de impressão isola a folha: tudo fica invisível menos ela, que assume
 * a página inteira em paisagem. A conclusão vem da conta e o código público só
 * nasce depois de uma segunda validação no servidor.
 *
 * CONCLUSÃO É DO CLIENTE: quem chega por URL a um conteúdo não concluído vê o
 * estado honesto com o progresso real e o caminho de volta.
 */
export function CertificadoVista({
  origem,
  slug,
  titulo,
  itemIds,
  hrefConteudo,
  nome,
  codigoInicial,
  siteUrl,
}: {
  origem: 'formacao' | 'solucao';
  slug: string;
  titulo: string;
  itemIds: string[];
  hrefConteudo: string;
  nome: string;
  codigoInicial: string | null;
  siteUrl: string;
}) {
  const progresso = useProgresso();
  const [codigo, setCodigo] = useState(codigoInicial);
  const [emitindo, setEmitindo] = useState(false);
  const [erroEmissao, setErroEmissao] = useState<string | null>(null);
  const [estadoEmissao, setEstadoEmissao] = useState<
    'fechado' | 'processando' | 'sucesso' | 'erro'
  >('fechado');
  const [linkCopiado, setLinkCopiado] = useState(false);

  const feitas =
    origem === 'formacao'
      ? contarConcluidas(progresso, itemIds)
      : contarEtapasFeitas(progresso, itemIds);
  const total = itemIds.length;
  const concluido = estadoDoProgresso(feitas, total) === 'concluida';

  const registro = origem === 'formacao' ? progresso.aulas : progresso.etapas;
  let ultimaIso: string | null = null;
  for (const id of itemIds) {
    const iso = registro[id];
    if (iso && (!ultimaIso || iso > ultimaIso)) ultimaIso = iso;
  }

  const rotuloOrigem = origem === 'formacao' ? 'formação' : 'projeto';
  const unidade = origem === 'formacao' ? 'aulas' : 'etapas';
  const urlPublica = codigo ? `${siteUrl.replace(/\/$/, '')}/certificado/${codigo}` : null;

  async function gerarLink() {
    setEmitindo(true);
    setErroEmissao(null);
    setEstadoEmissao('processando');
    setLinkCopiado(false);
    const resultado = await emitirCertificado(origem, slug);
    setEmitindo(false);
    if (!resultado.ok) {
      setErroEmissao(resultado.mensagem);
      setEstadoEmissao('erro');
      return;
    }
    setCodigo(resultado.codigo);
    setEstadoEmissao('sucesso');
  }

  async function copiarLink() {
    if (!urlPublica) return;
    try {
      await navigator.clipboard.writeText(urlPublica);
      setLinkCopiado(true);
      setErroEmissao(null);
    } catch {
      setErroEmissao('Não foi possível copiar o link. Abra o LinkedIn ou tente novamente.');
    }
  }

  function fecharEmissao() {
    if (estadoEmissao === 'processando') return;
    setEstadoEmissao('fechado');
  }

  if (!concluido) {
    const pct = percentual(feitas, total);
    return (
      <div className={styles.pagina}>
        <div className={styles.acoes}>
          <BotaoVoltar fallback="/certificados" rotulo="Certificados" />
        </div>
        <div className={styles.pendencia}>
          <p className={styles.pendenciaTitulo}>Este certificado ainda não está disponível.</p>
          <p className={styles.pendenciaTexto}>
            “{titulo}” está em {feitas}/{total} {unidade} ({pct}%). Conclua para o certificado ser
            emitido com a data de conclusão.
          </p>
          <Link href={hrefConteudo} className={styles.pendenciaCta}>
            Continuar de onde parou
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.acoes}>
        <BotaoVoltar fallback="/certificados" rotulo="Certificados" />
        <div className={styles.acoesCertificado}>
          {urlPublica ? (
            <>
              <button
                type="button"
                className={styles.compartilhar}
                onClick={() => void copiarLink()}
              >
                {linkCopiado ? (
                  <Check size={15} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Copy size={15} strokeWidth={1.8} aria-hidden="true" />
                )}
                {linkCopiado ? 'Link copiado' : 'Copiar link'}
              </button>
              <a
                className={styles.linkedin}
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlPublica)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 size={15} strokeWidth={1.8} aria-hidden="true" />
                Compartilhar no LinkedIn
              </a>
            </>
          ) : (
            <button
              type="button"
              className={styles.compartilhar}
              disabled={emitindo}
              onClick={() => void gerarLink()}
            >
              {emitindo ? (
                <LoaderCircle size={15} className={styles.girando} />
              ) : (
                <LinkIcon size={15} />
              )}
              {emitindo ? 'Gerando link…' : 'Gerar link público'}
            </button>
          )}
          <button type="button" className={styles.imprimir} onClick={() => window.print()}>
            <Printer size={15} strokeWidth={1.8} />
            Salvar em PDF
          </button>
        </div>
      </div>

      {erroEmissao ? (
        <p className={styles.erroEmissao} role="alert">
          {erroEmissao}
        </p>
      ) : null}

      {/* A FOLHA — o que sai na impressão é exatamente isto. */}
      <article className={styles.folha} aria-label={`Certificado de ${titulo}`}>
        <span className={styles.molduraExterna} aria-hidden="true" />
        <span className={styles.molduraInterna} aria-hidden="true" />

        <div className={styles.folhaMiolo}>
          <header className={styles.folhaTopo}>
            <span className={styles.marca}>subido</span>
            <span className={styles.selo}>
              <Visto tamanho={14} />
            </span>
          </header>

          <div className={styles.folhaCentro}>
            <p className={styles.eyebrow}>Certificado de conclusão · {rotuloOrigem}</p>
            <p className={styles.certificamos}>Certificamos que</p>
            <p className={styles.nome}>{nome}</p>
            <p className={styles.concluiu}>
              concluiu {origem === 'formacao' ? 'a formação' : 'a implementação do projeto'}
            </p>
            <h1 className={styles.tituloConteudo}>{titulo}</h1>
          </div>

          <footer className={styles.folhaBase}>
            <div className={styles.dado}>
              <span className={styles.dadoRotulo}>Concluído em</span>
              <span className={styles.dadoValor}>{ultimaIso ? dataCurta(ultimaIso) : '—'}</span>
            </div>
            <div className={styles.dado}>
              <span className={styles.dadoRotulo}>{unidade}</span>
              <span className={styles.dadoValor}>
                {feitas}/{total}
              </span>
            </div>
            <p className={styles.origem}>Registro da conta · plataforma Subido</p>
            {codigo ? <p className={styles.codigo}>Verificação · {codigo}</p> : null}
          </footer>
        </div>
      </article>

      <Modal
        open={estadoEmissao !== 'fechado'}
        onClose={fecharEmissao}
        hideClose={estadoEmissao === 'processando'}
        title={
          estadoEmissao === 'processando'
            ? 'Preparando seu certificado'
            : estadoEmissao === 'sucesso'
              ? 'Certificado pronto para compartilhar'
              : 'Não foi possível gerar o link'
        }
        size="sm"
        footer={
          estadoEmissao === 'processando' ? undefined : (
            <div className={styles.modalAcoes}>
              {estadoEmissao === 'erro' ? (
                <>
                  <Button variant="secondary" onClick={fecharEmissao}>
                    Fechar
                  </Button>
                  <Button variant="primary" onClick={() => void gerarLink()}>
                    Tentar novamente
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => void copiarLink()}>
                    {linkCopiado ? 'Link copiado' : 'Copiar link'}
                  </Button>
                  {urlPublica ? (
                    <a
                      className={styles.linkedin}
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlPublica)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Share2 size={15} strokeWidth={1.8} aria-hidden="true" />
                      Compartilhar no LinkedIn
                    </a>
                  ) : null}
                </>
              )}
            </div>
          )
        }
      >
        {estadoEmissao === 'processando' ? (
          <div className={styles.estadoEmissao} aria-live="polite">
            <Spinner size="lg" label="Validando sua conclusão…" />
            <p>Estamos registrando o certificado e criando o link público de verificação.</p>
          </div>
        ) : estadoEmissao === 'sucesso' ? (
          <Alert tone="success" size="compact" title="Link público criado">
            O certificado pode ser aberto por qualquer pessoa e já está pronto para o LinkedIn.
          </Alert>
        ) : erroEmissao ? (
          <Alert tone="danger" size="compact" title="O certificado não foi alterado">
            {erroEmissao}
          </Alert>
        ) : null}
      </Modal>
    </div>
  );
}
