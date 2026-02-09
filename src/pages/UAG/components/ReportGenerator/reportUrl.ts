export const SHARED_REPORT_PATH = '/share/report';

export function getBasenameForPath(pathname: string): string {
  return pathname.startsWith('/maihouses') ? '/maihouses' : '';
}

interface BuildSharedReportUrlInput {
  origin: string;
  pathname: string;
  reportId: string;
  encodedData: string;
}

export function buildSharedReportUrl({
  origin,
  pathname,
  reportId,
  encodedData,
}: BuildSharedReportUrlInput): string {
  const basename = getBasenameForPath(pathname);
  return `${origin}${basename}${SHARED_REPORT_PATH}/${reportId}?d=${encodedData}`;
}
