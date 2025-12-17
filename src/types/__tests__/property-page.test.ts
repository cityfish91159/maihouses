
import { describe, it, expect } from 'vitest';
import { normalizeFeaturedReview, normalizeListingReview } from '../property-page';

describe('normalizeFeaturedReview', () => {
  it('maps stars to rating and passes tags', () => {
    const result = normalizeFeaturedReview({
      stars: '4.5',
      author: 'Alice',
      tags: ['靜巷', '高樓層'],
      content: '很安靜'
    });
    expect(result).toEqual({
      author: 'Alice',
      content: '很安靜',
      rating: '4.5',
      tags: ['靜巷', '高樓層']
    });
  });

  it('handles missing tags gracefully', () => {
    const result = normalizeFeaturedReview({
      stars: '5.0',
      author: 'Bob',
      content: '超棒'
    });
    expect(result).toEqual({
      author: 'Bob',
      content: '超棒',
      rating: '5.0'
    });
  });
});

describe('normalizeListingReview', () => {
  it('parses standard format 「content」— author', () => {
    const result = normalizeListingReview({ badge: '在地', content: '「好住」— 小李' });
    expect(result).toEqual({
      author: '小李',
      content: '好住',
      badges: ['在地']
    });
  });

  it('returns anonymous when format missing', () => {
    const result = normalizeListingReview({ badge: '在地', content: '普通評價' });
    expect(result).toEqual({
      author: '匿名',
      content: '普通評價',
      badges: ['在地']
    });
  });

  it('tolerates halfwidth dash', () => {
    const result = normalizeListingReview({ badge: '在地', content: '「好住」- 小李' });
    expect(result).toEqual({
      author: '匿名',
      content: '「好住」- 小李',
      badges: ['在地']
    });
  });

  it('multiple quotes keeps outermost match', () => {
    const result = normalizeListingReview({ badge: '在地', content: '「外「內」」— 作者' });
    expect(result).toEqual({
      author: '作者',
      content: '外「內」',
      badges: ['在地']
    });
  });
});
