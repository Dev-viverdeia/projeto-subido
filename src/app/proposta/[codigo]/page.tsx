import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check, Clock3, Download, Target } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { obterPropostaPublica } from '@/lib/propostas/portal';
import { formatarReais } from '@/lib/propostas/schema';
import { DecisaoCliente } from './DecisaoCliente';
import { RegistrarVisualizacao } from './RegistrarVisualizacao';
import styles from './proposta.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Proposta comercial',
  robots: { index: false, follow: false },
};

function dataLonga(valor: string | null): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(valor ? new Date(valor) : new Date());
}

export default async function PropostaClientePage({ params }: PageProps<'/proposta/[codigo]'>) {
  const { codigo } = await params;
  const proposta = await obterPropostaPublica(codigo);
  if (!proposta) notFound();

  const documento = proposta.documento;
  const aprovada = proposta.status === 'aceita';
  const recusada = proposta.status === 'recusada';

  return (
    <div className={styles.pagina}>
      <RegistrarVisualizacao codigo={codigo} />

      <header className={styles.barra}>
        <div className={styles.marca}>
          <SubidoLogo size={11} />
          <span>em colaboração com Viver de IA</span>
        </div>
        <a href={`/api/proposta/${codigo}/pdf`}>
          <Download size={15} aria-hidden="true" /> Baixar PDF
        </a>
      </header>

      <main className={styles.canvas}>
        <section className={styles.hero}>
          <div className={styles.heroTexto}>
            <p>Proposta comercial</p>
            <h1>{documento.projeto.titulo}</h1>
            <span>{documento.projeto.resumo}</span>
          </div>
          <dl className={styles.heroMeta}>
            <div>
              <dt>Preparada para</dt>
              <dd>{documento.cliente.empresa}</dd>
              {documento.cliente.contato && <small>{documento.cliente.contato}</small>}
            </div>
            <div>
              <dt>Documento</dt>
              <dd>V{proposta.versao.toString().padStart(2, '0')}</dd>
              <small>{dataLonga(proposta.compartilhadaEm)}</small>
            </div>
          </dl>
        </section>

        <nav className={styles.trilho} aria-label="Estrutura da proposta">
          {['Contexto', 'Escopo', 'Entrega', 'Investimento', 'Decisão'].map((item, indice) => (
            <div key={item}>
              <span>{(indice + 1).toString().padStart(2, '0')}</span>
              <small>{item}</small>
            </div>
          ))}
        </nav>

        <section className={styles.contexto}>
          <header>
            <p>01 · Ponto de partida</p>
            <h2>O problema certo, com um resultado claro.</h2>
          </header>
          <div className={styles.contextoGrade}>
            <article>
              <span>Contexto</span>
              <p>{documento.desafio}</p>
            </article>
            <article className={styles.objetivo}>
              <Target size={22} aria-hidden="true" />
              <span>Resultado esperado</span>
              <p>{documento.objetivo}</p>
            </article>
          </div>
        </section>

        <section className={styles.escopo}>
          <header>
            <p>02 · Como vamos avançar</p>
            <h2>Escopo do projeto</h2>
          </header>
          <div className={styles.escopoGrade}>
            {documento.escopo.map((item, indice) => (
              <article key={`${item.titulo}-${indice}`}>
                <span>{(indice + 1).toString().padStart(2, '0')}</span>
                <div>
                  <h3>{item.titulo}</h3>
                  <p>{item.descricao}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.entrega}>
          <div>
            <header>
              <p>03 · O cliente recebe</p>
              <h2>Entregáveis</h2>
            </header>
            <ul>
              {documento.entregaveis.map((item, indice) => (
                <li key={`${item}-${indice}`}>
                  <Check size={15} aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <header>
              <p>Ritmo do trabalho</p>
              <h2>Cronograma</h2>
            </header>
            <ol>
              {documento.cronograma.map((item, indice) => (
                <li key={`${item.fase}-${indice}`}>
                  <span>{(indice + 1).toString().padStart(2, '0')}</span>
                  <div>
                    <strong>{item.fase}</strong>
                    <small>{item.duracao}</small>
                    <p>{item.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.investimento}>
          <div>
            <p>04 · Investimento do projeto</p>
            <strong>{formatarReais(documento.investimento.valorCentavos)}</strong>
            <span>{documento.investimento.condicoes}</span>
          </div>
          <div className={styles.validade}>
            <Clock3 size={19} aria-hidden="true" />
            <span>Validade</span>
            <strong>{documento.validadeDias} dias</strong>
          </div>
        </section>

        <section className={styles.proximosPassos}>
          <header>
            <p>Depois da aprovação</p>
            <h2>Próximos passos</h2>
          </header>
          <ol>
            {documento.proximosPassos.map((item, indice) => (
              <li key={`${item}-${indice}`}>
                <span>{indice + 1}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
          {documento.observacoes && (
            <div className={styles.observacoes}>
              <span>Observações</span>
              <p>{documento.observacoes}</p>
            </div>
          )}
        </section>

        {proposta.status === 'apresentada' ? (
          <DecisaoCliente
            codigo={codigo}
            nomeInicial={documento.cliente.contato ?? ''}
            emailInicial={documento.cliente.email ?? ''}
          />
        ) : (
          <section className={styles.estadoFinal} data-status={proposta.status}>
            <span>{aprovada ? <Check aria-hidden="true" /> : '—'}</span>
            <div>
              <p>05 · Decisão registrada</p>
              <h2>{aprovada ? 'Proposta aprovada.' : 'Proposta não aprovada.'}</h2>
              <small>
                {proposta.decisaoNome
                  ? `${proposta.decisaoNome} · ${dataLonga(proposta.decididaEm)}`
                  : dataLonga(proposta.decididaEm)}
              </small>
              {recusada && proposta.decisaoComentario && (
                <blockquote>“{proposta.decisaoComentario}”</blockquote>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.rodape}>
        <span>SUBIDO × VIVER DE IA</span>
        <span>Link confidencial · não encaminhe sem autorização</span>
      </footer>
    </div>
  );
}
