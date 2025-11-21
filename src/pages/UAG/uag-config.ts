import { Grade } from './types/uag.types';

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
};

export const UAG_GRADE_PRICE: Record<Grade, number> = {
  S: 500,
  A: 300,
  B: 150,
  C: 80,
  F: 20,
};

export const UAG_PROTECTION_HOURS: Record<Grade, number> = {
  S: 72,
  A: 48,
  B: 24,
  C: 12,
  F: 0,
};

// Legacy constant support
export const GRADE_HOURS: Record<Grade, number> = { 
    S: 120, 
    A: 72, 
    B: 336, 
    C: 336, 
    F: 336 
};
