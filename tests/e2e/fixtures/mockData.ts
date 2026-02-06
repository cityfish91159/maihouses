/**
 * E2E Test Mock Data
 * Team Lima-1: Mock Data 建立
 */

export const MOCK_PROPERTY = {
  public_id: 'MH-100001',
  title: '測試物件 - 台北市信義區豪宅',
  trust_enabled: true,
  agent_id: '00000000-0000-0000-0000-000000000001',
  price: 50000000,
  area: 100,
  layout: '3房2廳2衛',
  floor: '10F/20F',
  address: '台北市信義區信義路五段7號',
};

export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000002',
  name: '測試用戶',
  email: 'test@example.com',
  phone: '0912345678',
};

export const MOCK_CASE = {
  id: '00000000-0000-0000-0000-000000000003',
  property_id: 'MH-100001',
  buyer_name: '買方-TEST1234',
  buyer_user_id: null,
  agent_id: '00000000-0000-0000-0000-000000000001',
  status: 'active',
  current_step: 1,
};

export const MOCK_TOKEN = '12345678-1234-1234-1234-123456789abc';
