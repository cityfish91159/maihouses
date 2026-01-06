import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentSidebar } from '../AgentSidebar';
import { STRINGS } from '../../../constants/strings';
import { ROUTES } from '../../../constants/routes';

const mockStats = { score: 1000, days: 10, liked: 5, replies: 2, views: 100, contacts: 1 };
const mockTodos = [
    { id: '1', type: 'contact', content: 'Call client', isDone: false, time: '10:00' }
] as const;

describe('AgentSidebar', () => {
    it('renders navigation links with correct ROUTES', () => {
        render(
            <MemoryRouter>
                <AgentSidebar stats={mockStats} todos={mockTodos as any} />
            </MemoryRouter>
        );

        expect(screen.getByText(STRINGS.AGENT.SIDEBAR.NAV_TITLE)).toBeInTheDocument();

        const uagLink = screen.getByRole('link', { name: STRINGS.AGENT.SIDEBAR.LINK_UAG });
        expect(uagLink).toHaveAttribute('href', ROUTES.UAG);

        const trustLink = screen.getByRole('link', { name: STRINGS.AGENT.SIDEBAR.LINK_TRUST });
        expect(trustLink).toHaveAttribute('href', ROUTES.ASSURE);
    });

    it('renders Todo items', () => {
        render(
            <MemoryRouter>
                <AgentSidebar stats={mockStats} todos={mockTodos as any} />
            </MemoryRouter>
        );

        expect(screen.getByText('Call client', { exact: false })).toBeInTheDocument();
    });

    it('renders empty state for Todos', () => {
        render(
            <MemoryRouter>
                <AgentSidebar stats={mockStats} todos={[]} />
            </MemoryRouter>
        );

        expect(screen.getByText(STRINGS.AGENT.SIDEBAR.TODO_EMPTY)).toBeInTheDocument();
    });
});
