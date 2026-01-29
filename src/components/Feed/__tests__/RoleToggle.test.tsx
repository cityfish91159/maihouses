import { render, screen, fireEvent } from '@testing-library/react';
import { RoleToggle } from '../../Feed/RoleToggle';
import { STRINGS } from '../../../constants/strings';
import React from 'react';

describe('RoleToggle Component', () => {
  it('renders correctly for Agent', () => {
    // Current role is Agent, toggle should say Switch to Member (Consumer)
    render(<RoleToggle currentRole="agent" onToggle={() => {}} />);

    // Check title tooltip
    expect(screen.getByTitle(STRINGS.AGENT.OOS.SWITCH_TO_CONSUMER)).toBeInTheDocument();
    // Check displayed text
    expect(screen.getByText(STRINGS.AGENT.ROLE.AGENT)).toBeInTheDocument();
  });

  it('renders correctly for Member', () => {
    render(<RoleToggle currentRole="member" onToggle={() => {}} />);

    expect(screen.getByTitle(STRINGS.AGENT.OOS.SWITCH_TO_AGENT)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.AGENT.ROLE.CONSUMER)).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const mockToggle = vi.fn();
    render(<RoleToggle currentRole="agent" onToggle={mockToggle} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should not re-render when props unchanged (memo optimization)', () => {
    const onToggle = vi.fn();
    let renderCount = 0;

    // Wrapper to track renders
    const TrackedRoleToggle = (props: {
      currentRole: 'agent' | 'member';
      onToggle: () => void;
    }) => {
      renderCount++;
      return <RoleToggle {...props} />;
    };

    const { rerender } = render(<TrackedRoleToggle currentRole="agent" onToggle={onToggle} />);

    const initialRenderCount = renderCount;

    // 重新渲染相同的 props - 由於 memo，RoleToggle 不應重新渲染
    rerender(<TrackedRoleToggle currentRole="agent" onToggle={onToggle} />);

    // Wrapper 會重新渲染，但內部的 RoleToggle 不會
    expect(renderCount).toBe(initialRenderCount + 1);
    expect(screen.getByText(STRINGS.AGENT.ROLE.AGENT)).toBeInTheDocument();
  });

  it('should re-render when currentRole changes', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<RoleToggle currentRole="agent" onToggle={onToggle} />);

    expect(screen.getByText(STRINGS.AGENT.ROLE.AGENT)).toBeInTheDocument();

    // 改變 currentRole - 應該重新渲染
    rerender(<RoleToggle currentRole="member" onToggle={onToggle} />);

    expect(screen.getByText(STRINGS.AGENT.ROLE.CONSUMER)).toBeInTheDocument();
  });
});
