import { notFound } from 'next/navigation';
import { IntegracaoGoogleCalendar } from '@/app/(app)/conta/_components/IntegracaoGoogleCalendar';
import s from '@/components/suporte/suporte.module.css';

/** Componente real, com estado demonstrativo. Nunca inicia OAuth ou envia convites. */
export default async function PreviewAgendaConta({
  searchParams,
}: PageProps<'/preview/agenda-conta'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const conectado = (await searchParams).estado === 'conectado';
  return (
    <main className={s.publico}>
      <h1 className={s.titulo}>Minha conta</h1>
      <IntegracaoGoogleCalendar
        calendar={{
          configurado: true,
          conectado,
          email: conectado ? 'profissional@example.test' : null,
          status: conectado ? 'ativa' : 'desconectada',
          ultimoErro: null,
        }}
      />
    </main>
  );
}
