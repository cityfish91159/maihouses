import { describe, expect, it } from 'vitest';
import { __reviewTestHelpers, type AgentRow, type PropertyRow, type ReviewRow } from '../wall';

const { cleanText, normalizeCount, buildAgentPayload, transformReviewRecord } = __reviewTestHelpers;

const REVIEW_ID = '11111111-1111-1111-1111-111111111111';
const COMMUNITY_ID = '22222222-2222-2222-2222-222222222222';
const AGENT_ID = '44444444-4444-4444-4444-444444444444';
const PROPERTY_ID = '33333333-3333-3333-3333-333333333333';
const ISO_DATE = '2024-01-01T00:00:00.000Z';

const withDefaults = (overrides: Partial<ReviewRow> = {}): ReviewRow => ({
  id: REVIEW_ID,
  community_id: COMMUNITY_ID,
  author_id: AGENT_ID,
  content: {
    pros: ['  交通便利  '],
    cons: ' 管委會嚴謹 ',
    property_title: '示範社區',
  },
  source_platform: 'agent',
  created_at: ISO_DATE,
  ...overrides,
});

const buildAgent = (overrides: Partial<AgentRow> = {}): AgentRow => ({
  id: AGENT_ID,
  name: '張房仲',
  company: '邁房子不動產',
  visit_count: 8,
  deal_count: 3,
  ...overrides,
});

const buildProperty = (overrides: Partial<PropertyRow> = {}): PropertyRow => ({
  id: PROPERTY_ID,
  title: '預設房源',
  agent_id: AGENT_ID,
  ...overrides,
});

describe('community wall helpers', () => {
  it('normalizes whitespace-only strings safely', () => {
    expect(cleanText('  測試  ')).toBe('測試');
    expect(cleanText(undefined)).toBe('');
  });

  it('normalizes visit/deal counters to non-negative numbers', () => {
    expect(normalizeCount(null)).toBe(0);
    expect(normalizeCount(-5)).toBe(0);
    expect(normalizeCount(12)).toBe(12);
  });

  it('builds agent payloads with normalized stats', () => {
    const agent = buildAgent({ visit_count: -10, deal_count: null, company: null });
    const payload = buildAgentPayload(agent);

    expect(payload).toBeDefined();
    expect(payload?.name).toBe('張房仲');
    expect(payload?.company).toBe('');
    expect(payload?.stats).toEqual({ visits: 0, deals: 0 });
  });

  it('merges review content with agent details', () => {
    const record = withDefaults({
      content: {
        pros: ['  交通便利  ', ' 有管理 '],
        cons: ' 管委會嚴謹 ',
        property_title: '華廈 A',
      },
    });
    const propertyMap = new Map([[PROPERTY_ID, buildProperty({ title: '華廈 A' })]]);
    const agentMap = new Map([[AGENT_ID, buildAgent({ visit_count: 5, deal_count: 2 })]]);

    const result = transformReviewRecord(record, propertyMap, agentMap);

    expect(result.agent?.stats).toEqual({ visits: 5, deals: 2 });
    expect(result.content.pros).toEqual(['交通便利', '有管理']);
    expect(result.content.property_title).toBe('華廈 A');
    expect(result.author_id).toBe(AGENT_ID);
  });

  it('falls back to resident info when no agent is attached', () => {
    const record = withDefaults({
      author_id: null,
      source_platform: 'resident',
      content: {
        pros: [],
        cons: ' 管委會嚴謹 ',
        property_title: null,
      },
    });
    const result = transformReviewRecord(record, new Map(), new Map());

    expect(result.agent?.name).toBe('住戶');
    expect(result.agent?.stats).toEqual({ visits: 0, deals: 0 });
  });

  it('falls back to property agent when author_id is missing', () => {
    const record = withDefaults({
      author_id: null,
      property_id: PROPERTY_ID,
      source_platform: null,
      content: {
        pros: [' 採光好 '],
        cons: ' 管委會嚴謹 ',
        property_title: null,
      },
    });

    const propertyMap = new Map([[PROPERTY_ID, buildProperty({ agent_id: AGENT_ID, title: '河景宅' })]]);
    const agentMap = new Map([[AGENT_ID, buildAgent({ visit_count: 1, deal_count: 0 })]]);

    const result = transformReviewRecord(record, propertyMap, agentMap);

    expect(result.author_id).toBe(AGENT_ID);
    expect(result.agent?.stats).toEqual({ visits: 1, deals: 0 });
    expect(result.content.property_title).toBe('河景宅');
  });
});
