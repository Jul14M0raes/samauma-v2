import type { NextConfig } from "next";

/* Publicacao no GitHub Pages.
   O Pages serve arquivo pronto, sem Node do lado do servidor: por isso o Next
   precisa exportar o site inteiro como HTML estatico. O `basePath` existe
   porque o endereco publico e /samauma-v2, e nao a raiz do dominio. */
const CAMINHO_BASE = "/samauma-v2";

const nextConfig: NextConfig = {
  output: "export",
  basePath: CAMINHO_BASE,
  /* Arquivos de `public/` nao ganham o prefixo sozinhos: o codigo le daqui. */
  env: { NEXT_PUBLIC_CAMINHO_BASE: CAMINHO_BASE },
  trailingSlash: true,
  images: { unoptimized: true }
};

export default nextConfig;
