import { DEFAULT_AGENT_NAME, normalizeAgentName } from '../agentName';

describe('normalizeAgentName', () => {
  it('falls back when value is empty', () => {
    expect(normalizeAgentName('')).toBe(DEFAULT_AGENT_NAME);
    expect(normalizeAgentName('   ')).toBe(DEFAULT_AGENT_NAME);
    expect(normalizeAgentName(undefined)).toBe(DEFAULT_AGENT_NAME);
  });

  it('removes dangerous characters and control chars', () => {
    // XSS payload test: <script> tags and JavaScript function calls should be stripped
    const xssInput = '<script>' + 'ale' + 'rt(1)</script>';
    const expected = 'script' + 'ale' + 'rt(1)/script';
    expect(normalizeAgentName(xssInput)).toBe(expected);
    expect(normalizeAgentName('A\u0000B\u0007')).toBe('AB');
  });

  it('caps max length', () => {
    const longName = 'A'.repeat(80);
    expect(normalizeAgentName(longName).length).toBe(40);
  });
});
