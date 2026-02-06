import React, { memo } from 'react';

export const EmptyState = memo(() => {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      <div className="max-w-[340px] text-center">
        <p className="mb-3 text-3xl">🏡</p>
        <p className="mb-3 text-[15px] font-semibold leading-relaxed text-slate-800">
          歡迎來到邁房子 ☺️
        </p>
        <p className="mx-auto text-sm leading-relaxed text-slate-500">
          買房不只看物件，更要看生活。
          <br />
          這裡有真實住戶分享，我們一起慢慢看
        </p>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
