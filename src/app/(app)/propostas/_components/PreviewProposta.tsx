import { Check, Circle } from 'lucide-react';
import Image from 'next/image';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { StatusProposta } from '@/lib/propostas/queries';
import { subtituloVisivel } from '@/lib/propostas/apresentacao';
import { formatarReais, type DocumentoProposta } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import styles from './PreviewProposta.module.css';

function dataDocumento(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function PreviewProposta({
  documento,
  titulo,
  versao,
  status,
  sujo,
}: {
  documento: DocumentoProposta;
  titulo: string;
  versao: number;
  status: StatusProposta;
  sujo: boolean;
}) {
  const subtitulo = subtituloVisivel(titulo, documento.projeto.titulo);

  return (
    <div className={styles.moldura} aria-label="Prévia visual da proposta">
      <div className={styles.molduraTopo}>
        <div>
          <strong>Prévia em tempo real</strong>
          <span>Atualiza enquanto você edita</span>
        </div>
        <span className={styles.estadoPreview} data-sujo={sujo || undefined} aria-live="polite">
          {sujo ? 'Prévia atualizada' : 'Versão salva'}
        </span>
      </div>

      <article className={styles.papel}>
        <header className={styles.capa}>
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
              <SubidoLogo size={9} variant="mono" />
            )}
            <span className={styles.parceria}>CRIADO COM SUBIDO</span>
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
              <small>{dataDocumento()}</small>
            </div>
          </div>
        </header>

        <div className={styles.conteudo}>
          <div className={styles.linhaDecisao}>
            {['Contexto', 'Entrega', 'Prazo', 'Investimento', 'Decisão'].map((item, indice) => (
              <div key={item}>
                <span>{indice + 1}</span>
                <small>{item}</small>
              </div>
            ))}
          </div>

          <section
            className={styles.abertura}
            data-contexto-longo={documento.desafio.length > 360 || undefined}
          >
            <p className={styles.rotulo}>O ponto de partida</p>
            <h3>{documento.desafio}</h3>
            <p>{documento.objetivo}</p>
          </section>

          <section className={styles.resumoProjeto}>
            <p className={styles.rotulo}>A solução proposta</p>
            <h3>{documento.projeto.titulo}</h3>
            <p>{documento.projeto.resumo}</p>
          </section>

          <section className={styles.secao}>
            <div className={styles.secaoTopo}>
              <span>01</span>
              <div>
                <p className={styles.rotulo}>Como vamos avançar</p>
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
            <div>
              <p className={styles.rotulo}>Entregáveis</p>
              <ul>
                {documento.entregaveis.map((item, indice) => (
                  <li key={`${item}-${indice}`}>
                    <Check size={11} strokeWidth={2.2} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.rotulo}>Cronograma</p>
              <ul>
                {documento.cronograma.map((item, indice) => (
                  <li key={`${item.fase}-${indice}`}>
                    <Circle size={8} fill="currentColor" aria-hidden="true" />
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

          <section className={styles.investimento}>
            <div>
              <p className={styles.rotulo}>Investimento do projeto</p>
              <strong>{formatarReais(documento.investimento.valorCentavos)}</strong>
              <span>{documento.investimento.condicoes}</span>
              {documento.investimento.linkPagamento && <small>Checkout configurado</small>}
            </div>
            <div>
              <span>Validade</span>
              <strong>{documento.validadeDias} dias</strong>
              <small>{ROTULO_STATUS_PROPOSTA[status]}</small>
            </div>
          </section>

          <section className={styles.decisao}>
            <div className={styles.secaoTopo}>
              <span>02</span>
              <div>
                <p className={styles.rotulo}>Para começar</p>
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
            <span>CRIADO COM SUBIDO</span>
            <span>Proposta V{versao.toString().padStart(2, '0')}</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
