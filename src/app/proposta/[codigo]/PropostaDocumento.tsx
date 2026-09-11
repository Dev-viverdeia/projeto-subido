import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  PackageCheck,
  X,
} from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { PropostaPublica } from '@/lib/propostas/portal';
import { formatarReais } from '@/lib/propostas/schema';
import styles from './proposta.module.css';

function dataLonga(valor: string | null): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(valor ? new Date(valor) : new Date());
}

/** Documento público e preview usam a mesma apresentação, sem consultas ou mutações aqui. */
export function PropostaDocumento({
  proposta,
  pdfHref,
  decisao,
}: {
  proposta: PropostaPublica;
  pdfHref: string;
  decisao: ReactNode;
}) {
  const d = proposta.documento;
  const fornecedor = d.fornecedor;
  const nomeFornecedor = fornecedor?.nomeNegocio ?? fornecedor?.nomeResponsavel ?? 'Subido';
  const aberta = proposta.status === 'apresentada';
  const aprovada = proposta.status === 'aceita';
  const rotuloDecisao = aberta ? 'Revisar e decidir' : 'Ver decisão';

  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <div className={styles.marca}>
          {fornecedor?.logoUrl ? (
            <Image
              src={fornecedor.logoUrl}
              alt={nomeFornecedor}
              width={136}
              height={42}
              unoptimized
              className={styles.logoFornecedor}
            />
          ) : fornecedor ? (
            <strong className={styles.nomeFornecedor}>{nomeFornecedor}</strong>
          ) : (
            <SubidoLogo size={11} />
          )}
        </div>
        <a className={styles.botaoSecundario} href={pdfHref}>
          <Download size={18} aria-hidden="true" />
          Baixar PDF
        </a>
      </header>

      <nav className={styles.navegacao} aria-label="Nesta proposta">
        <a href="#resumo">Resumo</a>
        <a href="#escopo">Escopo e prazo</a>
        <a href="#decisao">{aberta ? 'Decidir' : 'Decisão'}</a>
      </nav>

      <main className={styles.canvas}>
        <section className={styles.abertura} aria-labelledby="resumo">
          <div className={styles.heroTexto}>
            <div className={styles.edicao}>
              <span>Proposta · versão {proposta.versao}</span>
              <span className={styles.status}>
                {aberta ? 'Aguardando sua decisão' : aprovada ? 'Aprovada' : 'Não aprovada'}
              </span>
            </div>
            <p className={styles.cliente}>Para {d.cliente.empresa}</p>
            <h1 id="resumo" tabIndex={-1}>
              {d.projeto.titulo}
            </h1>
            <p className={styles.resumo}>{d.projeto.resumo}</p>
            <div className={styles.autoria}>
              {fornecedor && <span>{fornecedor.nomeResponsavel}</span>}
              <span>{dataLonga(proposta.compartilhadaEm)}</span>
            </div>
          </div>

          <aside className={styles.investimento} aria-labelledby="investimento">
            <h2 id="investimento" tabIndex={-1}>
              Investimento
            </h2>
            <strong className={styles.valor}>{formatarReais(d.investimento.valorCentavos)}</strong>
            <p className={styles.condicoes}>{d.investimento.condicoes}</p>
            <div className={styles.validade}>
              <span>Validade da proposta</span>
              <strong>{d.validadeDias} dias</strong>
            </div>
            <a className={styles.botaoPrimario} href="#decisao">
              {rotuloDecisao}
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </aside>
        </section>

        <details className={styles.contexto}>
          <summary>
            Desafio e objetivo
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <div className={styles.contextoGrade}>
            <article>
              <h2>Desafio atual</h2>
              <p>{d.desafio}</p>
            </article>
            <article>
              <h2>Resultado esperado</h2>
              <p>{d.objetivo}</p>
            </article>
          </div>
        </details>

        <section className={styles.escopo} aria-labelledby="escopo">
          <header className={styles.tituloSecao}>
            <h2 id="escopo" tabIndex={-1}>
              O que será feito
            </h2>
            <span>
              {d.escopo.length}{' '}
              {d.escopo.length === 1 ? 'frente de trabalho' : 'frentes de trabalho'}
            </span>
          </header>
          <div className={styles.escopoGrade}>
            <div className={styles.frentes}>
              {d.escopo.map((item, indice) => (
                <details
                  className={styles.frente}
                  key={`${item.titulo}-${indice}`}
                  open={indice === 0}
                >
                  <summary>
                    <span>{item.titulo}</span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <p>{item.descricao}</p>
                </details>
              ))}
            </div>
            <aside className={styles.entregaveis} aria-labelledby="entregaveis">
              <div className={styles.tituloEntrega}>
                <PackageCheck size={22} aria-hidden="true" />
                <h3 id="entregaveis">O que você recebe</h3>
              </div>
              <ul>
                {d.entregaveis.map((item, indice) => (
                  <li key={`${item}-${indice}`}>
                    <Check size={17} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.cronograma} aria-labelledby="cronograma">
          <header className={styles.tituloSecao}>
            <h2 id="cronograma">Etapas e prazos</h2>
          </header>
          <ol className={styles.etapas}>
            {d.cronograma.map((item, indice) => (
              <li key={`${item.fase}-${indice}`}>
                <div className={styles.marco}>
                  <span>{indice + 1}</span>
                  <strong>{item.duracao}</strong>
                </div>
                <h3>{item.fase}</h3>
                <details className={styles.detalheEtapa}>
                  <summary>
                    Ver atividades
                    <ChevronDown size={16} aria-hidden="true" />
                  </summary>
                  <p>{item.descricao}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.combinados} aria-label="Condições do projeto">
          <div className={styles.proximosPassos}>
            <h2>Após a aprovação</h2>
            <ol>
              {d.proximosPassos.map((item, indice) => (
                <li key={`${item}-${indice}`}>{item}</li>
              ))}
            </ol>
          </div>
          {d.observacoes && (
            <div className={styles.observacoes}>
              <h2>Observações</h2>
              <p>{d.observacoes}</p>
            </div>
          )}
        </section>

        <section
          className={styles.ancoraDecisao}
          aria-label="Decisão sobre a proposta"
          id="decisao"
          tabIndex={-1}
        >
          {aberta ? (
            decisao
          ) : (
            <div className={styles.estadoFinal} data-status={proposta.status}>
              <span className={styles.iconeEstado}>
                {aprovada ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
              </span>
              <div>
                <h2>{aprovada ? 'Proposta aprovada' : 'Proposta não aprovada'}</h2>
                <p>
                  {proposta.decisaoNome
                    ? `${proposta.decisaoNome} · ${dataLonga(proposta.decididaEm)}`
                    : dataLonga(proposta.decididaEm)}
                </p>
                {!aprovada && proposta.decisaoComentario && (
                  <blockquote>{proposta.decisaoComentario}</blockquote>
                )}
                {aprovada && d.investimento.linkPagamento && (
                  <div className={styles.proximoPagamento}>
                    <a
                      className={styles.botaoPrimario}
                      href={d.investimento.linkPagamento}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir pagamento
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </a>
                    <span>
                      O pagamento acontece no checkout de {nomeFornecedor}. A Subido não recebe nem
                      intermedeia o valor.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className={styles.rodape}>
        <div>
          <strong>{nomeFornecedor}</strong>
          {fornecedor && (
            <span>{[fornecedor.email, fornecedor.telefone].filter(Boolean).join(' · ')}</span>
          )}
        </div>
        <div>
          <span>Preparada com Subido × Viver de IA</span>
          <small>Link confidencial. Compartilhe somente com autorização.</small>
        </div>
      </footer>
    </div>
  );
}
