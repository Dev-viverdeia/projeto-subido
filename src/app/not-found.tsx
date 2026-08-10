import Link from 'next/link';
import { Compass } from 'lucide-react';
import { ViverDeIaLogo } from '@/components/brand/ViverDeIaLogo';
import { EstadoSistema } from './(app)/_components/EstadoSistema';
import styles from './estado-global.module.css';

export default function NaoEncontradoGlobal() {
  return (
    <main className={styles.pagina}>
      <header className={styles.marca}>
        <ViverDeIaLogo size="compact" />
        <span>Sistema operacional do profissional de IA</span>
      </header>

      <EstadoSistema
        icone={<Compass size={30} strokeWidth={1.6} />}
        etiqueta="Erro 404"
        titulo="Esse caminho não existe por aqui."
        descricao="O endereço pode estar incompleto ou ter mudado. Você pode voltar direto para a plataforma ou conhecer a experiência Subido."
        acoes={
          <>
            <Link href="/inicio" className="via-btn via-btn--primary via-btn--md">
              Entrar na plataforma
            </Link>
            <Link href="/" className="via-btn via-btn--secondary via-btn--md">
              Ir para a página inicial
            </Link>
          </>
        }
        passos={[
          { rotulo: 'Já tem acesso', valor: 'Continue pelo Mapa da Jornada.' },
          { rotulo: 'Está conhecendo', valor: 'Volte para a apresentação do produto.' },
        ]}
      />
    </main>
  );
}
