import { Link, useParams, useSearchParams } from 'react-router-dom';
import ReportPreview from '../../components/ReportPreview';
import { logger } from '../../lib/logger';
import { decodeSharedReportPayload } from './sharedReportPayload';

type ReportPreviewProps = React.ComponentProps<typeof ReportPreview>;
type SharedReportPayload = {
  property: ReportPreviewProps['property'];
  agent: ReportPreviewProps['agent'];
};

function decodeSharedPayload(encodedPayload: string | null): SharedReportPayload | null {
  if (!encodedPayload) return null;

  try {
    const parsed = decodeSharedReportPayload<Partial<SharedReportPayload>>(encodedPayload);

    if (!parsed || typeof parsed !== 'object' || !parsed.property || !parsed.agent) {
      return null;
    }

    return parsed as SharedReportPayload;
  } catch (error) {
    logger.warn('[SharedReportPreviewPage] Failed to decode payload', { error });
    return null;
  }
}

export default function SharedReportPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const payload = decodeSharedPayload(searchParams.get('d'));

  if (!payload) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
          <h1 className="text-xl font-bold">報告連結無效或已失效</h1>
          <p className="mt-2 text-sm">請向提供者索取新的報告連結。</p>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white transition hover:bg-brand-600"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Shared Report
        </p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          物件報告
          {id ? ` · ${id}` : ''}
        </h1>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
        <ReportPreview property={payload.property} agent={payload.agent} />
      </div>
    </main>
  );
}
