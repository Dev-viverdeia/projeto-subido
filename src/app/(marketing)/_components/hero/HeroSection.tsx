import Link from 'next/link';
import { HERO, NAV, HEADER_LOGIN } from '@/content/landing';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { MaskReveal } from '../primitives/MaskReveal';
import { TrackedCta } from '../primitives/TrackedCta';
import { HeroVideoFacade } from './HeroVideoFacade';
import { HeroPortrait } from './HeroPortrait';
import styles from './HeroSection.module.css';

/**
 * Banda escura 1 de 3 — a abertura.
 *
 * PESO ZERO DE BIBLIOTECA. O mask reveal roda em CSS disparado no mount, os CTAs são
 * âncoras, e o único JS é o facade do vídeo. Toda a coreografia ligada a scroll (e o
 * Lenis) vive abaixo da dobra — é assim que dá para ter motion de estúdio sem pagar
 * com o LCP da página que recebe o clique pago.
 *
 * COMPOSIÇÃO: duas colunas de verdade, não um título full-width com sobras embaixo.
 * O argumento inteiro (rótulo → título → lead → CTA → confiança) mora à esquerda, e a
 * direita carrega a figura. Isso resolve o vazio vertical que havia entre o título e a
 * linha de baixo, e dá ao hero a simetria de uma capa.
 */
export function HeroSection() {
  return (
    <section className={`${styles.hero} via-mesh-navy via-noise`} aria-labelledby="hero-title">
      <div className={styles.inner}>
        {/* Header estático: a mesma navegação da barra fixa, no estado de repouso.
            Transparente sobre o hero, tinta branca, hairline em gradiente que nasce
            e morre no nada — é o que separa uma régua de 1px de uma borda de caixa. */}
        <header className={`${styles.top} rise rise--now`} style={{ ['--rise-i' as string]: 0 }}>
          <span className={styles.logo}>
            <SubidoLogo size={19} />
          </span>

          <nav className={styles.nav} aria-label="Seções da página">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={styles.navLink}>
                {item.label}
              </a>
            ))}
          </nav>

          <Link href={HEADER_LOGIN.href} className={styles.login}>
            {HEADER_LOGIN.label}
          </Link>
        </header>

        <div className={styles.grid}>
          <div className={styles.copy}>
            {/* Linhas autorais: nós escolhemos a quebra. Dois tons SÓLIDOS fazem a
                hierarquia — nunca opacidade, nunca peso. */}
            <MaskReveal
              as="h1"
              id="hero-title"
              className={`t-hero ${styles.title}`}
              trigger="now"
              offset={1}
              lines={HERO.titleLines}
              toneClass={{ strong: styles.strong, soft: styles.soft }}
            />

            <p
              className={`t-lead ${styles.sub} rise rise--now`}
              style={{ ['--rise-i' as string]: 5 }}
            >
              {HERO.sub}
            </p>

            <div
              className={`${styles.actions} rise rise--now`}
              style={{ ['--rise-i' as string]: 6 }}
            >
              <TrackedCta href={HERO.ctaPrimary.href} local="hero" className={styles.ctaPrimary}>
                {HERO.ctaPrimary.label}
              </TrackedCta>
              <TrackedCta
                href={HERO.ctaSecondary.href}
                local="hero"
                className={styles.ctaSecondary}
              >
                {HERO.ctaSecondary.label}
              </TrackedCta>
            </div>

            {/* O separador vem DEPOIS do item, não antes: quando a linha quebra, ela
                começa com o rótulo em vez de com um "/" órfão. */}
            <p className={`${styles.trust} rise rise--now`} style={{ ['--rise-i' as string]: 7 }}>
              {HERO.trust.map((item, i) => (
                <span key={item}>
                  {item}
                  {i < HERO.trust.length - 1 ? <span className={styles.dot}>/</span> : null}
                </span>
              ))}
            </p>
          </div>

          {/* A ENTRADA NÃO MORA AQUI, e isso não é organização: mora nos dois FILHOS.
              Este contêiner é ancestral comum do retrato e do card de vídeo, e o card
              é vidro (`backdrop-filter` no `.frame` do HeroVideoFacade). Opacidade < 1
              num ancestral cria grupo composto e o vidro deixa de existir — medido no
              navegador: com `opacity: 0.99` aqui, a foto atrás do card sai NÍTIDA em
              vez de borrada. Enquanto o `rise` viveu nesta div, o card passou os
              ~1,02s da cascata (320ms de atraso + 700ms) sem vidro nenhum. É a mesma
              cirurgia que o SiteHeader já tinha recebido. */}
          <div className={styles.figure}>
            {/* Contêiner próprio da figura: o card do vídeo se posiciona em relação
                AO RETRATO, não à coluna. Sem isso, mover o retrato para a direita
                deixaria o card para trás, no meio da coluna de texto. */}
            <div className={styles.figureInner}>
              {/* O retrato é IRMÃO do card, não ancestral: aqui a opacidade é livre. */}
              <HeroPortrait
                alt={HERO.portraitAlt}
                prioritario
                className="rise rise--now"
                style={{ ['--rise-i' as string]: 4 }}
              />

              {/* O vídeo não disputa a coluna com o retrato: se apoia nele, sobreposto
                  ao canto inferior esquerdo. A camada é o que dá profundidade à
                  composição sem precisar de 3D. */}
              <div className={`${styles.videoCard} ${styles.videoCardEntra}`}>
                <HeroVideoFacade caption={HERO.videoCaption} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className={styles.scrollHint} aria-hidden="true">
        {HERO.scrollHint}
      </span>
    </section>
  );
}
