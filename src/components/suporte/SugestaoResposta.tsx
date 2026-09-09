import Link from 'next/link';
import { Button } from '@/design-system/via';
import s from './suporte.module.css';
export function SugestaoResposta({
  sugestao,
  ocupado,
  usar,
  descartar,
}: {
  sugestao: { texto: string; fontes: string[] };
  ocupado: boolean;
  usar: () => void;
  descartar: () => void;
}) {
  return (
    <section className={s.pergunta} aria-label="Sugestão da IA">
      <strong>Revise antes de usar</strong>
      <p className={s.corpoSugestao}>{sugestao.texto}</p>
      <div className={s.acoes}>
        {sugestao.fontes.map((slug) => (
          <Link className={s.atalho} key={slug} href={`/ajuda/${slug}`} target="_blank">
            Consultar guia
          </Link>
        ))}
      </div>
      <Button variant="secondary" type="button" disabled={ocupado} onClick={usar}>
        Usar no rascunho
      </Button>
      <Button variant="ghost" type="button" onClick={descartar}>
        Descartar
      </Button>
      {ocupado && (
        <p className={s.meta}>
          Seu rascunho foi preservado. Esvazie o campo se quiser usar a sugestão.
        </p>
      )}
    </section>
  );
}
