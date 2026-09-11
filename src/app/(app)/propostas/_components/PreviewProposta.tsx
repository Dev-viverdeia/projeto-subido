import { Check, Pencil } from 'lucide-react';
import Image from 'next/image';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { StatusProposta } from '@/lib/propostas/queries';
import { subtituloVisivel } from '@/lib/propostas/apresentacao';
import { formatarReais, type DocumentoProposta } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import styles from './PreviewProposta.module.css';

function dataDocumento(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

function EditarTrecho({
  secao,
  nome,
  onEditar,
}: {
  secao: string;
  nome: string;
  onEditar?: (secao: string) => void;
}) {
  if (!onEditar) return null;
  return (
    <button
      type="button"
      className={styles.editar}
      aria-label={`Editar ${nome} na proposta`}
      onClick={() => onEditar(secao)}
    >
      <Pencil size={14} aria-hidden="true" /> Editar
    </button>
  );
}

export function PreviewProposta({
  documento,
  titulo,
  versao,
  status,
  sujo,
  referenciaEm,
  onEditar,
}: {
  documento: DocumentoProposta;
  titulo: string;
  versao: number;
  status: StatusProposta;
  sujo: boolean;
  referenciaEm: string;
  onEditar?: (secao: string) => void;
}) {
  const subtitulo = subtituloVisivel(titulo, documento.projeto.titulo);

  return (
    <div className={styles.moldura} aria-label="Prévia visual da proposta">
      <div className={styles.molduraTopo} data-cabecalho-preview>
        <strong>Prévia da proposta</strong>
        <span className={styles.estadoPreview} data-sujo={sujo || undefined} aria-live="polite">
          {sujo ? 'Alterações não salvas' : 'Versão salva'}
        </span>
      </div>

      <article className={styles.papel}>
        <header className={styles.capa} data-secao-preview="cliente">
          <div className={styles.marcaLinha}>
            <div className={styles.marca}>
              {documento.fornecedor?.logoUrl ? (
                <Image
                  src={documento.fornecedor.logoUrl}
                  alt={documento.fornecedor.nomeNegocio ?? documento.fornecedor.nomeResponsavel}
                  width={112}
                  height={36}
                  unoptimized
                  className={styles.logoFornecedor}
                />
              ) : documento.fornecedor ? (
                <strong>
                  {documento.fornecedor.nomeNegocio ?? documento.fornecedor.nomeResponsavel}
                </strong>
              ) : (
                <SubidoLogo size={14} variant="mono" />
              )}
            </div>
            <span className={styles.versao}>V{versao.toString().padStart(2, '0')}</span>
          </div>
          <div className={styles.capaTexto}>
            <p>Proposta comercial</p>
            <h2>{documento.projeto.titulo}</h2>
            {subtitulo && <span>{subtitulo}</span>}
          </div>
          <div className={styles.destinatario}>
            <div>
              <span>Preparada para</span>
              <strong>{documento.cliente.empresa}</strong>
              {(documento.cliente.contato || documento.cliente.cargo) && (
                <small>
                  {[documento.cliente.contato, documento.cliente.cargo].filter(Boolean).join(' · ')}
                </small>
              )}
              {documento.cliente.email && <small>{documento.cliente.email}</small>}
            </div>
            <EditarTrecho secao="cliente" nome="cliente" onEditar={onEditar} />
          </div>
          <time className={styles.data} dateTime={referenciaEm}>
            {dataDocumento(referenciaEm)}
          </time>
        </header>

        <div className={styles.conteudo}>
          <section className={styles.investimento} data-secao-preview="investimento">
            <div className={styles.secaoTopo}>
              <h3>Investimento do projeto</h3>
              <EditarTrecho secao="investimento" nome="investimento" onEditar={onEditar} />
            </div>
            <strong className={styles.valor}>
              {formatarReais(documento.investimento.valorCentavos)}
            </strong>
            <p>{documento.investimento.condicoes}</p>
            <div className={styles.validade}>
              <span>
                Validade: <strong>{documento.validadeDias} dias</strong>
              </span>
              <span>{ROTULO_STATUS_PROPOSTA[status]}</span>
            </div>
            {documento.investimento.linkPagamento && (
              <div className={styles.linkPagamento}>
                <small>Link após aprovação</small>
                <span>{documento.investimento.linkPagamento}</span>
              </div>
            )}
          </section>

          <section className={styles.secao} data-secao-preview="contexto">
            <div className={styles.secaoTopo}>
              <h3>Desafio e objetivo</h3>
              <EditarTrecho secao="contexto" nome="desafio e objetivo" onEditar={onEditar} />
            </div>
            <p>{documento.desafio}</p>
            <div className={styles.objetivo}>
              <strong>Objetivo do projeto</strong>
              <p>{documento.objetivo}</p>
            </div>
          </section>

          <section className={styles.secao} data-secao-preview="solucao">
            <div className={styles.secaoTopo}>
              <h3>A solução proposta</h3>
              <EditarTrecho secao="solucao" nome="solução" onEditar={onEditar} />
            </div>
            <p>{documento.projeto.resumo}</p>
          </section>

          <section className={styles.secao} data-secao-preview="escopo">
            <div className={styles.secaoTopo}>
              <h3>Escopo do projeto</h3>
              <EditarTrecho secao="escopo" nome="escopo" onEditar={onEditar} />
            </div>
            <div className={styles.escopo}>
              {documento.escopo.map((item, indice) => (
                <div key={indice}>
                  <strong>{item.titulo}</strong>
                  <p>{item.descricao}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.secao} data-secao-preview="entregaveis">
            <div className={styles.secaoTopo}>
              <h3>Entregáveis</h3>
              <EditarTrecho secao="entregaveis" nome="entregáveis" onEditar={onEditar} />
            </div>
            <ul className={styles.entregaveis}>
              {documento.entregaveis.map((item, indice) => (
                <li key={indice}>
                  <Check size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.secao} data-secao-preview="cronograma">
            <div className={styles.secaoTopo}>
              <h3>Cronograma</h3>
              <EditarTrecho secao="cronograma" nome="cronograma" onEditar={onEditar} />
            </div>
            <ol className={styles.cronograma}>
              {documento.cronograma.map((item, indice) => (
                <li key={indice}>
                  <span className={styles.ordem}>{indice + 1}</span>
                  <div>
                    <strong>{item.fase}</strong>
                    <small>{item.duracao}</small>
                    <p>{item.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.secao} data-secao-preview="decisao">
            <div className={styles.secaoTopo}>
              <h3>Próximos passos</h3>
              <EditarTrecho secao="decisao" nome="próximos passos" onEditar={onEditar} />
            </div>
            <ol className={styles.passos}>
              {documento.proximosPassos.map((item, indice) => (
                <li key={indice}>
                  <span className={styles.ordem}>{indice + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
            {documento.observacoes && (
              <div className={styles.observacoes}>
                <strong>Observações</strong>
                <p>{documento.observacoes}</p>
              </div>
            )}
          </section>

          <footer className={styles.rodape}>
            <span>
              {documento.fornecedor?.nomeNegocio ??
                documento.fornecedor?.nomeResponsavel ??
                'Profissional de IA'}
            </span>
            <span>Criado com Subido</span>
            <span>Proposta V{versao.toString().padStart(2, '0')}</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
