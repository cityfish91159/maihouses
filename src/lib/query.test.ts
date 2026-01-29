import { parseFreeText } from './query';

describe('parseFreeText', () => {
  it('台中 西屯 3房 1500萬 → 結構化', () => {
    const r = parseFreeText('台中 西屯 3房 1500萬');
    expect(r.city).toBe('台中市');
    expect(r.dist).toBe('西屯區');
    expect(r.rooms).toBe(3);
    expect(r.priceMax).toBe(15000000);
  });

  it('台北大安兩房30坪近捷運', () => {
    const r = parseFreeText('台北大安兩房30坪近捷運');
    expect(r.city).toBe('台北市');
    expect(r.dist).toBe('大安區');
    expect(r.rooms).toBe(2);
    expect(r.area).toBe(30);
    expect(r.nearMRT).toBe(true);
  });

  it('新北 2000萬以下', () => {
    const r = parseFreeText('新北 2000萬以下');
    expect(r.city).toBe('新北市');
    expect(r.priceMax).toBe(20000000);
  });

  it('空字串不會報錯', () => {
    const r = parseFreeText('');
    expect(r).toEqual({});
  });
});
