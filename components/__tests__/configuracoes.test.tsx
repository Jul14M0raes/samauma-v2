// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecadoProvider } from '../layout/RecadoProvider';
import { Configuracoes } from '../configuracoes/Configuracoes';

const baixar = vi.hoisted(() => vi.fn());
vi.mock('@/lib/servicos/arquivo', () => ({ baixarBlob: baixar, carimboArquivo: () => '20261005' }));

const DADOS = {
  'samauma.next.demandas.v1': '{"n":1}',
  'samauma.next.cadastros.v1': '[1]'
};

function montar() {
  return render(<RecadoProvider><Configuracoes /></RecadoProvider>);
}

function escolherArquivo(conteudo: string) {
  const entrada = document.querySelector('input[type=file]') as HTMLInputElement;
  const arquivo = new File([conteudo], 'backup.json', { type: 'application/json' });
  Object.defineProperty(arquivo, 'text', { value: () => Promise.resolve(conteudo) });
  fireEvent.change(entrada, { target: { files: [arquivo] } });
}

beforeEach(() => {
  localStorage.clear();
  for (const [k, v] of Object.entries(DADOS)) localStorage.setItem(k, v);
  localStorage.setItem('samauma.next.sidebar.v1', '1');
  baixar.mockClear();
});
afterEach(cleanup);

describe('Configurações — cópia de segurança', () => {
  it('baixa um arquivo com os dados do sistema e sem as preferências do aparelho', async () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar backup' }));
    expect(baixar).toHaveBeenCalledTimes(1);
    const [blob, nome] = baixar.mock.calls[0] as [Blob, string];
    expect(nome).toBe('samauma-backup-20261005.json');
    const arquivo = JSON.parse(await blob.text());
    expect(Object.keys(arquivo.chaves).sort()).toEqual(Object.keys(DADOS).sort());
  });

  it('arquivo inválido é recusado e não pede confirmação nem mexe nos dados', async () => {
    montar();
    escolherArquivo('isso não é um backup');
    await waitFor(() => expect(screen.getByText('O arquivo não é um JSON válido.')).toBeTruthy());
    expect(screen.queryByText('Substituir os dados deste aparelho?')).toBeNull();
    expect(localStorage.getItem('samauma.next.demandas.v1')).toBe('{"n":1}');
  });

  it('arquivo válido só substitui depois da confirmação, e cancelar preserva tudo', async () => {
    montar();
    const novo = JSON.stringify({ app: 'samauma', versao: 1, geradoEm: new Date().toISOString(), chaves: { 'samauma.next.vendas.v1': '[]' } });
    escolherArquivo(novo);
    await screen.findByText('Substituir os dados deste aparelho?');
    expect(localStorage.getItem('samauma.next.demandas.v1')).toBe('{"n":1}');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Substituir os dados deste aparelho?')).toBeNull();
    expect(localStorage.getItem('samauma.next.demandas.v1')).toBe('{"n":1}');

    escolherArquivo(novo);
    await screen.findByText('Substituir os dados deste aparelho?');
    fireEvent.click(screen.getByRole('button', { name: 'Substituir dados' }));
    expect(localStorage.getItem('samauma.next.demandas.v1')).toBeNull();
    expect(localStorage.getItem('samauma.next.vendas.v1')).toBe('[]');
    expect(localStorage.getItem('samauma.next.sidebar.v1')).toBe('1');
  });
});
