import { isSpecTag, filterHighlights } from '../tagUtils';

describe('Tag Filtering Logic (UP-4)', () => {
    describe('isSpecTag - Should identify spec-like tags', () => {
        // 這些是 SPEC_PATTERNS 實際會匹配的規格
        const specs = [
            '3房', '2廳', '1衛', '25坪', '30.5坪', // 數字+單位
            '5樓', '12樓之3',                       // X樓 格式
            '屋齡10年', '屋齡 5 年',                 // 屋齡X年 格式
            '主建30坪', '地坪100坪', '建坪50',       // 前綴+數字
            'B1車位', 'b2車位',                     // BX車位
            '3個陽台',                              // X個陽台
            '朝南', '朝向東北',                      // 朝向
            '格局方正',                             // 格局
            '車位平面',                             // 車位
            '管理費2000',                           // 管理費
            '公設比30%',                            // 公設比
        ];

        // 這些是亮點，不應被過濾
        const highlights = [
            '近捷運', '高樓層', '採光佳', '全新裝潢',
            '有車位', '有電梯', '景觀戶', '邊間',
        ];

        test.each(specs)('should identify "%s" as a spec', (tag) => {
            expect(isSpecTag(tag)).toBe(true);
        });

        test.each(highlights)('should allow "%s" as highlight', (tag) => {
            expect(isSpecTag(tag)).toBe(false);
        });

        test('should detect numeric spec patterns', () => {
            expect(isSpecTag('4房')).toBe(true);
            expect(isSpecTag('2.5衛')).toBe(true);
            expect(isSpecTag('30.5坪')).toBe(true);
        });
    });

    describe('filterHighlights - Should clean list', () => {
        test('should remove specs and keep highlights', () => {
            const input = ['3房', '近捷運', '25坪', '全新裝潢'];
            const output = filterHighlights(input);
            expect(output).toEqual(['近捷運', '全新裝潢']);
        });

        test('should handle empty or null', () => {
            expect(filterHighlights([])).toEqual([]);
        });
    });
});
