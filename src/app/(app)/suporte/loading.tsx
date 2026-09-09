import { Skeleton } from '@/design-system/via';
import s from '@/components/suporte/suporte.module.css';
export default function CarregandoSuporte() {
  return (
    <div className={s.pagina} aria-label="Carregando ajuda" aria-busy="true">
      <Skeleton height={48} width="45%" />
      <Skeleton height={74} />
      <Skeleton height={240} />
    </div>
  );
}
