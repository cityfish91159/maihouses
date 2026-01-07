import React from 'react';
import { render, cleanup } from '@testing-library/react';
import MascotInteractive from '../../MascotInteractive';

const mockFireConfetti = vi.fn();
const MockConfettiCanvas = () => <div data-testid="confetti-canvas" />;

vi.mock('../useConfetti', () => ({
	__esModule: true,
	useConfetti: () => ({ fireConfetti: mockFireConfetti, ConfettiCanvas: MockConfettiCanvas }),
}));

describe('MascotInteractive confetti edge trigger', () => {
	beforeEach(() => {
		mockFireConfetti.mockClear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	it('fires confetti only on mood edge and respects cooldown', () => {
		let eventCount = 0;
		const handler = () => { eventCount += 1; };
		window.addEventListener('mascot:celebrate', handler);

		const { rerender } = render(
			<MascotInteractive mood="celebrate" messages={["hi"]} />
		);

		// 初次進入 celebrate 觸發一次
		expect(mockFireConfetti).toHaveBeenCalledTimes(1);
		expect(eventCount).toBe(1);

		// 同 mood 重渲染不觸發
		rerender(<MascotInteractive mood="celebrate" messages={["hi"]} />);
		expect(mockFireConfetti).toHaveBeenCalledTimes(1);
		expect(eventCount).toBe(1);

		// 切回 idle，不觸發
		rerender(<MascotInteractive mood="idle" messages={["hi"]} />);
		expect(mockFireConfetti).toHaveBeenCalledTimes(1);
		expect(eventCount).toBe(1);

		// 等待冷卻（eventCelebrating 重置需要 2 秒），再進入 celebrate 會再觸發
		vi.advanceTimersByTime(2100);
		rerender(<MascotInteractive mood="celebrate" messages={["hi"]} />);
		expect(mockFireConfetti).toHaveBeenCalledTimes(2);
		expect(eventCount).toBe(2);

		window.removeEventListener('mascot:celebrate', handler);
	});
});
