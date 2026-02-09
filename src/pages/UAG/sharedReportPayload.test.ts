import { decodeSharedReportPayload, encodeSharedReportPayload } from './sharedReportPayload';

describe('sharedReportPayload codec', () => {
  it('應可正確編解碼含中文與 emoji 的 payload', () => {
    const payload = {
      title: '游杰倫推薦',
      description: '台北市信義區優質物件 🏡',
      price: 32880000,
    };

    const encoded = encodeSharedReportPayload(payload);
    const decoded = decodeSharedReportPayload<typeof payload>(encoded);

    expect(decoded).toEqual(payload);
  });

  it('遇到無效 payload 應回傳 null', () => {
    const decoded = decodeSharedReportPayload('%%%invalid%%%');
    expect(decoded).toBeNull();
  });
});
