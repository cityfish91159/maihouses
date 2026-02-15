import { deepFreeze } from '../../lib/deepFreeze';

export interface ChatPropertyMock {
  title: string;
  price: string;
  size: string;
  rooms: string;
  address: string;
  highlight: string;
}

const CHAT_PROPERTY_MOCK_BY_ID = deepFreeze<Record<string, ChatPropertyMock>>({
  'MH-2024-001': {
    title: '高樓層雙面採光 3房',
    price: '2,180萬',
    size: '35.8坪',
    rooms: '3房2廳2衛',
    address: '中正路168號12樓',
    highlight: '捷運3分鐘',
  },
  'MH-2024-002': {
    title: '景觀四房 附車位',
    price: '3,280萬',
    size: '52.6坪',
    rooms: '4房2廳2衛',
    address: '文化一路88號18樓',
    highlight: '河景第一排',
  },
  'MH-2024-003': {
    title: '精裝兩房 即可入住',
    price: '1,480萬',
    size: '26.2坪',
    rooms: '2房1廳1衛',
    address: '和平路66號8樓',
    highlight: '學區宅',
  },
  'MH-2024-004': {
    title: '邊間採光佳 視野好',
    price: '1,980萬',
    size: '32.1坪',
    rooms: '3房2廳1衛',
    address: '景平路188號15樓',
    highlight: '高樓層',
  },
  default: {
    title: '優質物件',
    price: '洽詢',
    size: '-',
    rooms: '-',
    address: '點擊查看詳情',
    highlight: '新上架',
  },
});

const DEFAULT_CHAT_PROPERTY_MOCK: ChatPropertyMock = deepFreeze({
  title: '優質物件',
  price: '洽詢',
  size: '-',
  rooms: '-',
  address: '點擊查看詳情',
  highlight: '新上架',
});

export function getChatPropertyMock(propertyId: string): ChatPropertyMock {
  return CHAT_PROPERTY_MOCK_BY_ID[propertyId] ?? DEFAULT_CHAT_PROPERTY_MOCK;
}
