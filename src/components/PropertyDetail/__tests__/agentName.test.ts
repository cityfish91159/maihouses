import { DEFAULT_AGENT_NAME, normalizeAgentName } from '../agentName';

describe('normalizeAgentName', () => {
  it('falls back when value is empty', () => {
    expect(normalizeAgentName('')).toBe(DEFAULT_AGENT_NAME);
    expect(normalizeAgentName('   ')).toBe(DEFAULT_AGENT_NAME);
    expect(normalizeAgentName(undefined)).toBe(DEFAULT_AGENT_NAME);
  });

  it('removes dangerous characters and control chars', () => {
    expect(normalizeAgentName('<script>evilCall(1)</script>')).toBe('scriptevilCall(1)/script');
    expect(normalizeAgentName('A\u0000B\u0007')).toBe('AB');
  });

  it('caps max length', () => {
    const longName = 'A'.repeat(80);
    expect(normalizeAgentName(longName).length).toBe(40);
  });
});
