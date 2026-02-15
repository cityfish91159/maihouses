import {
  parseCommunityWallTags,
  parsePropertyTags,
  parseScenarioTags,
  stripAllTags,
} from '../chatMessageParser';

describe('parseCommunityWallTags', () => {
  it('parses legacy format (no communityId)', () => {
    const result = parseCommunityWallTags('看看 [[社區牆:快樂花園:電梯問題]]');
    expect(result).toEqual([{ name: '快樂花園', topic: '電梯問題' }]);
  });

  it('parses new format with communityId', () => {
    const result = parseCommunityWallTags('[[社區牆:community-99:遠雄二代宅:停車位討論]]');
    expect(result).toEqual([
      { communityId: 'community-99', name: '遠雄二代宅', topic: '停車位討論' },
    ]);
  });

  it('parses multiple tags', () => {
    const content = '[[社區牆:A社區:話題A]] 中間文字 [[社區牆:community-live-99:B社區:話題B]]';
    const result = parseCommunityWallTags(content);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'A社區', topic: '話題A' });
    expect(result[1]).toEqual({ communityId: 'community-live-99', name: 'B社區', topic: '話題B' });
  });

  it('returns empty array for no tags', () => {
    expect(parseCommunityWallTags('普通文字')).toEqual([]);
  });

  it('skips malformed tags with fewer than 2 segments', () => {
    expect(parseCommunityWallTags('[[社區牆:只有一段]]')).toEqual([]);
  });

  it('handles colons in topic', () => {
    const result = parseCommunityWallTags('[[社區牆:社區A:話題:含冒號:部分]]');
    expect(result).toEqual([{ name: '社區A', topic: '話題:含冒號:部分' }]);
  });

  it('trims whitespace in segments', () => {
    const result = parseCommunityWallTags('[[社區牆: 社區A : 話題B ]]');
    expect(result).toEqual([{ name: '社區A', topic: '話題B' }]);
  });
});

describe('parsePropertyTags', () => {
  it('parses property tag', () => {
    const result = parsePropertyTags('看看 [[物件:陽光社區:prop-123]]');
    expect(result).toEqual([{ community: '陽光社區', propertyId: 'prop-123' }]);
  });

  it('parses multiple property tags', () => {
    const content = '[[物件:A社區:p1]] 和 [[物件:B社區:p2]]';
    expect(parsePropertyTags(content)).toHaveLength(2);
  });

  it('returns empty array for no tags', () => {
    expect(parsePropertyTags('普通文字')).toEqual([]);
  });

  it('trims whitespace', () => {
    const result = parsePropertyTags('[[物件: 社區A : id-1 ]]');
    expect(result).toEqual([{ community: '社區A', propertyId: 'id-1' }]);
  });
});

describe('parseScenarioTags', () => {
  it('parses scenario tag', () => {
    const result = parseScenarioTags('[[情境:這是一個買房情境描述]]');
    expect(result).toHaveLength(1);
    expect(result[0]?.description).toBe('這是一個買房情境描述');
    expect(result[0]?.key).toMatch(/^scenario-\d+$/);
  });

  it('parses multiple scenario tags with unique keys', () => {
    const content = '[[情境:情境A]] 中間 [[情境:情境B]]';
    const result = parseScenarioTags(content);
    expect(result).toHaveLength(2);
    expect(result[0]?.key).not.toBe(result[1]?.key);
  });

  it('returns empty array for no tags', () => {
    expect(parseScenarioTags('普通文字')).toEqual([]);
  });

  it('trims description whitespace', () => {
    const result = parseScenarioTags('[[情境: 有前後空白 ]]');
    expect(result[0]?.description).toBe('有前後空白');
  });
});

describe('stripAllTags', () => {
  it('removes all tag types', () => {
    const content = '前文 [[社區牆:A:B]] 中間 [[物件:C:D]] 後面 [[情境:E]]';
    expect(stripAllTags(content)).toBe('前文  中間  後面');
  });

  it('returns original text when no tags', () => {
    expect(stripAllTags('普通文字')).toBe('普通文字');
  });

  it('trims result', () => {
    expect(stripAllTags('  [[社區牆:A:B]]  ')).toBe('');
  });

  it('handles empty string', () => {
    expect(stripAllTags('')).toBe('');
  });
});
