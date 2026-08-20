import { BriefcaseBusiness, CircleDollarSign, Clock3, Route } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { Card } from '@/design-system/via';
import { BotaoEntrar } from './BotaoEntrar';
import styles from './pagina.module.css';

export function ExperienciaBoasVindas({
  nome,
  videoUrl,
}: {
  nome: string | null;
  videoUrl: string | null;
}) {
  return (
    <main className={styles.pagina}>
      <header className={styles.cabecalho}>
        <SubidoLogo size={20} />
        <div className={styles.contextoCabecalho}>
          <span>Primeiro acesso</span>
          <small>Em colaboração com Viver de IA</small>
        </div>
      </header>

      <section className={styles.conteudo} aria-labelledby="titulo-boas-vindas">
        <div className={styles.introducao}>
          <div className={styles.texto}>
            <p className={styles.sobretitulo}>Comece por aqui</p>
            <h1 id="titulo-boas-vindas">
              {nome ? `${nome}, conheça` : 'Conheça'} o caminho até seu primeiro projeto de IA.
            </h1>
            <p className={styles.resumo}>
              Antes de entrar, veja como a plataforma ajuda você a encontrar clientes, vender com
              método e entregar um projeto de verdade.
            </p>
          </div>
          <span className={styles.sinalObrigatorio}>
            <Clock3 size={14} aria-hidden="true" /> Introdução obrigatória
          </span>
        </div>

        <Card as="section" variant="featured" noPadding className={styles.painel}>
          <div className={styles.palcoVideo}>
            <div className={styles.videoTopo}>
              <span>Visão geral da plataforma</span>
              <small>Como transformar IA em um serviço que empresas compram</small>
            </div>

            <div className={styles.video}>
              {videoUrl ? (
                <iframe
                  src={videoUrl}
                  title="Como ganhar dinheiro implementando projetos de IA"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className={styles.videoProvisorio}>
                  <span className={styles.play} aria-hidden="true">
                    ▶
                  </span>
                  <div>
                    <strong>Do primeiro cliente à entrega do projeto</strong>
                    <small>
                      O vídeo definitivo entra aqui. Você já pode conhecer a plataforma.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className={styles.guia} aria-label="O que você vai aprender">
            <div>
              <p className={styles.guiaEyebrow}>Neste vídeo</p>
              <h2>Você vai entender três coisas.</h2>
            </div>

            <ol className={styles.aprendizados}>
              <li>
                <CircleDollarSign size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>
                  <strong>O que vender</strong>
                  <small>Problemas reais que viram projetos de IA.</small>
                </span>
              </li>
              <li>
                <BriefcaseBusiness size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>
                  <strong>Como encontrar clientes</strong>
                  <small>Da prospecção à oportunidade em Vendas.</small>
                </span>
              </li>
              <li>
                <Route size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>
                  <strong>Como usar a Subido</strong>
                  <small>Um próximo passo claro em cada etapa.</small>
                </span>
              </li>
            </ol>

            <div className={styles.entrada}>
              <p>
                {videoUrl
                  ? 'Depois de assistir, sua plataforma será liberada.'
                  : 'O vídeo ainda está em produção. Seu acesso já está liberado.'}
              </p>
              <BotaoEntrar videoDisponivel={Boolean(videoUrl)} />
            </div>
          </aside>
        </Card>

        <p className={styles.notaFinal}>Esta introdução aparece somente no primeiro acesso.</p>
      </section>
    </main>
  );
}
