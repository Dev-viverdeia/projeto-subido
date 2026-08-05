import type { ReactNode } from 'react';
import type { Pillar } from '@/content/landing/types';
import {
  Section,
  SectionHeader,
  Reveal,
  HairlineList,
  DeviceFrame,
  AssetPlaceholder,
  Parallax,
} from '../primitives';
import styles from './PillarSection.module.css';

export interface PillarSectionProps {
  pillar: Pillar;
  /** Alterna a partir do índice: pares com mídia à direita, ímpares à esquerda. */
  flip?: boolean;
  tone?: 'light' | 'tint';
  /** Conteúdo da moldura. Sem ele, entra o placeholder marcado. */
  media?: ReactNode;
  /**
   * `alternado` — as duas colunas com o lado trocado por `flip`. É o ritmo da série.
   * `destaque` — declaração em coluna de leitura e a tela em largura total, embaixo.
   *   Reservado ao pilar de maior peso comercial; ver o comentário abaixo.
   */
  variante?: 'alternado' | 'destaque';
}

/**
 * Um pilar = um ato editorial de página inteira, não um card numa grade 2×2.
 *
 * A alternância esquerda/direita a partir de 1024px é o que dá ritmo à sequência.
 * Abaixo disso ela para: em coluna única, alternar só embaralha a ordem de leitura.
 *
 * POR QUE UM DELES QUEBRA A FORMA. Medido a 1280 com os quatro no mesmo molde, as
 * alturas eram 614 / 601 / 601 / 601 — três idênticas ao pixel, com a mesma grade e
 * exatamente três fatos cada. Cada seção isolada estava correta e o conjunto lia como
 * template, que é a assinatura de "alternating feature rows" que a doutrina descreve.
 * Peso comercial diferente não pode ter peso visual igual: biblioteca de soluções e
 * trilha em vídeo são commodity, o gerador de projeto não é — então é ele que ganha
 * a forma própria.
 *
 * E o destaque NÃO ganha mais motion, ganha menos: perde o parallax que os outros três
 * têm. A regra da casa é que cada ato recebe uma micro-interação diferente ou nenhuma,
 * e acrescentar efeito ao que já tem mais espaço seria dobrar a aposta no mesmo lugar.
 */
export function PillarSection({
  pillar,
  flip = false,
  tone = 'light',
  media,
  variante = 'alternado',
}: PillarSectionProps) {
  const destaque = variante === 'destaque';

  const moldura = (
    <Reveal>
      <DeviceFrame>
        {media ?? (
          <AssetPlaceholder label={`Print real · ${pillar.name}`} spec="2× do app · AVIF q55" />
        )}
      </DeviceFrame>
    </Reveal>
  );

  return (
    <Section id={pillar.slug} tone={tone} labelledBy={`${pillar.slug}-title`}>
      <div
        className={[styles.split, destaque ? styles.destaque : '', flip ? styles.flip : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.copy}>
          {/* `title`, não `display`: este cabeçalho vive numa coluna de metade da
              grade. Display aqui quebraria em cinco linhas. */}
          <SectionHeader
            id={`${pillar.slug}-title`}
            eyebrow={`${pillar.index} · ${pillar.name}`}
            title={pillar.title}
            sub={pillar.sub}
            size="title"
          />
          <Reveal index={2}>
            <div className={styles.facts}>
              <HairlineList
                direcao={destaque ? 'fileira' : 'coluna'}
                items={pillar.facts.map((fact, i) => (
                  <span key={i} dangerouslySetInnerHTML={{ __html: fact }} />
                ))}
              />
            </div>
          </Reveal>
        </div>

        {destaque ? (
          <div className={styles.media}>{moldura}</div>
        ) : (
          /* A mídia anda mais devagar que a coluna de texto: é o que dá profundidade
             à seção sem precisar de 3D nem de vídeo. */
          <Parallax className={styles.media} distance={flip ? 48 : -48}>
            {moldura}
          </Parallax>
        )}
      </div>
    </Section>
  );
}
