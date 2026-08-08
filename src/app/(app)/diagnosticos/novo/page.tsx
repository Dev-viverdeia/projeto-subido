import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, FileText, ScanSearch, ShieldCheck } from 'lucide-react';
import { criarDiagnostico } from '@/lib/diagnosticos/actions';
import { listarOpcoesDiagnostico } from '@/lib/diagnosticos/queries';
import { CANAIS_DIAGNOSTICO, ROTULO_CANAL } from '@/lib/diagnosticos/schema';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Novo diagnóstico de atendimento' };

const MENSAGEM_ERRO: Record<string, string> = {
  campos: 'Revise o lead, o cenário e as fontes do diagnóstico.',
  autorizacao: 'Confirme que você tem autorização antes de usar uma conversa privada.',
  andamento: 'Esse lead já possui um diagnóstico em andamento.',
  salvar: 'Não foi possível iniciar agora. Tente novamente em instantes.',
};

export default async function NovoDiagnosticoPage({
  searchParams,
}: PageProps<'/diagnosticos/novo'>) {
  const [oportunidades, parametros] = await Promise.all([listarOpcoesDiagnostico(), searchParams]);
  const oportunidadeInicial =
    typeof parametros.oportunidade === 'string' ? parametros.oportunidade : '';
  const oportunidadeSelecionada = oportunidades.find((item) => item.id === oportunidadeInicial);
  const erro = typeof parametros.erro === 'string' ? MENSAGEM_ERRO[parametros.erro] : null;

  return (
    <div className={styles.pagina}>
      <Link href="/diagnosticos" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar aos diagnósticos
      </Link>

      <header className={styles.hero}>
        <p className={styles.sobretitulo}>Novo teste</p>
        <h1>Defina a cena antes de medir o atendimento.</h1>
        <p>
          Um bom diagnóstico começa com uma pergunta concreta. A plataforma observa somente as
          fontes indicadas e deixa explícito o que não conseguiu testar.
        </p>
      </header>

      <aside className={styles.limite}>
        <ShieldCheck size={20} strokeWidth={1.7} aria-hidden="true" />
        <div>
          <strong>Nenhuma mensagem será enviada em seu nome.</strong>
          <span>
            Esta versão analisa a jornada pública do site e conversas que você possui autorização
            para usar.
          </span>
        </div>
      </aside>

      <form action={criarDiagnostico} className={styles.formulario}>
        {erro && (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        )}

        <section className={styles.etapa} aria-labelledby="lead-titulo">
          <span className={styles.numero}>01</span>
          <div className={styles.etapaCorpo}>
            <header className={styles.etapaTitulo}>
              <span>
                <Building2 size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <p>Contexto comercial</p>
                <h2 id="lead-titulo">Qual empresa será observada?</h2>
              </div>
            </header>

            {oportunidades.length ? (
              <label className={styles.campo}>
                <span>Lead do CRM</span>
                <select name="oportunidade" defaultValue={oportunidadeInicial} required>
                  <option value="" disabled>
                    Escolha uma oportunidade
                  </option>
                  {oportunidades.map((oportunidade) => (
                    <option value={oportunidade.id} key={oportunidade.id}>
                      {oportunidade.empresa} · {oportunidade.titulo}
                    </option>
                  ))}
                </select>
                <small>O relatório e o fato concluído serão conectados a essa oportunidade.</small>
              </label>
            ) : (
              <div className={styles.semLead}>
                <p>Crie uma oportunidade no CRM antes de iniciar o diagnóstico.</p>
                <Link href="/crm">Adicionar lead</Link>
              </div>
            )}
          </div>
        </section>

        <section className={styles.etapa} aria-labelledby="cenario-titulo">
          <span className={styles.numero}>02</span>
          <div className={styles.etapaCorpo}>
            <header className={styles.etapaTitulo}>
              <span>
                <ScanSearch size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <p>Cena do cliente</p>
                <h2 id="cenario-titulo">O que vamos tentar resolver?</h2>
              </div>
            </header>

            <div className={styles.gradeCampos}>
              <label className={styles.campo}>
                <span>Canal principal</span>
                <select name="canal" defaultValue="site" required>
                  {CANAIS_DIAGNOSTICO.map((canal) => (
                    <option value={canal} key={canal}>
                      {ROTULO_CANAL[canal]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.campo}>
                <span>Site da empresa</span>
                <input
                  type="text"
                  name="site"
                  inputMode="url"
                  defaultValue={oportunidadeSelecionada?.dominio ?? ''}
                  placeholder="empresa.com.br"
                  maxLength={1000}
                />
                <small>A coleta automática fica restrita às páginas públicas do domínio.</small>
              </label>
            </div>

            <label className={styles.campo}>
              <span>Cenário do teste</span>
              <textarea
                name="cenario"
                required
                minLength={20}
                maxLength={4000}
                rows={5}
                placeholder="Ex.: sou um cliente novo, preciso entender se a clínica atende meu convênio e quero agendar uma primeira consulta."
              />
              <small>
                Escreva como um cliente real: objetivo, dúvida e próximo passo esperado.
              </small>
            </label>
          </div>
        </section>

        <section className={styles.etapa} aria-labelledby="evidencia-titulo">
          <span className={styles.numero}>03</span>
          <div className={styles.etapaCorpo}>
            <header className={styles.etapaTitulo}>
              <span>
                <FileText size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div>
                <p>Amostra opcional</p>
                <h2 id="evidencia-titulo">Existe uma conversa para avaliar?</h2>
              </div>
            </header>

            <label className={styles.campo}>
              <span>Transcrição ou relato</span>
              <textarea
                name="evidencia"
                maxLength={50000}
                rows={8}
                placeholder="Cole uma conversa anonimizada ou descreva, em ordem, o que aconteceu no atendimento."
              />
              <small>Remova dados pessoais que não sejam necessários para a análise.</small>
            </label>

            <label className={styles.autorizacao}>
              <input type="checkbox" name="autorizacao" />
              <span>
                Confirmo que tenho autorização para usar qualquer conversa ou dado privado informado
                acima.
              </span>
            </label>
          </div>
        </section>

        <footer className={styles.rodape}>
          <div>
            <span>Saída</span>
            <strong>Laudo, oportunidades e plano de correção</strong>
          </div>
          <button type="submit" disabled={!oportunidades.length}>
            Iniciar diagnóstico <ArrowRight size={17} aria-hidden="true" />
          </button>
        </footer>
      </form>
    </div>
  );
}
