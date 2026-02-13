import { __testHelpers, type RealReviewRow, type ServerSeed } from '../featured-reviews';

const {
  calculateRating,
  generateStableLetter,
  adaptRealReviewForUI,
  adaptSeedForUI,
  SERVER_SEEDS,
  REQUIRED_COUNT,
  DISPLAY_ID_LETTERS,
} = __testHelpers;

const buildRealReviewRow = (overrides?: Partial<RealReviewRow>): RealReviewRow => ({
  id: '5ef4f8be-2d8c-4c18-b573-fd2f9f1c40d1',
  community_id: '6959a167-1e23-4409-9c54-8475960a1d61',
  advantage_1: 'good-light',
  advantage_2: 'good-mgmt',
  disadvantage: null,
  source: 'resident',
  created_at: '2026-02-13T00:00:00.000Z',
  community_name: 'alpha-community',
  ...overrides,
});

const buildSeed = (overrides?: Partial<ServerSeed>): ServerSeed => ({
  id: 'seed-server-100',
  community_id: 'seed-c100',
  name: 'A-user|seed',
  rating: 5,
  tags: ['#good-mgmt'],
  content: 'seed review',
  source: 'seed',
  ...overrides,
});

describe('featured-reviews helpers', () => {
  describe('calculateRating', () => {
    it('returns 5 when no disadvantage', () => {
      expect(calculateRating(false)).toBe(5);
    });

    it('returns 4 when disadvantage exists', () => {
      expect(calculateRating(true)).toBe(4);
    });
  });

  describe('generateStableLetter', () => {
    it('returns a stable letter for the same review id', () => {
      const reviewId = 'ec2cd8e1-52f3-4bb8-a35e-63e64cd8ab8f';
      const first = generateStableLetter(reviewId);
      const second = generateStableLetter(reviewId);

      expect(first).toBe(second);
      expect(DISPLAY_ID_LETTERS.includes(first)).toBe(true);
    });

    it('does not return ambiguous letters', () => {
      const ids = [
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      ];

      for (const id of ids) {
        const letter = generateStableLetter(id);
        expect(letter).not.toBe('I');
        expect(letter).not.toBe('O');
      }
    });
  });

  describe('adaptRealReviewForUI', () => {
    it('uses source community name directly (no runtime rename patch)', () => {
      const row = buildRealReviewRow({
        community_name: 'test-community-api-stability',
      });

      const result = adaptRealReviewForUI(row);

      expect(result.name).toContain('test-community-api-stability');
      expect(result.name).not.toContain('minghu');
    });

    it('falls back to a safe name when community name is missing', () => {
      const result = adaptRealReviewForUI(buildRealReviewRow({ community_name: null }));

      expect(result.name).toContain('***');
      expect(result.name).not.toContain('undefined');
    });

    it('formats tags, content and rating from two-good-one-fair fields', () => {
      const row = buildRealReviewRow({
        advantage_1: 'a1',
        advantage_2: 'a2',
        disadvantage: 'd1',
      });

      const result = adaptRealReviewForUI(row);

      expect(result.tags).toEqual(['#a1', '#a2']);
      expect(result.content).toContain('a1');
      expect(result.content).toContain('a2');
      expect(result.content).toContain('d1');
      expect(result.rating).toBe(4);
    });

    it('uses fallback tag/content when no review fields are provided', () => {
      const result = adaptRealReviewForUI(
        buildRealReviewRow({
          advantage_1: null,
          advantage_2: null,
          disadvantage: null,
        })
      );

      expect(result.tags.length).toBe(1);
      expect(result.tags[0].startsWith('#')).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.rating).toBe(5);
    });

    it('maps source to different output names', () => {
      const agentResult = adaptRealReviewForUI(
        buildRealReviewRow({ source: 'agent', community_name: 'comm-x' })
      );
      const residentResult = adaptRealReviewForUI(
        buildRealReviewRow({ source: 'resident', community_name: 'comm-x' })
      );

      expect(agentResult.name).not.toBe(residentResult.name);
    });
  });

  describe('adaptSeedForUI', () => {
    it('derives displayId from first character of seed name', () => {
      const result = adaptSeedForUI(buildSeed({ name: 'Z-user|seed' }));

      expect(result.displayId).toBe('Z');
      expect(result.source).toBe('seed');
      expect(result.communityId).toBeNull();
    });
  });

  describe('constants', () => {
    it('keeps required count and seed volume aligned', () => {
      expect(REQUIRED_COUNT).toBe(6);
      expect(SERVER_SEEDS.length).toBeGreaterThanOrEqual(REQUIRED_COUNT);
    });
  });
});
