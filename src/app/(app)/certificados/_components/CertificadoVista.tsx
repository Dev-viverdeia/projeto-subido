'use client';

import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Link as LinkIcon,
  LoaderCircle,
  Printer,
  Share2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Alert, Button, Spinner } from '@/design-system/via';
import { avaliarCertificado } from '@/lib/certificados/criterios';
import { useProgresso, type EstadoProgressoConta } from '@/lib/progresso/local';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { DocumentoCertificado } from '@/components/certificados/DocumentoCertificado';
import styles from './CertificadoVista.module.css';
import { emitirCertificado } from '@/lib/certificados/actions';
import { CompartilharCertificado } from './CompartilharCertificado';
import { apresentacaoCertificado } from '@/lib/certificados/apresentacao';

/**
 * A FOLHA do certificado + as ações em volta dela.
 *
 * DocumentoCertificado mantém a mesma folha clara e as duas marcas oficiais
 * na galeria, na impressão A4 e no registro público. A moldura da interface
 * usa os tokens de vidro; o papel preserva contraste e legibilidade.
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
  aprendizadoIds,
  implementacaoIds,
  hrefConteudo,
  nome,
  codigoInicial,
  siteUrl,
  progressoPreview,
  imagemPreview,
  registroInicial,
}: {
  origem: 'formacao' | 'solucao';
  slug: string;
  titulo: string;
  aprendizadoIds: string[];
  implementacaoIds: string[];
  hrefConteudo: string;
  nome: string;
  codigoInicial: string | null;
  siteUrl: string;
  progressoPreview?: EstadoProgressoConta;
  imagemPreview?: string;
  registroInicial?: { nome: string; titulo: string; concluidoEm: string; emitidoEm: string };
}) {
  const progressoConta = useProgresso();
  const progresso = progressoPreview ?? progressoConta;
  const [codigo, setCodigo] = useState(codigoInicial);
  const [emitidoEm, setEmitidoEm] = useState(registroInicial?.emitidoEm ?? null);
  const [emitindo, setEmitindo] = useState(false);
  const [erroEmissao, setErroEmissao] = useState<string | null>(null);
  const [estadoEmissao, setEstadoEmissao] = useState<
    'fechado' | 'processando' | 'sucesso' | 'erro'
  >('fechado');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const compartilharRef = useRef<HTMLButtonElement>(null);

  function fecharCompartilhamento() {
    setCompartilhando(false);
    // Safari móvel não foca botões tocados. Retorna ao gatilho após desmontar o portal.
    window.requestAnimationFrame(() => compartilharRef.current?.focus());
  }

  const estado = avaliarCertificado(
    { aprendizadoIds, implementacaoIds },
    {
      aprendizado: origem === 'formacao' ? progresso.aulas : progresso.etapas,
      implementacao: progresso.etapas,
    },
  );

  const urlPublica = codigo ? `${siteUrl.replace(/\/$/, '')}/certificado/${codigo}` : null;
  const documento = registroInicial ?? {
    nome,
    titulo,
    concluidoEm: estado.concluidoEm,
    emitidoEm: estado.concluidoEm,
  };

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
    setEmitidoEm(resultado.emitidoEm ?? null);
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

  if (!estado.concluido) {
    const aprendizadoPendente = !estado.aprendizado.concluido;
    const proximaAcao = aprendizadoPendente
      ? origem === 'formacao'
        ? 'Concluir aulas'
        : 'Concluir aulas do projeto'
      : 'Continuar implementação';
    return (
      <div className={styles.pagina}>
        <div className={styles.acoes}>
          <BotaoVoltar fallback="/certificados" rotulo="Certificados" />
        </div>
        <div className={styles.pendencia}>
          <header className={styles.pendenciaCabecalho}>
            <div>
              <p className={styles.pendenciaEyebrow}>Certificado em andamento</p>
              <h1 className={styles.pendenciaTitulo}>{titulo}</h1>
            </div>
            <span className={styles.pendenciaPercentual}>{estado.percentual}%</span>
          </header>

          <div className={styles.criterios}>
            <article data-completo={estado.aprendizado.concluido || undefined}>
              <span className={styles.criterioIcone} aria-hidden="true">
                {estado.aprendizado.concluido ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </span>
              <div>
                <strong>{origem === 'formacao' ? 'Aulas da formação' : 'Aprendizado'}</strong>
                <p>
                  {estado.aprendizado.feitas}/{estado.aprendizado.total} aulas concluídas
                </p>
              </div>
              <span>{estado.aprendizado.concluido ? 'Concluído' : 'Pendente'}</span>
            </article>

            {estado.implementacao.total > 0 ? (
              <article data-completo={estado.implementacao.concluido || undefined}>
                <span className={styles.criterioIcone} aria-hidden="true">
                  {estado.implementacao.concluido ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </span>
                <div>
                  <strong>Implementação guiada</strong>
                  <p>
                    {estado.implementacao.feitas}/{estado.implementacao.total} passos concluídos
                  </p>
                </div>
                <span>{estado.implementacao.concluido ? 'Concluído' : 'Pendente'}</span>
              </article>
            ) : null}
          </div>

          <footer className={styles.pendenciaBase}>
            <p className={styles.pendenciaTexto}>
              {origem === 'formacao'
                ? 'O certificado será liberado quando todas as aulas estiverem concluídas.'
                : 'O certificado será liberado depois das aulas e de todos os passos da implementação.'}
            </p>
            <Link href={hrefConteudo} className={styles.pendenciaCta}>
              {proximaAcao}
            </Link>
          </footer>
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
                ref={compartilharRef}
                className={styles.linkedin}
                onClick={() => setCompartilhando(true)}
              >
                <Share2 size={16} strokeWidth={1.8} aria-hidden="true" />
                Compartilhar no LinkedIn
              </button>
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
            </>
          ) : (
            <button
              type="button"
              className={styles.linkedin}
              disabled={emitindo}
              onClick={() => void gerarLink()}
            >
              {emitindo ? (
                <LoaderCircle size={15} className={styles.girando} />
              ) : (
                <LinkIcon size={15} />
              )}
              {emitindo ? 'Preparando…' : 'Preparar para compartilhar'}
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

      <div className={styles.folha}>
        <DocumentoCertificado
          nome={documento.nome}
          titulo={documento.titulo}
          origem={origem}
          concluidoEm={documento.concluidoEm}
          codigo={codigo}
        />
      </div>
      <dl className={styles.resumoConclusao} aria-label="Critérios concluídos">
        <div>
          <dt>Aulas</dt>
          <dd>
            {estado.aprendizado.feitas}/{estado.aprendizado.total}
          </dd>
        </div>
        {estado.implementacao.total > 0 ? (
          <div>
            <dt>Implementação</dt>
            <dd>
              {estado.implementacao.feitas}/{estado.implementacao.total}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Registro público</dt>
          <dd>{codigo ? 'Disponível para compartilhar' : 'Prepare o link para compartilhar'}</dd>
        </div>
      </dl>

      {compartilhando && urlPublica && codigo ? (
        <CompartilharCertificado
          onClose={fecharCompartilhamento}
          titulo={documento.titulo}
          codigo={codigo}
          urlPublica={urlPublica}
          data={emitidoEm}
          imagemPreview={imagemPreview}
          demonstracao={apresentacaoCertificado(documento.nome).demonstracao}
        />
      ) : null}

      <ModalOperacao
        open={estadoEmissao !== 'fechado'}
        onClose={fecharEmissao}
        label="Certificados"
        hideClose={estadoEmissao === 'processando'}
        title={
          estadoEmissao === 'processando'
            ? 'Preparando para compartilhar'
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
                    <button
                      type="button"
                      className={styles.linkedin}
                      onClick={() => {
                        fecharEmissao();
                        setCompartilhando(true);
                      }}
                    >
                      <Share2 size={15} strokeWidth={1.8} aria-hidden="true" />
                      Compartilhar no LinkedIn
                    </button>
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
          <Alert tone="success" size="compact" title="Pronto para compartilhar">
            Seu link público foi criado e pode ser verificado por qualquer pessoa.
          </Alert>
        ) : erroEmissao ? (
          <Alert tone="danger" size="compact" title="O certificado não foi alterado">
            {erroEmissao}
          </Alert>
        ) : null}
      </ModalOperacao>
    </div>
  );
}
