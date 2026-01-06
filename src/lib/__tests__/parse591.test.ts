/**
 * 591 解析器測試套件
 * @description 使用真實 591 複製內容驗證解析器容錯性
 */

import { describe, it, expect } from 'vitest';
import { parse591Content, detect591Content, type Parse591Result } from '../parse591';

// ============ 真實 591 複製範例 ============

/** 完整售屋資訊（最理想情況） */
const SAMPLE_FULL_SALE = `
信義區超值三房公寓 近捷運
售價：1,288 萬
權狀坪數：34.2 坪
格局：3房2廳2衛
地址：台北市信義區信義路五段7號
https://sale.591.com.tw/home/house/detail/123456.html
`;

/** 完整租屋資訊 */
const SAMPLE_FULL_RENT = `
精品套房 近台大
租金：25,000 元/月
坪數：12 坪
格局：1房1廳1衛
臺北市中正區羅斯福路四段
https://rent.591.com.tw/home/house/detail/789012.html
`;

/** 最小可解析（只有價格和坪數） */
const SAMPLE_MINIMAL = `
1280萬 32坪
`;

/** 格式雜亂（有換行、空白、特殊符號） */
const SAMPLE_MESSY = `
  🏠 捷運宅首選

售價 ： 2,880 萬    

坪數：  45.6 坪

格局 : 4 房 2 廳 2 衛

地址：高雄市左營區博愛二路

  591.com.tw/sale/456789
`;

/** 套房/雅房特殊格式 */
const SAMPLE_STUDIO = `
學生套房出租
月租 8,500 元
套房 6坪
台中市北區
`;

/** 不含 591 但有房產特徵 */
const SAMPLE_NO_591 = `
永和精緻透天
總價 3,500 萬
建坪 52 坪
4房3廳3衛
新北市永和區中正路123巷45號
`;

/** 純廢話（不該解析成功） */
const SAMPLE_GARBAGE = `
今天天氣真好
我要去買咖啡
Hello World 123
`;

/** 只有地址 */
const SAMPLE_ADDRESS_ONLY = `
臺北市大安區忠孝東路四段123號5樓
`;

/** 包含租金（月/季/年） */
const SAMPLE_RENT_VARIANTS = `
月租金：15,000元
季租金：42,000元
年租金：168,000元
套房 8坪 台中市西區
`;

// ============ 測試套件 ============

describe('parse591Content - IM-2.1 價格解析', () => {
  it('應該解析售價格式：售價 1,288 萬', () => {
    const result = parse591Content('售價：1,288 萬');
    expect(result.price).toBe('1288');
    expect(result.confidence).toBeGreaterThanOrEqual(25);
  });

  it('應該解析總價格式：總價 2,880萬', () => {
    const result = parse591Content('總價：2880萬');
    expect(result.price).toBe('2880');
  });

  it('應該解析租金格式：租金 25,000 元/月', () => {
    const result = parse591Content('租金：25,000 元/月');
    expect(result.price).toBe('2.5');
  });

  it('應該解析無冒號格式：1280萬', () => {
    const result = parse591Content('1280萬');
    expect(result.price).toBe('1280');
  });

  it('應該解析月租金格式：月租 8,500 元', () => {
    const result = parse591Content('月租：8,500 元');
    expect(result.price).toBe('0.85');
  });

  it('應該處理價格中的逗號', () => {
    const result = parse591Content('售價：12,345,678 萬');
    expect(result.price).toBe('12345678');
  });
});

describe('parse591Content - IM-2.2 坪數解析', () => {
  it('應該解析權狀坪數：權狀 34.2 坪', () => {
    const result = parse591Content('權狀坪數：34.2 坪');
    expect(result.size).toBe('34.2');
  });

  it('應該解析建坪：建坪 28 坪', () => {
    const result = parse591Content('建坪：28 坪');
    expect(result.size).toBe('28');
  });

  it('應該解析室內坪數：室內 20.5 坪', () => {
    const result = parse591Content('室內：20.5 坪');
    expect(result.size).toBe('20.5');
  });

  it('應該解析簡單格式：32坪', () => {
    const result = parse591Content('32坪');
    expect(result.size).toBe('32');
  });

  it('應該解析帶空白格式：45.6 坪', () => {
    const result = parse591Content('45.6 坪');
    expect(result.size).toBe('45.6');
  });
});

describe('parse591Content - IM-2.3 格局解析', () => {
  it('應該解析標準格局：3房2廳2衛', () => {
    const result = parse591Content('3房2廳2衛');
    expect(result.rooms).toBe('3');
    expect(result.halls).toBe('2');
    expect(result.bathrooms).toBe('2');
  });

  it('應該解析帶空白格局：4 房 2 廳 2 衛', () => {
    const result = parse591Content('4 房 2 廳 2 衛');
    expect(result.rooms).toBe('4');
    expect(result.halls).toBe('2');
    expect(result.bathrooms).toBe('2');
  });

  it('應該識別套房', () => {
    const result = parse591Content('精緻套房出租');
    expect(result.rooms).toBe('1');
    expect(result.halls).toBe('0');
    expect(result.bathrooms).toBe('1');
  });

  it('應該識別雅房', () => {
    const result = parse591Content('學生雅房');
    expect(result.rooms).toBe('1');
    expect(result.halls).toBe('0');
    expect(result.bathrooms).toBe('1');
  });

  it('應該解析開放式格局：1房0廳1衛', () => {
    const result = parse591Content('1房0廳1衛');
    expect(result.rooms).toBe('1');
    expect(result.halls).toBe('0');
    expect(result.bathrooms).toBe('1');
  });
});

