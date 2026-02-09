import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SharedReportPreviewPage from './SharedReportPreviewPage';
import { encodeSharedReportPayload } from './sharedReportPayload';

function renderPage(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/share/report/:id" element={<SharedReportPreviewPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SharedReportPreviewPage', () => {
  it('payload 無效時應顯示錯誤提示', () => {
    renderPage('/share/report/R-INVALID?d=bad-payload');

    expect(screen.getByText('報告連結無效或已失效')).toBeInTheDocument();
  });

  it('payload 有效時應渲染報告內容', () => {
    const payload = {
      property: {
        id: 'demo-001',
        title: '測試豪宅',
        address: '台北市信義區松仁路 100 號',
        district: '信義區',
        price: 128000000,
        pricePerPing: 880000,
        size: 145.8,
        rooms: '4房2廳3衛',
        floor: '21',
        floorTotal: 28,
        age: 7,
        direction: '南',
        parking: '坡道平面',
        managementFee: 12000,
        community: '信義天璽',
        communityYear: 2019,
        communityUnits: 120,
        propertyType: '電梯大樓',
        description: '高樓層景觀戶，格局方正，採光通風佳。',
        images: ['https://example.com/property.jpg'],
      },
      agent: {
        name: '游杰倫',
        phone: '0912345678',
        company: 'MaiHouses 邁房子',
      },
    };

    const encoded = encodeSharedReportPayload(payload);
    renderPage(`/share/report/R-TEST-001?d=${encoded}`);

    expect(screen.getByText('物件報告 · R-TEST-001')).toBeInTheDocument();
    expect(screen.getByText('測試豪宅')).toBeInTheDocument();
    expect(screen.getByText('信義天璽社區')).toBeInTheDocument();
  });
});
