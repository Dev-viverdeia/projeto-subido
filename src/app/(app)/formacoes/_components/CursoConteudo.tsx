'use client';

import Link from 'next/link';
import { Button } from '@/design-system/via';
import type { FormacaoCompleta } from '@/lib/conteudo/queries';
import { formatarDuracao } from '../../_components/tempo';
import { CurriculoCurso } from './CurriculoCurso';
import { useCurriculo } from './useCurriculo';
import styles from './CursoConteudo.module.css';

/**
 * A tela do curso abaixo do "voltar": hero mesh-navy + currículo + resumo sticky.
 * Um único `useCurriculo` alimenta as três partes — por construção, o % do hero,
 * os checks da lista e o número do resumo nunca discordam.
 *
 * O hero é a ÚNICA superfície escura da tela (regra da casa), e é nela que o CTA
 * primário vira accent — o único lugar onde o azul é legível (6,5:1).
 */
export function CursoConteudo({ formacao }: { formacao: FormacaoCompleta }) {
  const curriculo = useCurriculo(formacao);
  const duracao = formatarDuracao(curriculo.duracaoTotalSeg);

  const hrefProxima = curriculo.proxima
    ? `/formacoes/${formacao.slug}/aula/${curriculo.proxima.id}`
    : null;
  const rotuloCta = curriculo.concluiu
    ? 'Revisar curso'
    : curriculo.comecou
      ? 'Continuar'
      : 'Começar curso';
  /* Concluiu tudo → revisar leva à primeira aula. */
  const hrefCta =
    hrefProxima ??
    (formacao.modulos[0]?.aulas[0]
      ? `/formacoes/${formacao.slug}/aula/${formacao.modulos[0].aulas[0].id}`
      : null);

  return (
    <div className={styles.raiz}>
      <header className={`${styles.hero} via-mesh-navy via-noise`}>
        <span className={styles.sheen} aria-hidden="true" />
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Formação</p>
          <h1 className={styles.titulo}>{formacao.titulo}</h1>
          {formacao.resumo && <p className={styles.resumo}>{formacao.resumo}</p>}

          <p className={styles.stats}>
            <span>{curriculo.modulos.length} módulos</span>
            <span aria-hidden="true">·</span>
            <span>{curriculo.total} aulas</span>
            {duracao && (
              <>
                <span aria-hidden="true">·</span>
                <span>{duracao}</span>
              </>
            )}
          </p>

          {curriculo.comecou && (
            <div className={styles.progresso}>
              <div className={styles.trilho} aria-hidden="true">
                <div
                  className={styles.preenchido}
                  style={{ transform: `scaleX(${Math.max(0.02, curriculo.pct / 100)})` }}
                />
              </div>
              <span className={styles.pct}>
                {curriculo.feitas}/{curriculo.total} aulas
              </span>
            </div>
          )}

          {hrefCta && (
            <div className={styles.cta}>
              <Link href={hrefCta}>
                <Button variant="primary">{rotuloCta}</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className={styles.corpo}>
        <section className={styles.curriculo} aria-label="Conteúdo do curso">
          <h2 className={styles.tituloSecao}>Conteúdo do curso</h2>
          <CurriculoCurso
            formacaoSlug={formacao.slug}
            modulos={curriculo.modulos}
            moduloAbertoInicial={curriculo.moduloDaProximaId}
          />
        </section>

        <aside className={styles.lateral} aria-label="Seu progresso">
          <p className={styles.lateralEyebrow}>Seu progresso</p>
          <p className={styles.lateralPct}>{curriculo.pct}%</p>
          <div className={styles.lateralTrilho} aria-hidden="true">
            <div
              className={styles.lateralPreenchido}
              style={{ transform: `scaleX(${Math.max(0.02, curriculo.pct / 100)})` }}
            />
          </div>
          <hr className={styles.fio} />
          {curriculo.concluiu ? (
            <p className={styles.lateralTexto}>
              Você concluiu todas as aulas. O certificado entra quando a emissão for ligada.
            </p>
          ) : (
            <>
              <p className={styles.lateralRotulo}>
                {curriculo.comecou ? 'Próxima aula' : 'Primeira aula'}
              </p>
              <p className={styles.lateralAula}>{curriculo.proxima?.titulo}</p>
            </>
          )}
          {hrefCta && (
            <Link href={hrefCta} className={styles.lateralCta}>
              <Button variant="primary" fullWidth>
                {rotuloCta}
              </Button>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
