import { buildSharedReportUrl, getBasenameForPath } from './reportUrl';

describe('reportUrl', () => {
  it('應在 maihouses basename 下產生分享路徑', () => {
    const url = buildSharedReportUrl({
      origin: 'https://maihouses.vercel.app',
      pathname: '/maihouses/uag',
      reportId: 'R-TEST-001',
      encodedData: 'abc123',
    });

    expect(url).toBe('https://maihouses.vercel.app/maihouses/share/report/R-TEST-001?d=abc123');
  });

  it('非 maihouses 路徑時應使用根目錄', () => {
    const url = buildSharedReportUrl({
      origin: 'https://example.com',
      pathname: '/uag',
      reportId: 'R-TEST-002',
      encodedData: 'xyz789',
    });

    expect(url).toBe('https://example.com/share/report/R-TEST-002?d=xyz789');
  });

  it('basename 判斷應符合目前規則', () => {
    expect(getBasenameForPath('/maihouses/uag')).toBe('/maihouses');
    expect(getBasenameForPath('/uag')).toBe('');
  });
});
