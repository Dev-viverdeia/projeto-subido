import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ContactRound,
  DraftingCompass,
} from 'lucide-react';
import { criarProposta } from '@/lib/propostas/actions';
import { listarOpcoesNovaProposta } from '@/lib/propostas/queries';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Nova proposta comercial' };

export default async function NovaPropostaPage({ searchParams }: PageProps<'/propostas/nova'>) {
  const [opcoes, parametros] = await Promise.all([listarOpcoesNovaProposta(), searchParams]);
  const oportunidadeInicial =
    typeof parametros.oportunidade === 'string' ? parametros.oportunidade : '';
  const origemInicial =
    typeof parametros.projeto === 'string'
      ? `projeto:${parametros.projeto}`
      : typeof parametros.builder === 'string'
        ? `estudio:${parametros.builder}`
        : '';
  const reuniaoInicial = typeof parametros.reuniao === 'string' ? parametros.reuniao : '';
  const diagnosticoInicial =
    typeof parametros.diagnostico === 'string' ? parametros.diagnostico : '';
  const erro = typeof parametros.erro === 'string' ? parametros.erro : null;

  return (
    <div className={styles.pagina}>
      <Link href="/propostas" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar às propostas
      </Link>

      <header className={styles.hero}>
        <p className={styles.sobretitulo}>Novo documento</p>
        <h1>Conecte o contexto ao que você vai entregar.</h1>
        <p>
          A plataforma usa os fatos do CRM e a estrutura do Projeto para preparar o primeiro
          rascunho. Você continua no controle de cada palavra.
        </p>
      </header>

      <form action={criarProposta} className={styles.formulario}>
        <input type="hidden" name="reuniao" value={reuniaoInicial} />
        <input type="hidden" name="diagnostico" value={diagnosticoInicial} />
        {erro && (
          <p className={styles.erro} role="alert">
            Não foi possível criar com essa combinação. Revise as escolhas e tente novamente.
          </p>
        )}

        <section className={styles.etapa} aria-labelledby="cliente-titulo">
          <div className={styles.numero}>01</div>
          <div className={styles.etapaCorpo}>
            <div className={styles.etapaTitulo}>
              <span>
                <ContactRound size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <p>Contexto comercial</p>
                <h2 id="cliente-titulo">Para quem é a proposta?</h2>
              </div>
            </div>

            {opcoes.oportunidades.length ? (
              <label className={styles.campo}>
                <span>Lead do CRM</span>
                <select name="oportunidade" defaultValue={oportunidadeInicial} required>
                  <option value="" disabled>
                    Escolha uma oportunidade
                  </option>
                  {opcoes.oportunidades.map((oportunidade) => (
                    <option value={oportunidade.id} key={oportunidade.id}>
                      {oportunidade.empresa} · {oportunidade.titulo}
                    </option>
                  ))}
                </select>
                <small>Empresa, contato, fatos e valor negociado entram no rascunho.</small>
                {reuniaoInicial && (
                  <span className={styles.contextoCall}>
                    A análise da call selecionada também será usada no desafio e nas confirmações.
                  </span>
                )}
                {diagnosticoInicial && (
                  <span className={styles.contextoCall}>
                    As falhas observadas e o plano do diagnóstico também entrarão no rascunho.
                  </span>
                )}
              </label>
            ) : (
              <div className={styles.semOpcao}>
                <p>Você ainda não tem oportunidades abertas no CRM.</p>
                <Link href="/crm">Adicionar um lead</Link>
              </div>
            )}
          </div>
        </section>

        <section className={styles.etapa} aria-labelledby="projeto-titulo">
          <div className={styles.numero}>02</div>
          <div className={styles.etapaCorpo}>
            <div className={styles.etapaTitulo}>
              <span>
                <BriefcaseBusiness size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <p>Estrutura de entrega</p>
                <h2 id="projeto-titulo">Qual Projeto será apresentado?</h2>
              </div>
            </div>

            <label className={styles.campo}>
              <span>Projeto-base</span>
              <select name="origem" defaultValue={origemInicial} required>
                <option value="" disabled>
                  Escolha o ponto de partida
                </option>
                {opcoes.projetos.length > 0 && (
                  <optgroup label="Projetos da plataforma">
                    {opcoes.projetos.map((projeto) => (
                      <option value={`projeto:${projeto.slug}`} key={projeto.id}>
                        {projeto.titulo}
                      </option>
                    ))}
                  </optgroup>
                )}
                {opcoes.projetosEstudio.length > 0 && (
                  <optgroup label="Seus projetos no Estúdio">
                    {opcoes.projetosEstudio.map((projeto) => (
                      <option value={`estudio:${projeto.id}`} key={projeto.id}>
                        {projeto.titulo}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="sem-base">Começar sem um projeto-base</option>
              </select>
              <small>Escopo, entregáveis e cronograma serão preenchidos para você revisar.</small>
            </label>

            <div className={styles.origens}>
              <span>
                <BriefcaseBusiness size={15} aria-hidden="true" /> Projeto passo a passo
              </span>
              <span>
                <DraftingCompass size={15} aria-hidden="true" /> Projeto do Estúdio
              </span>
            </div>
          </div>
        </section>

        <footer className={styles.rodape}>
          <div>
            <span>Próxima etapa</span>
            <strong>Revisar e personalizar o documento</strong>
          </div>
          <button type="submit" disabled={!opcoes.oportunidades.length}>
            Montar proposta <ArrowRight size={17} aria-hidden="true" />
          </button>
        </footer>
      </form>
    </div>
  );
}
