export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
      <div className="bg-red-900/20 p-8 rounded-2xl border border-red-900/50 max-w-md">
        <h1 className="text-4xl font-black mb-4 text-red-500">SYSTEM LOCKDOWN</h1>
        <p className="text-slate-300 mb-6">
          The platform is currently undergoing emergency maintenance or has been paused by the administrators.
        </p>
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Error Code: 503_SERVICE_UNAVAILABLE
        </div>
      </div>
    </div>
  );
}