import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Target,
} from 'lucide-react';
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
  const fornecedor = documento.fornecedor;
  const nomeFornecedor = fornecedor?.nomeNegocio ?? fornecedor?.nomeResponsavel ?? 'Subido';
  const aprovada = proposta.status === 'aceita';
  const recusada = proposta.status === 'recusada';
  const aberta = proposta.status === 'apresentada';

  return (
    <div className={styles.pagina}>
      <RegistrarVisualizacao codigo={codigo} />

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
          <span>proposta preparada com Subido</span>
        </div>
        <a href={`/api/proposta/${codigo}/pdf`}>
          <Download size={15} aria-hidden="true" /> Baixar PDF
        </a>
      </header>

      <aside className={styles.resumoFixo} aria-label="Resumo da proposta">
        <div className={styles.resumoCliente}>
          <span>Proposta para</span>
          <strong>{documento.cliente.empresa}</strong>
        </div>
        <div className={styles.resumoAcao}>
          <div className={styles.resumoPreco}>
            <span>Investimento</span>
            <strong>{formatarReais(documento.investimento.valorCentavos)}</strong>
          </div>
          <a href="#decisao">
            {aberta ? 'Revisar e aprovar' : aprovada ? 'Ver aprovação' : 'Ver decisão'}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
      </aside>

      <main className={styles.canvas}>
        <section className={styles.hero}>
          <div className={styles.heroTexto}>
            <p>Proposta comercial</p>
            <h1>{documento.projeto.titulo}</h1>
            <span>{documento.projeto.resumo}</span>
          </div>
          <dl className={styles.heroMeta}>
            <div>
              <dt>Versão</dt>
              <dd>V{proposta.versao.toString().padStart(2, '0')}</dd>
              <small>{dataLonga(proposta.compartilhadaEm)}</small>
            </div>
            {fornecedor && (
              <div>
                <dt>Responsável</dt>
                <dd>{fornecedor.nomeResponsavel}</dd>
                {(fornecedor.email || fornecedor.telefone) && (
                  <small>
                    {[fornecedor.email, fornecedor.telefone].filter(Boolean).join(' · ')}
                  </small>
                )}
              </div>
            )}
          </dl>
        </section>

        <section className={styles.contexto} id="visao-geral">
          <header>
            <p>Visão geral</p>
            <h2>O que este projeto resolve</h2>
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

        <section className={styles.escopo} id="escopo">
          <details className={styles.detalhesBloco} open>
            <summary>
              <div>
                <span>Escopo</span>
                <strong>O que será feito</strong>
              </div>
              <small>{documento.escopo.length} frentes</small>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
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
          </details>

          <details className={styles.detalhesBloco}>
            <summary>
              <div>
                <span>Entrega</span>
                <strong>O que você recebe e quando</strong>
              </div>
              <small>{documento.entregaveis.length} entregáveis</small>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className={styles.entrega}>
              <div>
                <header>
                  <p>Entregáveis</p>
                  <h2>O que fica com você</h2>
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
                  <p>Cronograma</p>
                  <h2>Ritmo do projeto</h2>
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
            </div>
          </details>
        </section>

        <section className={styles.fechamento} id="investimento">
          <div className={styles.investimento}>
            <div>
              <p>Investimento</p>
              <strong>{formatarReais(documento.investimento.valorCentavos)}</strong>
              <span>{documento.investimento.condicoes}</span>
            </div>
            <div className={styles.validade}>
              <Clock3 size={19} aria-hidden="true" />
              <span>Validade</span>
              <strong>{documento.validadeDias} dias</strong>
            </div>
          </div>

          <div className={styles.proximosPassos}>
            <header>
              <p>Após a aprovação</p>
              <h2>Próximos passos</h2>
            </header>
            <ol>
              {documento.proximosPassos.map((item, indice) => (
                <li key={`${item}-${indice}`}>
                  <span>{String(indice + 1).padStart(2, '0')}</span>
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
          </div>
        </section>

        <div id="decisao" className={styles.ancoraDecisao}>
          {proposta.status === 'apresentada' ? (
            <DecisaoCliente
              codigo={codigo}
              nomeInicial={documento.cliente.contato ?? ''}
              emailInicial={documento.cliente.email ?? ''}
              linkPagamento={documento.investimento.linkPagamento ?? null}
            />
          ) : (
            <section className={styles.estadoFinal} data-status={proposta.status}>
              <span>{aprovada ? <Check aria-hidden="true" /> : '—'}</span>
              <div>
                <p>Decisão registrada</p>
                <h2>{aprovada ? 'Proposta aprovada.' : 'Proposta não aprovada.'}</h2>
                <small>
                  {proposta.decisaoNome
                    ? `${proposta.decisaoNome} · ${dataLonga(proposta.decididaEm)}`
                    : dataLonga(proposta.decididaEm)}
                </small>
                {recusada && proposta.decisaoComentario && (
                  <blockquote>“{proposta.decisaoComentario}”</blockquote>
                )}
                {aprovada && documento.investimento.linkPagamento && (
                  <div className={styles.proximoPagamento}>
                    <a
                      href={documento.investimento.linkPagamento}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir pagamento <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                    <span>
                      O pagamento acontece no checkout de {nomeFornecedor}. A Subido não recebe nem
                      intermedeia o valor.
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className={styles.rodape}>
        <span>{nomeFornecedor}</span>
        <span>CRIADO COM SUBIDO × VIVER DE IA</span>
        <span>Link confidencial · não encaminhe sem autorização</span>
      </footer>
    </div>
  );
}
