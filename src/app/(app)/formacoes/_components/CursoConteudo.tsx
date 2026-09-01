'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FormacaoCompleta } from '@/lib/conteudo/queries';
import { estadoDoProgresso } from '@/lib/progresso/local';
import { PillEstado } from '../../_components/PillEstado';
import { TrilhoProgresso } from '../../_components/TrilhoProgresso';
import { formatarDuracao } from '../../_components/tempo';
import { CurriculoCurso } from './CurriculoCurso';
import { useCurriculo } from './useCurriculo';
import styles from './CursoConteudo.module.css';

/** A tela do curso concentra título, progresso, próxima ação e currículo — uma
 * decisão por bloco. Um único `useCurriculo` alimenta todas as peças. */
export function CursoConteudo({ formacao }: { formacao: FormacaoCompleta }) {
  const curriculo = useCurriculo(formacao);
  const duracao = formatarDuracao(curriculo.duracaoTotalSeg);
  const estado = estadoDoProgresso(curriculo.feitas, curriculo.total);

  const hrefProxima = curriculo.proxima
    ? `/formacoes/${formacao.slug}/aula/${curriculo.proxima.id}`
    : null;
  const rotuloCta = curriculo.comecou ? 'Retomar aula' : 'Começar formação';
  /* O fallback usa a primeira aula DA FORMAÇÃO, não a do primeiro módulo. Assim,
     um currículo em montagem continua tendo CTA mesmo se o módulo de abertura
     ainda estiver vazio. Na conclusão, a interface troca a aula por projeto e
     certificado — revisar continua disponível diretamente na lista de aulas. */
  const hrefCta =
    hrefProxima ??
    (curriculo.planas[0] ? `/formacoes/${formacao.slug}/aula/${curriculo.planas[0].id}` : null);
  const aulaDoCta = curriculo.proxima ?? curriculo.planas[0] ?? null;
  const rotuloDestino = curriculo.comecou ? 'Continue de onde parou' : 'Sua primeira aula';

  /* Módulos e aulas são a ESTRUTURA do curso: entram sempre, inclusive em zero —
     "0 aulas" é um fato sobre um curso em montagem, não um número inventado. A
     duração é diferente: ela some quando nenhuma aula tem `duracao_seg`, porque
     "0 min" afirmaria que o curso não dura nada. */
  const metas = [
    `${curriculo.modulos.length} ${curriculo.modulos.length === 1 ? 'módulo' : 'módulos'}`,
    `${curriculo.total} ${curriculo.total === 1 ? 'aula' : 'aulas'}`,
    duracao,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className={styles.raiz}>
      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <div className={styles.identidade}>
            <p className={styles.eyebrow}>Formação</p>
            <PillEstado estado={estado} className={styles.selo} />
          </div>

          <h1 className={styles.titulo}>{formacao.titulo}</h1>
          {formacao.resumo && <p className={styles.resumo}>{formacao.resumo}</p>}

          <ul className={styles.metas}>
            {metas.map((m) => (
              <li key={m} className={styles.meta}>
                {m}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.progressoResumo}>
          <TrilhoProgresso
            itens={curriculo.planas}
            feitasIds={curriculo.feitasIds}
            proximo={curriculo.proxima}
            unidade={{ singular: 'aula', plural: 'aulas' }}
            denso
          />
        </div>
      </header>

      {curriculo.concluiu ? (
        <section className={styles.conclusao} role="status" aria-label="Próximo passo">
          <div className={styles.retomadaTexto}>
            <span>Próximo passo</span>
            <strong>Aplique o que aprendeu em um projeto.</strong>
            <small>Escolha um projeto ou compartilhe seu certificado.</small>
          </div>
          <div className={styles.acoesConclusao}>
            <Link href="/solucoes" className={styles.cta}>
              Escolher projeto
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link href={`/certificados/formacao/${formacao.slug}`} className={styles.ctaSecundario}>
              Ver certificado
            </Link>
          </div>
        </section>
      ) : hrefCta && aulaDoCta ? (
        <section className={styles.retomada} aria-label="Próxima aula">
          <div className={styles.retomadaTexto}>
            <span>{rotuloDestino}</span>
            <strong>{aulaDoCta.titulo}</strong>
            <small>
              {curriculo.feitas} de {curriculo.total}{' '}
              {curriculo.total === 1 ? 'aula concluída' : 'aulas concluídas'}
            </small>
          </div>
          <Link href={hrefCta} className={styles.cta}>
            {rotuloCta}
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section className={styles.curriculo} aria-labelledby="conteudo-formacao">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p>Conteúdo</p>
            <h2 id="conteudo-formacao">Aulas da formação</h2>
          </div>
          <span>
            {curriculo.modulos.length} {curriculo.modulos.length === 1 ? 'módulo' : 'módulos'} ·{' '}
            {curriculo.total} {curriculo.total === 1 ? 'aula' : 'aulas'}
          </span>
        </header>
        <CurriculoCurso
          formacaoSlug={formacao.slug}
          modulos={curriculo.modulos}
          moduloAbertoInicial={curriculo.moduloDaProximaId}
        />
      </section>
    </div>
  );
}
