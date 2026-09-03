'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 text-center">
      <h2 className="text-3xl font-extrabold text-rose-500 mb-3">حدث خطأ غير متوقع</h2>
      <p className="text-slate-400 mb-6 max-w-md">
        نعتذر، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
