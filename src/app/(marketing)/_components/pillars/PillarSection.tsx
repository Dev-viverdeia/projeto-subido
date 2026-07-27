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
}

/**
 * Um pilar = um ato editorial de página inteira, não um card numa grade 2×2.
 *
 * A alternância esquerda/direita a partir de 1024px é o que dá ritmo à sequência.
 * Abaixo disso ela para: em coluna única, alternar só embaralha a ordem de leitura.
 */
export function PillarSection({ pillar, flip = false, tone = 'light', media }: PillarSectionProps) {
  return (
    <Section id={pillar.slug} tone={tone} labelledBy={`${pillar.slug}-title`}>
      <div className={[styles.split, flip ? styles.flip : ''].filter(Boolean).join(' ')}>
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
                items={pillar.facts.map((fact, i) => (
                  <span key={i} dangerouslySetInnerHTML={{ __html: fact }} />
                ))}
              />
            </div>
          </Reveal>
        </div>

        {/* A mídia anda mais devagar que a coluna de texto: é o que dá profundidade
            à seção sem precisar de 3D nem de vídeo. */}
        <Parallax className={styles.media} distance={flip ? 48 : -48}>
          <Reveal>
            <DeviceFrame>
              {media ?? (
                <AssetPlaceholder
                  label={`Print real · ${pillar.name}`}
                  spec="2× do app · AVIF q55"
                />
              )}
            </DeviceFrame>
          </Reveal>
        </Parallax>
      </div>
    </Section>
  );
}