describe('parse591Content - IM-2.4 地址解析', () => {
  it('應該解析完整地址：台北市信義區信義路五段7號', () => {
    const result = parse591Content('台北市信義區信義路五段7號');
    expect(result.address).toContain('台北市');
    expect(result.address).toContain('信義區');
  });

  it('應該解析臺字地址：臺北市中正區', () => {
    const result = parse591Content('臺北市中正區羅斯福路');
    // 臺 會被正規化成 台
    expect(result.address).toContain('台北市');
  });

  it('應該解析高雄地址', () => {
    const result = parse591Content('高雄市左營區博愛二路123號');
    expect(result.address).toContain('高雄市');
  });

  it('應該解析台中地址', () => {
    const result = parse591Content('台中市北區三民路100號');
    expect(result.address).toContain('台中市');
  });

  it('應該解析新北地址（帶巷弄）', () => {
    const result = parse591Content('新北市板橋區中山路一段123巷45弄67號');
    expect(result.address).toContain('新北');
  });

  it('應該解析桃園/新竹地址', () => {
    const result = parse591Content('桃園市中壢區中央路100號');
    expect(result.address).toContain('桃園');
  });
});

describe('parse591Content - IM-2.5 標題擷取', () => {
  it('應該擷取合適長度的標題', () => {
    const result = parse591Content(SAMPLE_FULL_SALE);
    expect(result.title).toBeDefined();
    expect(result.title!.length).toBeGreaterThanOrEqual(5);
    expect(result.title!.length).toBeLessThanOrEqual(50);
  });

  it('應該跳過純數字行', () => {
    const result = parse591Content('12345678\n信義區三房公寓出租');
    expect(result.title).toBe('信義區三房公寓出租');
  });

  it('應該跳過太短的行', () => {
    const result = parse591Content('AB\n捷運旁精緻套房出租');
    expect(result.title).toBe('捷運旁精緻套房出租');
  });
});

describe('parse591Content - IM-2.6 591 物件 ID 擷取', () => {
  it('應該擷取 detail/123456 格式', () => {
    const result = parse591Content('https://sale.591.com.tw/home/house/detail/123456.html');
    expect(result.listingId).toBe('123456');
  });

  it('應該擷取 id=123456 格式', () => {
    const result = parse591Content('https://591.com.tw/rent?id=789012');
    expect(result.listingId).toBe('789012');
  });

  it('應該擷取 591.com.tw/sale/123456 格式', () => {
    const result = parse591Content('591.com.tw/sale/456789');
    expect(result.listingId).toBe('456789');
  });
});

describe('parse591Content - IM-2.7 信心分數計算 & IM-2.2 fieldsFound', () => {
  it('完整資訊應該達到 100 分且 fieldsFound 為 5', () => {
    const result = parse591Content(SAMPLE_FULL_SALE);
    expect(result.confidence).toBe(100);
    expect(result.fieldsFound).toBe(5);
  });

  it('只有格局 fieldsFound 應為 1', () => {
    const result = parse591Content('3房2廳2衛');
    expect(result.fieldsFound).toBe(1);
    expect(result.confidence).toBe(20);
  });

  it('套房應該得到 15 分但 fieldsFound 仍為 1', () => {
    const result = parse591Content('套房');
    expect(result.confidence).toBe(15);
    expect(result.fieldsFound).toBe(1);
  });

  it('純廢話應該是 0 分', () => {
    const result = parse591Content(SAMPLE_GARBAGE);
    expect(result.confidence).toBe(0);
    expect(result.fieldsFound).toBe(0);
  });
});

describe('parse591Content - IM-2 Audit Fixes', () => {
  // 2.1 價格正規化
  it('應該識別元/月並保持數值', () => {
    const result = parse591Content('租金：25,000 元/月');
    expect(result.price).toBe('2.5');
    expect(result.priceUnit).toBe('萬/月');
  });

  it('應該支援億元換算', () => {
    const result = parse591Content('總價：1.2億');
    expect(result.price).toBe('12000');
    expect(result.priceUnit).toBe('萬');
  });

  // 2.3 格局容錯
  it('應該解析 1.5 衛', () => {
    const result = parse591Content('3房2廳1.5衛');
    expect(result.bathrooms).toBe('1.5');
  });

  it('應該解析 0 廳', () => {
    const result = parse591Content('1房0廳1衛');
    expect(result.halls).toBe('0');
  });

  it('應該解析開放式格局', () => {
    const result = parse591Content('開放式格局');
    expect(result.rooms).toBe('1'); // 開放式視為 1 房 (Studio)
    expect(result.confidence).toBeGreaterThan(0);
  });

  // 2.4 模糊坪數
  it('應該解析模糊坪數', () => {
    const result = parse591Content('建坪 約 34.2 坪 (含車位)');
    expect(result.size).toBe('34.2');
  });
});

