import styles from './pagina.module.css';

export default function LoadingProspeccao() {
  return (
    <div className={styles.pagina} aria-busy="true" aria-label="Carregando Prospecção">
      <div className={styles.esqueletoCabecalho} />
      <div className={styles.esqueletoFormulario} />
      <div className={styles.esqueletoResultados} />
    </div>
  );
}
