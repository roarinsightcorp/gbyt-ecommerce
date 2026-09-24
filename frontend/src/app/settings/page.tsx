"use client";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#f7fafc] px-5 py-12 text-slate-900 dark:bg-[#05090e] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0786AD] dark:text-[#39D5F2]">
            G-BYT Account
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Manage your account preferences and settings.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm font-semibold">
              Account settings
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Additional account settings will be available here.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}