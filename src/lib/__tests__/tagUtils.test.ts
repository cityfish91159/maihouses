import { isSpecTag, filterHighlights } from '../tagUtils';

describe('Tag Filtering Logic (UP-4)', () => {
    describe('isSpecTag - Should identify spec-like tags', () => {
        const specs = [
            '3房', '3房2廳', '1衛', '25坪', '10年', '5樓', // Pure specs
            '主建30坪', '地坪100坪', '屋齡5年', // Prefix specs
            'B1車位', '3個陽台' // More complex specs
        ];

        const highlights = [
            '近捷運', '高樓層', '採光佳', '全新裝潢',
            '有車位', '大三房' // '大三房' is borderline, but strictly it contains '三房' spec info? 
            // User AC: "Zero repetition". If '3房' is in Spec, '大三房' is redundant info?
            // Let's stricter: Any numeric + SpecKey is banned.
        ];

        test.each(specs)('should identify "%s" as a spec', (tag) => {
            expect(isSpecTag(tag)).toBe(true);
        });

        // Note: '大三房' might typically be a highlight "Large 3 Rooms", 
        // but implies spec. If we are strict, we might ban it. 
        // For now let's focus on Digit+Key patterns.
        test('should allow adjective highlights', () => {
            expect(isSpecTag('近捷運')).toBe(false);
            expect(isSpecTag('全新裝潢')).toBe(false);
            expect(isSpecTag('高樓層')).toBe(false); // Contains '樓' but no digit
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
