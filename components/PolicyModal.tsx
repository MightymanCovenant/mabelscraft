"use client";
export default function PolicyModal({ onClose, title = "Before you order" }: { onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="policy-title">
      <div className="card w-full max-w-md animate-[popin_.25s_ease-out] rounded-b-none sm:rounded-2xl" style={{ animationName: "popin" }}>
        <h2 id="policy-title" className="text-2xl font-bold text-accent">{title}</h2>
        <ul className="my-4 space-y-3 text-sm">
          <li className="flex gap-2"><span aria-hidden>📍</span><span>We deliver <b>within Port Harcourt only</b>. Please give a complete, accurate address — we can&apos;t send a rider to find you.</span></li>
          <li className="flex gap-2"><span aria-hidden>⏱️</span><span>Estimated delivery: <b>45–90 minutes</b> after your order is confirmed.</span></li>
          <li className="flex gap-2"><span aria-hidden>🛵</span><span>Your rider waits <b>up to 10 minutes</b> at your address. If you don&apos;t show up, the rider leaves and the order is not redelivered that day.</span></li>
          <li className="flex gap-2"><span aria-hidden>🚫</span><span>Items are sold <b>as shown, with no customisation</b> once ordered.</span></li>
          <li className="flex gap-2"><span aria-hidden>📦</span><span><b>Check your package immediately</b> when the rider hands it over, before they leave.</span></li>
        </ul>
        <button className="btn w-full" onClick={onClose}>I understand, continue</button>
      </div>
    </div>
  );
}
