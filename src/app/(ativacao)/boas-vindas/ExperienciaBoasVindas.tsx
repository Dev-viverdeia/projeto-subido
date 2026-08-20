import { ArrowDown, BriefcaseBusiness, CircleDollarSign, Route } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
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
        <SubidoLogo size={20} variant="mono" />
        <span>Em colaboração com Viver de IA</span>
      </header>

      <section className={styles.apresentacao} aria-labelledby="titulo-boas-vindas">
        <div className={styles.texto}>
          <p className={styles.sobretitulo}>Sua jornada começa aqui</p>
          <h1 id="titulo-boas-vindas">
            {nome ? `${nome}, transforme` : 'Transforme'} IA em um serviço que empresas compram.
          </h1>
          <p className={styles.resumo}>
            Antes de abrir a plataforma, entenda o caminho: escolher um projeto, encontrar uma
            empresa, vender com método e entregar um resultado real.
          </p>

          <ol className={styles.aprendizados} aria-label="O que você vai aprender">
            <li>
              <CircleDollarSign size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>
                <strong>Onde está o dinheiro</strong>
                <small>Problemas empresariais que viram projetos de IA.</small>
              </span>
            </li>
            <li>
              <BriefcaseBusiness size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>
                <strong>O que vender primeiro</strong>
                <small>Uma oferta simples, concreta e possível de entregar.</small>
              </span>
            </li>
            <li>
              <Route size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>
                <strong>Como usar a plataforma</strong>
                <small>Da primeira lista de empresas à entrega do projeto.</small>
              </span>
            </li>
          </ol>
        </div>

        <div className={styles.palcoVideo}>
          <div className={styles.videoTopo}>
            <span>Introdução obrigatória</span>
            <small>Como ganhar dinheiro implementando IA</small>
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
                <strong>Como sair do zero ao primeiro projeto de IA</strong>
                <small>O vídeo principal está em produção. Esta é a capa provisória.</small>
              </div>
            )}
          </div>

          <div className={styles.videoRodape}>
            <p>
              {videoUrl
                ? 'Assista antes de continuar.'
                : 'Você já pode conhecer a plataforma enquanto finalizamos o vídeo.'}
            </p>
            <BotaoEntrar videoDisponivel={Boolean(videoUrl)} />
          </div>
        </div>
      </section>

      <a href="#titulo-boas-vindas" className={styles.rodape}>
        <ArrowDown size={14} aria-hidden="true" /> Primeiro, entenda o caminho
      </a>
    </main>
  );
}
