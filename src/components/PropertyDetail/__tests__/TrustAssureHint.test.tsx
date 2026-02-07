import { render, screen, fireEvent } from '@testing-library/react';
import { TrustAssureHint } from '../TrustAssureHint';

describe('TrustAssureHint', () => {
  it('情境 A 顯示藍色文案與容器樣式', () => {
    const onCheckedChange = vi.fn();

    const { container } = render(
      <TrustAssureHint
        isLoggedIn={true}
        trustEnabled={true}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    expect(screen.getByRole('checkbox', { name: /同時建立安心留痕案件/ })).toBeInTheDocument();
    expect(screen.getByText('交易紀錄會自動建立，幫你記錄每一步。')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-brand-50');
  });

  it('情境 B 顯示琥珀色文案與容器樣式', () => {
    const onCheckedChange = vi.fn();

    const { container } = render(
      <TrustAssureHint
        isLoggedIn={true}
        trustEnabled={false}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    expect(
      screen.getByRole('checkbox', { name: /同時要求經紀人開啟安心留痕/ })
    ).toBeInTheDocument();
    expect(screen.getByText('我們會在聯絡內容中附帶你的開啟要求。')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });

  it('情境 C 顯示藍色文案與容器樣式', () => {
    const onCheckedChange = vi.fn();

    const { container } = render(
      <TrustAssureHint
        isLoggedIn={false}
        trustEnabled={true}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    expect(screen.getByRole('checkbox', { name: /同時建立安心留痕案件/ })).toBeInTheDocument();
    expect(screen.getByText('不登入也可建立，後續可再綁定手機。')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-brand-50');
  });

  it('情境 D 顯示琥珀色文案與容器樣式', () => {
    const onCheckedChange = vi.fn();

    const { container } = render(
      <TrustAssureHint
        isLoggedIn={false}
        trustEnabled={false}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    expect(screen.getByRole('checkbox', { name: /請經紀人開啟安心留痕/ })).toBeInTheDocument();
    expect(screen.getByText('我們會在聯絡內容中附帶你的要求。')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });

  it('勾選 checkbox 會觸發 onCheckedChange', () => {
    const onCheckedChange = vi.fn();

    render(
      <TrustAssureHint
        isLoggedIn={true}
        trustEnabled={false}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('checkbox 應具有可見 focus 樣式與輔助 icon 無障礙屬性', () => {
    render(
      <TrustAssureHint
        isLoggedIn={true}
        trustEnabled={true}
        checked={false}
        onCheckedChange={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('focus-visible:ring-2');

    const icon = document.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('aria-labelledby 應正確指向 label 文字 span 的 id', () => {
    render(
      <TrustAssureHint
        isLoggedIn={true}
        trustEnabled={true}
        checked={false}
        onCheckedChange={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    const labelledById = checkbox.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();

    const labelSpan = document.getElementById(labelledById!);
    expect(labelSpan).toBeInTheDocument();
    expect(labelSpan?.tagName).toBe('SPAN');
    expect(labelSpan?.textContent).toBe('同時建立安心留痕案件');
  });
});
