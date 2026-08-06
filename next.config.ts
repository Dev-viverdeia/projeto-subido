import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