describe('parse591Content - 整合測試', () => {
  it('應該正確解析完整售屋資訊', () => {
    const result = parse591Content(SAMPLE_FULL_SALE);
    expect(result.price).toBe('1288');
    expect(result.size).toBe('34.2');
    expect(result.rooms).toBe('3');
    expect(result.halls).toBe('2');
    expect(result.bathrooms).toBe('2');
    expect(result.address).toContain('信義區');
    expect(result.listingId).toBe('123456');
    expect(result.confidence).toBe(100);
  });

  it('應該正確解析完整租屋資訊', () => {
    const result = parse591Content(SAMPLE_FULL_RENT);
    expect(result.price).toBe('2.5');
    expect(result.size).toBe('12');
    expect(result.rooms).toBe('1');
    expect(result.address).toContain('中正區');
    expect(result.listingId).toBe('789012');
  });

  it('應該正確解析格式雜亂的內容', () => {
    const result = parse591Content(SAMPLE_MESSY);
    expect(result.price).toBe('2880');
    expect(result.size).toBe('45.6');
    expect(result.rooms).toBe('4');
    expect(result.address).toContain('高雄市');
    expect(result.listingId).toBe('456789');
  });

  it('應該正確解析最小可解析內容', () => {
    const result = parse591Content(SAMPLE_MINIMAL);
    expect(result.price).toBe('1280');
    expect(result.size).toBe('32');
    expect(result.confidence).toBe(50);
  });

  it('應該正確解析不含 591 的房產內容', () => {
    const result = parse591Content(SAMPLE_NO_591);
    expect(result.price).toBe('3500');
    expect(result.size).toBe('52');
    expect(result.rooms).toBe('4');
    expect(result.confidence).toBe(100);
  });
  describe('IM-2 v2.3 & v2.4 優化建議', () => {
    it('P0: 價格單位一致性 (simpleRentMatch 為 萬/月)', () => {
      // 測試 simpleRentMatch (無冒號格式)
      const result = parse591Content('25,000 元/月'); 
      expect(result.price).toBe('2.5');
      expect(result.priceUnit).toBe('萬/月');
    });

    it('P1: 標題門檻放寬 (無房產詞但有正向詞)', () => {
      // 只有正向詞，無房產詞
      const result = parse591Content('景觀第一排 捷運 1 分鐘\n總價 2000 萬\n坪數 30 坪');
      expect(result.title).toBe('景觀第一排 捷運 1 分鐘');
    });

    it('P1: 標題門檻放寬 (無房產詞且無正向詞，但數字率極低)', () => {
      // v2.4: 低數字率放行
      const result = parse591Content('優質社區環境單純\n總價 2000 萬\n坪數 30 坪');
      expect(result.title).toBe('優質社區環境單純');
    });

    it('P1: 格局支援 1+1房 (自動加總)', () => {
      const result = parse591Content('格局：1+1房1廳1衛');
      // v2.4: 1+1 -> 2
      expect(result.rooms).toBe('2');
    });

    it('P1: 格局支援 2.5房', () => {
      const result = parse591Content('格局：2.5房2廳1衛');
      expect(result.rooms).toBe('2.5');
    });

    it('P1: 地址寬鬆模式 (無門牌)', () => {
      const result = parse591Content('地址：新北市板橋區民生路一段');
      expect(result.address).toBe('新北市板橋區民生路一段');
    });

    it('P1: 坪數(含車位)', () => {
      const result = parse591Content('建坪 45.5 坪(含車位)');
      expect(result.size).toBe('45.5');
    });
  });
});

describe('detect591Content', () => {
  it('應該識別包含 591 的內容', () => {
    expect(detect591Content('591.com.tw/rent/12345')).toBe(true);
  });

  it('應該識別包含「萬」和「坪」的內容', () => {
    expect(detect591Content('售價 1000萬 30坪')).toBe(true);
  });

  it('應該識別包含多個房產特徵的內容', () => {
    expect(detect591Content('台北市 3房2廳2衛 35坪')).toBe(true);
  });

  it('應該拒絕純廢話', () => {
    expect(detect591Content(SAMPLE_GARBAGE)).toBe(false);
  });

  it('應該拒絕太短的內容', () => {
    expect(detect591Content('hi')).toBe(false);
  });

  it('P1: 租金+地名 應識別為 True', () => {
    expect(detect591Content('租金 25000 元/月 位於台北市大安區')).toBe(true);
  });

  it('IM-2.13: 租金+地名(無坪數) 應為 True', () => {
    expect(detect591Content('月租 20000 元/月 台中市西屯區')).toBe(true);
  });
 
  it('P1: 純租金無地名 應為 False', () => {
    expect(detect591Content('租金 25000 元/月')).toBe(false);
  });
});
