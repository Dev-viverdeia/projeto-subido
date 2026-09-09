import { ImagemPassoGuia } from './ImagemPassoGuia';
import s from './suporte.module.css';

export function PassosGuia({ slug, passos }: { slug: string; passos: string[] }) {
  return (
    <ol className={s.passos}>
      {passos.map((passo, i) => (
        <li key={i} className={s.passo}>
          <span aria-hidden="true">{i + 1}</span>
          <div className={s.conteudoPasso}>
            <p>{passo}</p>
            <ImagemPassoGuia slug={slug} texto={passo} indice={i} />
          </div>
        </li>
      ))}
    </ol>
  );
}
