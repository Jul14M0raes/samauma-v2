'use client'; // Contorno de erro precisa ser Client Component

/* Rede de segurança para exceção não tratada — sem isto, um erro em
   qualquer tela mostra a página de erro genérica do Next, sem a cara do
   site nem caminho de volta. Segue o padrão visual do 404. */

import { useEffect } from 'react';
import { CabecalhoPublico } from '@/components/layout/CabecalhoPublico';
import { Voltar } from '@/components/ui/Basicos';

export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="portao" id="conteudo">
      <div className="portao-caixa">
        <CabecalhoPublico />
        <div className="nao-encontrado">
          <h1>Algo deu errado</h1>
          <p>A tela travou numa exceção que não era esperada. Tentar de novo resolve na maioria dos casos — se persistir, volte para a entrada.</p>
          <div className="acoes-form">
            <button type="button" className="btn" onClick={retry}>Tentar novamente</button>
            <Voltar para="/" rotulo="Voltar para a entrada" />
          </div>
        </div>
      </div>
    </main>
  );
}
