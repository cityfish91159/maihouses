import { PHONE_DIGITS_MAX, PHONE_DIGITS_MIN } from './constants';

export type TimeSlot = { date: string; day: string; times: string[] };

const BOOKING_DAYS_AHEAD = 7;
const WEEKDAY_TIMES = ['14:00', '15:00', '19:00'] as const;
const WEEKEND_TIMES = ['10:00', '11:00', '14:00', '15:00', '16:00'] as const;

export const buildTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const days: string[] = ['日', '一', '二', '三', '四', '五', '六'];

  for (let i = 1; i <= BOOKING_DAYS_AHEAD; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const dayName = days[date.getDay()] ?? '日';

    const times =
      date.getDay() === 0 || date.getDay() === 6 ? [...WEEKEND_TIMES] : [...WEEKDAY_TIMES];

    slots.push({ date: dayStr, day: dayName, times });
  }

  return slots;
};

export const sanitizePhoneInput = (value: string): string => {
  const raw = value.replace(/[^\d+]/g, '');
  if (!raw) return '';
  return raw.startsWith('+') ? `+${raw.slice(1).replace(/\+/g, '')}` : raw.replace(/\+/g, '');
};

export const isValidPhone = (value: string): boolean => {
  const normalized = sanitizePhoneInput(value.trim());
  if (!/^\+?\d+$/.test(normalized)) return false;
  const digitsOnly = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  return digitsOnly.length >= PHONE_DIGITS_MIN && digitsOnly.length <= PHONE_DIGITS_MAX;
};
