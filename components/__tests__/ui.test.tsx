// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Aviso, BotaoConfirmar, Kpi, Kpis, Pares } from '../ui/Basicos';
import { SubAbas } from '../ui/SubAbas';

afterEach(cleanup);

describe('Pares', () => {
  it('só marca como "longo" o texto corrido, não o valor curto', () => {
    const longo = 'Não há Plano de Gerenciamento de Resíduos Sólidos registrado para o estabelecimento.';
    const { container } = render(<Pares itens={[['Peso', '120 kg'], ['Fundamento', longo]]} />);
    const dds = container.querySelectorAll('dd');
    expect(dds[0].className).not.toContain('longo');
    expect(dds[1].className).toContain('longo');
  });
});

describe('Kpi', () => {
  it('aplica destaque e tom, e a grade conta os filhos', () => {
    const { container } = render(
      <Kpis>
        <Kpi rotulo="Irregulares" valor={4} sub="sem PGRS" tom="erro" destaque />
        <Kpi rotulo="Regulares" valor={4} />
        <Kpi rotulo="Total" valor={8} />
      </Kpis>
    );
    const cartoes = container.querySelectorAll('.kpi');
    expect(cartoes).toHaveLength(3);
    expect(cartoes[0].className).toContain('destaque');
    expect(cartoes[0].className).toContain('erro');
    expect(cartoes[1].className).not.toContain('destaque');
    expect(screen.getByText('Irregulares')).toBeTruthy();
  });
});

describe('Aviso', () => {
  it('mostra título e texto com o tom pedido', () => {
    const { container } = render(<Aviso tom="alerta" titulo="Atenção" texto="Prazo vencendo." />);
    expect(container.querySelector('.aviso.alerta')).toBeTruthy();
    expect(screen.getByText('Atenção')).toBeTruthy();
    expect(screen.getByText('Prazo vencendo.')).toBeTruthy();
  });
});

describe('BotaoConfirmar', () => {
  it('exige a segunda confirmação antes de agir, e cancelar não age', () => {
    const agir = vi.fn();
    render(<BotaoConfirmar rotulo="Desligar" pergunta="Desligar este cooperado?" onConfirmar={agir} />);
    fireEvent.click(screen.getByRole('button', { name: 'Desligar' }));
    expect(agir).not.toHaveBeenCalled();
    expect(screen.getByText('Desligar este cooperado?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(agir).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Desligar' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Desligar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(agir).toHaveBeenCalledTimes(1);
  });

  it('com motivo obrigatório, mantém Confirmar bloqueado até digitar', () => {
    const agir = vi.fn();
    render(<BotaoConfirmar rotulo="Suspender" pergunta="Suspender?" campo={{ rotulo: 'Motivo', obrigatorio: true }} onConfirmar={agir} />);
    fireEvent.click(screen.getByRole('button', { name: 'Suspender' }));
    const confirmar = screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement;
    expect(confirmar.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'documento vencido' } });
    expect(confirmar.disabled).toBe(false);
    fireEvent.click(confirmar);
    expect(agir).toHaveBeenCalledWith('documento vencido');
  });
});

describe('SubAbas', () => {
  function Exemplo() {
    const [atual, setAtual] = useState<'a' | 'b' | 'c'>('a');
    return <SubAbas idBase="t" atual={atual} aoEscolher={setAtual} rotulo="Frentes"
      opcoes={[['a', 'Primeira', 3], ['b', 'Segunda'], ['c', 'Terceira']]} />;
  }

  it('segue o padrão ARIA de abas: só a selecionada entra na ordem de Tab', () => {
    render(<Exemplo />);
    expect(screen.getByRole('tablist', { name: 'Frentes' })).toBeTruthy();
    const abas = screen.getAllByRole('tab');
    expect(abas.map(a => a.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(abas.map(a => a.tabIndex)).toEqual([0, -1, -1]);
    expect(abas[0].getAttribute('aria-controls')).toBe('t-painel-a');
  });

  it('setas movem seleção e foco, com volta ao início e ao fim', () => {
    render(<Exemplo />);
    const abas = screen.getAllByRole('tab');
    fireEvent.keyDown(abas[0], { key: 'ArrowRight' });
    expect(abas[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(abas[1]);

    fireEvent.keyDown(abas[1], { key: 'ArrowLeft' });
    fireEvent.keyDown(abas[0], { key: 'ArrowLeft' });
    expect(abas[2].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(abas[2]);
  });
});
