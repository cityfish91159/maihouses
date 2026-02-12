/**
 * Profile form constants.
 *
 * Keep option lists in constants so adding/changing options
 * does not require touching UI component logic.
 */

export const PROFILE_SPECIALTY_OPTIONS = [
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '高雄市',
  '預售屋',
  '新成屋',
  '中古屋',
  '商辦',
  '店面',
  '透天',
  '公寓',
  '大樓',
  '別墅',
  '土地',
] as const;

export const PROFILE_CERTIFICATION_OPTIONS = [
  '不動產營業員',
  '不動產經紀人',
  '地政士',
  '估價師',
] as const;

export const PROFILE_MAX_COMPANY_LENGTH = 100;
export const PROFILE_MAX_BIO_LENGTH = 500;
export const PROFILE_STORAGE_KEY_PREFIX = 'uag-profile';
