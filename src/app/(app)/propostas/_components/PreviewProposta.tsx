import { Check } from 'lucide-react';
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

export function PreviewProposta({
  documento,
  titulo,
  versao,
  status,
  sujo,
  referenciaEm,
}: {
  documento: DocumentoProposta;
  titulo: string;
  versao: number;
  status: StatusProposta;
  sujo: boolean;
  referenciaEm: string;
}) {
  const subtitulo = subtituloVisivel(titulo, documento.projeto.titulo);

  return (
    <div className={styles.moldura} aria-label="Prévia visual da proposta">
      <div className={styles.molduraTopo}>
        <div>
          <strong>Prévia da proposta</strong>
        </div>
        <span className={styles.estadoPreview} data-sujo={sujo || undefined} aria-live="polite">
          {sujo ? 'Alterações não salvas' : 'Versão salva'}
        </span>
      </div>

      <article className={styles.papel}>
        <header className={styles.capa} data-secao-preview="cliente">
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
              <strong className={styles.nomeFornecedor}>
                {documento.fornecedor.nomeNegocio ?? documento.fornecedor.nomeResponsavel}
              </strong>
            ) : (
              <SubidoLogo size={14} variant="mono" />
            )}
          </div>
          <div className={styles.capaTexto}>
            <p>Proposta comercial</p>
            <h2>{documento.projeto.titulo}</h2>
            {subtitulo && <span>{subtitulo}</span>}
          </div>
          <div className={styles.capaMeta}>
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
            <div>
              <span>Documento</span>
              <strong>V{versao.toString().padStart(2, '0')}</strong>
              <small>{dataDocumento(referenciaEm)}</small>
            </div>
          </div>
        </header>

        <div className={styles.conteudo}>
          <section className={styles.abertura} data-secao-preview="contexto">
            <h3>Desafio e objetivo</h3>
            <p>{documento.desafio}</p>
            <strong className={styles.objetivo}>Objetivo do projeto</strong>
            <p>{documento.objetivo}</p>
          </section>

          <section className={styles.resumoProjeto} data-secao-preview="solucao">
            <h3>A solução proposta</h3>
            <p>{documento.projeto.resumo}</p>
          </section>

          <section className={styles.secao} data-secao-preview="escopo">
            <div className={styles.secaoTopo}>
              <div>
                <h3>Escopo do projeto</h3>
              </div>
            </div>
            <div className={styles.escopo}>
              {documento.escopo.map((item, indice) => (
                <div key={`${item.titulo}-${indice}`}>
                  <span>{(indice + 1).toString().padStart(2, '0')}</span>
                  <div>
                    <strong>{item.titulo}</strong>
                    <p>{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.duasColunas}>
            <div data-secao-preview="entregaveis">
              <h3>Entregáveis</h3>
              <ul>
                {documento.entregaveis.map((item, indice) => (
                  <li key={`${item}-${indice}`}>
                    <Check size={16} strokeWidth={1.8} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div data-secao-preview="cronograma">
              <h3>Cronograma</h3>
              <ul>
                {documento.cronograma.map((item, indice) => (
                  <li key={`${item.fase}-${indice}`}>
                    <span>
                      <strong>{item.fase}</strong>
                      <small>{item.duracao}</small>
                      <p>{item.descricao}</p>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.investimento} data-secao-preview="investimento">
            <div>
              <p className={styles.rotulo}>Investimento do projeto</p>
              <strong>{formatarReais(documento.investimento.valorCentavos)}</strong>
              <span>{documento.investimento.condicoes}</span>
              {documento.investimento.linkPagamento && (
                <div className={styles.linkPagamento}>
                  <small>Link após aprovação</small>
                  <span>{documento.investimento.linkPagamento}</span>
                </div>
              )}
            </div>
            <div>
              <span>Validade</span>
              <strong>{documento.validadeDias} dias</strong>
              <small>{ROTULO_STATUS_PROPOSTA[status]}</small>
            </div>
          </section>

          <section className={styles.decisao} data-secao-preview="decisao">
            <div className={styles.secaoTopo}>
              <div>
                <h3>Próximos passos</h3>
              </div>
            </div>
            <ol>
              {documento.proximosPassos.map((item, indice) => (
                <li key={`${item}-${indice}`}>
                  <span>{(indice + 1).toString().padStart(2, '0')}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
            {documento.observacoes && (
              <div className={styles.observacoes}>
                <p className={styles.rotulo}>Observações</p>
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
