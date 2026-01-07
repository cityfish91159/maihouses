import { formatRelativeTime } from '../date';
import { STRINGS } from '../../constants/strings';

describe('formatRelativeTime', () => {
    it('should return "Just now" for recent times', () => {
        const now = Date.now();
        expect(formatRelativeTime(new Date(now).toISOString())).toBe(STRINGS.FEED.POST.TIME_JUST_NOW);
        expect(formatRelativeTime(new Date(now - 30 * 1000).toISOString())).toBe(STRINGS.FEED.POST.TIME_JUST_NOW);
    });

    it('should return minutes ago', () => {
        const now = Date.now();
        expect(formatRelativeTime(new Date(now - 5 * 60 * 1000).toISOString())).toBe(STRINGS.FEED.POST.TIME_MINUTES_AGO(5));
    });

    it('should return hours ago', () => {
        const now = Date.now();
        expect(formatRelativeTime(new Date(now - 3 * 60 * 60 * 1000).toISOString())).toBe(STRINGS.FEED.POST.TIME_HOURS_AGO(3));
    });

    it('should return days ago', () => {
        const now = Date.now();
        expect(formatRelativeTime(new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString())).toBe(STRINGS.FEED.POST.TIME_DAYS_AGO(2));
    });

    it('should handle future dates gracefully', () => {
        const future = Date.now() + 10000;
        expect(formatRelativeTime(new Date(future).toISOString())).toBe(STRINGS.FEED.POST.TIME_JUST_NOW);
    });

    it('should handle invalid dates gracefully', () => {
        expect(formatRelativeTime('invalid-date')).toBe('');
    });
});
