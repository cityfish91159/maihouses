/**
 * Build metadata helpers
 *
 * 將 Vite define 注入的 commit 與建置時間整理成 UI 可用的字串。
 */

const rawVersion =
  typeof __APP_VERSION__ === 'string' && __APP_VERSION__.length > 0 ? __APP_VERSION__ : 'dev';
const rawBuildTime =
  typeof __BUILD_TIME__ === 'string' && __BUILD_TIME__.length > 0
    ? __BUILD_TIME__
    : new Date().toISOString();

const parsedBuildTime = (() => {
  const parsed = new Date(rawBuildTime);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
})();

const buildDate = parsedBuildTime ?? new Date();

const formatTwDateTime = (date: Date) =>
  new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'medium',
    hour12: false,
    timeZone: 'Asia/Taipei',
  }).format(date);

export const APP_VERSION = rawVersion;
export const BUILD_TIME_ISO = buildDate.toISOString();
export const BUILD_TIME_TW = formatTwDateTime(buildDate);
export const VERSION_LABEL = `v${APP_VERSION}·KC1`;

export const VERSION_TOOLTIP = `版本 ${APP_VERSION}（Key Capsules SSOT v1）· 建置 ${BUILD_TIME_TW}`;
