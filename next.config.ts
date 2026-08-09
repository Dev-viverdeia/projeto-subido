import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* O preview local abre pelo navegador embutido em 127.0.0.1. Sem esta origem,
     o Next bloqueia os chunks de hidratação: a tela aparece, mas os controles
     não respondem durante a validação visual. */
  allowedDevOrigins: ['127.0.0.1'],
  /* A rota monta o PDF no servidor e lê estas fontes por caminho absoluto. O
     tracing precisa levá-las para a função da Vercel; sem isto funciona local e
     cai silenciosamente para outra tipografia em produção. */
  outputFileTracingIncludes: {
    '/api/propostas/[id]/pdf': ['./src/assets/fonts/pdf/*.ttf'],
  },
  images: {
    /* AVIF ANTES DE WEBP, e a ordem É a preferência de negociação: o Next serve o
       primeiro formato que o `Accept` do cliente aceitar e cai para o original no fim.
       Medido no recorte do hero (1024×1536 com alfa): PNG de origem 2,4 MB · WebP
       servido 244 kB · AVIF q90 148 kB, com o alfa intacto nos três. Sem esta linha o
       padrão do Next é só WebP, e a página que recebe o clique pago pagava 96 kB a
       mais justamente no elemento que é o seu LCP.
       O custo é CPU na primeira geração de cada variante, que fica em cache depois —
       troca óbvia para um asset que não muda. */
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
