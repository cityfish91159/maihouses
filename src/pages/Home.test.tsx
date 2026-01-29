import { render, screen } from '@testing-library/react';
import Home from './Home';
import { MemoryRouter } from 'react-router-dom';
import { MaiMaiProvider } from '../context/MaiMaiContext';
import type { AppConfig, RuntimeOverrides } from '../app/config';

// Mock services to prevent network calls
vi.mock('../services/api', () => ({
  getMeta: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      maintenance: false,
      backendVersion: '1.0.0',
      apiVersion: 'v1',
    },
  }),
  apiFetch: vi.fn().mockResolvedValue({ ok: true, data: {} }),
}));

vi.mock('../services/uag', () => ({
  trackEvent: vi.fn(),
}));

// Mock child components to isolate Home logic
vi.mock('../components/Header/Header', () => ({
  default: () => <div data-testid="mock-header">Header</div>,
}));
vi.mock('../features/home/sections/HeroAssure', () => ({
  default: () => <div data-testid="mock-hero">HeroAssure</div>,
}));
vi.mock('../features/home/sections/SmartAsk', () => ({
  default: () => <div data-testid="mock-smart-ask">SmartAsk</div>,
}));
vi.mock('../features/home/sections/CommunityTeaser', () => ({
  default: () => <div data-testid="mock-community-teaser">CommunityTeaser</div>,
}));
vi.mock('../components/WarmWelcomeBar', () => ({
  WarmWelcomeBar: () => <div data-testid="mock-warm-welcome">WarmWelcomeBar</div>,
}));

const mockConfig: AppConfig & RuntimeOverrides = {
  apiBaseUrl: 'https://api.example.com',
  appVersion: '1.0.0',
  minBackend: '1.0.0',
  features: {
    heroAssure: true,
    smartAsk: true,
    propertyGrid: true,
  },
};

describe('Home Page', () => {
  it('renders all main sections when features are enabled', () => {
    render(
      <MaiMaiProvider>
        <MemoryRouter>
          <Home config={mockConfig} />
        </MemoryRouter>
      </MaiMaiProvider>
    );

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-warm-welcome')).toBeInTheDocument();
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
    expect(screen.getByTestId('mock-smart-ask')).toBeInTheDocument();
    expect(screen.getByTestId('mock-community-teaser')).toBeInTheDocument();

    // Check for the iframe
    const iframe = screen.getByTitle('房源清單');
    expect(iframe).toBeInTheDocument();
  });

  it('hides sections when disabled in config', () => {
    const disabledConfig = {
      ...mockConfig,
      features: {
        heroAssure: false,
        smartAsk: false,
        propertyGrid: false,
      },
    };

    render(
      <MaiMaiProvider>
        <MemoryRouter>
          <Home config={disabledConfig} />
        </MemoryRouter>
      </MaiMaiProvider>
    );

    expect(screen.queryByTestId('mock-hero')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-smart-ask')).not.toBeInTheDocument();
    expect(screen.queryByTitle('房源清單')).not.toBeInTheDocument();

    // CommunityTeaser is always shown in current implementation
    expect(screen.getByTestId('mock-community-teaser')).toBeInTheDocument();
  });
});
