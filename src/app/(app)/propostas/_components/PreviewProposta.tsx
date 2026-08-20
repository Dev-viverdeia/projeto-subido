import { Check, Circle } from 'lucide-react';
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
        <span className={styles.estadoPreview} data-sujo={sujo || undefined}>
          {sujo ? 'Alterações locais' : 'Versão salva'}
        </span>
      </div>

      <article className={styles.papel}>
        <header className={styles.capa}>
          <div className={styles.marca}>
            <SubidoLogo size={9} variant="mono" />
            <span className={styles.parceria}>× VIVER DE IA</span>
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
              {documento.cliente.contato && <small>{documento.cliente.contato}</small>}
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

          <section className={styles.secao}>
            <div className={styles.secaoTopo}>
              <span>01</span>
              <div>
                <p className={styles.rotulo}>Como vamos avançar</p>
                <h3>Escopo do projeto</h3>
              </div>
            </div>
            <div className={styles.escopo}>
              {documento.escopo.slice(0, 5).map((item, indice) => (
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
                {documento.entregaveis.slice(0, 6).map((item, indice) => (
                  <li key={`${item}-${indice}`}>
                    <Check size={11} strokeWidth={2.2} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.rotulo}>Cronograma</p>
              <ul>
                {documento.cronograma.slice(0, 5).map((item, indice) => (
                  <li key={`${item.fase}-${indice}`}>
                    <Circle size={8} fill="currentColor" aria-hidden="true" />
                    <span>
                      <strong>{item.fase}</strong>
                      {item.duracao}
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
            </div>
            <div>
              <span>Validade</span>
              <strong>{documento.validadeDias} dias</strong>
              <small>{ROTULO_STATUS_PROPOSTA[status]}</small>
            </div>
          </section>

          <footer className={styles.rodape}>
            <span>SUBIDO × VIVER DE IA</span>
            <span>Proposta V{versao.toString().padStart(2, '0')}</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
