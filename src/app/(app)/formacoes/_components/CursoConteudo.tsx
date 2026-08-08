'use client';

import Link from 'next/link';
import { Button } from '@/design-system/via';
import type { FormacaoCompleta } from '@/lib/conteudo/queries';
import { estadoDoProgresso } from '@/lib/progresso/local';
import { PillEstado } from '../../_components/PillEstado';
import { TrilhoProgresso } from '../../_components/TrilhoProgresso';
import { formatarDuracao } from '../../_components/tempo';
import { CurriculoCurso } from './CurriculoCurso';
import { useCurriculo } from './useCurriculo';
import styles from './CursoConteudo.module.css';

/**
 * A tela do curso: hero mesh-navy + currículo + trilho de progresso.
 *
 * O HERO ESCURO FICA, e essa foi uma decisão contra a alternativa fácil. A ficha
 * de solução abre clara; alinhar as duas telas pelo mesmo cabeçalho seria a
 * consistência mais óbvia — e a errada. Formação e solução não têm o mesmo peso
 * no produto: uma é uma trilha de semanas, a outra é uma receita de uma tarde.
 * "Seções com peso comercial diferente não podem ter peso visual igual" é regra
 * escrita da casa. O que se unifica são as PEÇAS (selo de estado, pills de meta,
 * trilho de progresso), não a temperatura da banda.
 *
 * O QUE SAIU: a duplicata. Esta tela mostrava a MESMA barra de progresso duas
 * vezes — uma no hero, outra na lateral — e o MESMO CTA duas vezes. Dois lugares
 * dizendo o mesmo número é um lugar a mais para desalinhar, e foi assim que a
 * ficha de solução acabou com uma barra que contradizia a lista ao lado. Agora o
 * progresso mora só no trilho, e o CTA só no hero, onde ele é accent sobre navy
 * (6,52:1 — o único lugar da marca em que esse azul é legível).
 *
 * Um único `useCurriculo` alimenta hero, lista e trilho: por construção, o selo,
 * os checks e o número nunca discordam.
 */
export function CursoConteudo({ formacao }: { formacao: FormacaoCompleta }) {
  const curriculo = useCurriculo(formacao);
  const duracao = formatarDuracao(curriculo.duracaoTotalSeg);
  const estado = estadoDoProgresso(curriculo.feitas, curriculo.total);

  const hrefProxima = curriculo.proxima
    ? `/formacoes/${formacao.slug}/aula/${curriculo.proxima.id}`
    : null;
  const rotuloCta = curriculo.concluiu
    ? 'Revisar curso'
    : curriculo.comecou
      ? 'Continuar'
      : 'Começar curso';
  /* Concluiu tudo → revisar leva à primeira aula DO CURSO, não à primeira aula do
     primeiro módulo. Lendo `modulos[0].aulas[0]`, um curso cujo módulo de abertura
     ainda não tem aula cadastrada — o caso normal de um currículo em montagem —
     ficava sem CTA nenhum, mesmo com dezenas de aulas nos módulos seguintes.
     `curriculo.planas` já é a ordem global achatada. */
  const hrefCta =
    hrefProxima ??
    (curriculo.planas[0] ? `/formacoes/${formacao.slug}/aula/${curriculo.planas[0].id}` : null);

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
      <header className={`${styles.hero} via-noise`}>
        <span className={styles.sheen} aria-hidden="true" />
        <div className={styles.heroTexto}>
          <div className={styles.identidade}>
            <p className={styles.eyebrow}>Formação</p>
            {/* O MESMO selo do card do catálogo, na variante escura: a escala de
                cinza inverte sobre navy, então não é a mesma pill recolorida. */}
            <PillEstado estado={estado} tom="onnavy" className={styles.selo} />
          </div>

          <h1 className={styles.titulo}>{formacao.titulo}</h1>
          {formacao.resumo && <p className={styles.resumo}>{formacao.resumo}</p>}

          {/* Pills, não uma frase com `·`. É a mesma forma da ficha de solução —
              o que muda é o tom, porque aqui elas vivem sobre banda escura. */}
          <ul className={styles.metas}>
            {metas.map((m) => (
              <li key={m} className={styles.meta}>
                {m}
              </li>
            ))}
          </ul>

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

        <aside className={styles.lateral}>
          {/* SEM botão próprio: o `href`/`aoContinuar` fica de fora de propósito.
              O CTA já está no hero, e um segundo controle com o mesmo destino a
              uma rolagem de distância é o tipo de duplicata que esta tela tinha.
              Quem já rolou até aqui tem a aula atual marcada na lista ao lado. */}
          <TrilhoProgresso
            itens={curriculo.planas}
            feitasIds={curriculo.feitasIds}
            proximo={curriculo.proxima}
            unidade={{ singular: 'aula', plural: 'aulas' }}
            notaFinal="Salvo na sua conta para continuar em qualquer dispositivo."
          />
        </aside>
      </div>
    </div>
  );
}
