/** Formatação limitada: sem HTML, links ou imagens fornecidos pelo modelo. */
export function TextoAjuda({ texto }: { texto: string }) {
  return (
    <div>
      {texto
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((bloco, i) => (
          <p key={i}>
            {bloco
              .split(/(\*\*[^*\n]+\*\*)/g)
              .map((parte, j) =>
                parte.startsWith('**') && parte.endsWith('**') ? (
                  <strong key={j}>{parte.slice(2, -2)}</strong>
                ) : (
                  parte
                ),
              )}
          </p>
        ))}
    </div>
  );
}
