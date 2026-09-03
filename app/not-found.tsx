import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 text-center">
      <h1 className="text-6xl font-extrabold text-sky-400 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h2>
      <p className="text-slate-400 mb-6 max-w-md">
        عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
