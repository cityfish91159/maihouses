import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UAGFooter } from './UAGFooter';

describe('UAGFooter', () => {
  const mockUser = {
    points: 120,
    quota: {
      s: 3,
      a: 5,
    },
  };

  it('uses mock profile route when useMock is true', () => {
    render(
      <MemoryRouter>
        <UAGFooter user={mockUser} useMock={true} toggleMode={vi.fn()} />
      </MemoryRouter>
    );

    const href = screen.getByRole('link', { name: '個人資料' }).getAttribute('href');
    expect(href).toMatch(/\/uag\/profile\?mock=true$/);
  });

  it('uses live profile route when useMock is false', () => {
    render(
      <MemoryRouter>
        <UAGFooter user={mockUser} useMock={false} toggleMode={vi.fn()} />
      </MemoryRouter>
    );

    const href = screen.getByRole('link', { name: '個人資料' }).getAttribute('href');
    expect(href).toMatch(/\/uag\/profile$/);
  });
});
