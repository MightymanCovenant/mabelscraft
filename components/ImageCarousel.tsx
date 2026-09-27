"use client";
import { useState } from "react";
export default function ImageCarousel({ images, className = "" }: { images: string[]; className?: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className={`bg-line ${className}`} />;
  return (
    <div className={`relative ${className}`}>
      <div className="h-full w-full bg-cover bg-center transition-[background-image] duration-300" style={{ backgroundImage: `url(${images[i]})` }} />
      {images.length > 1 && (
        <>
          <button aria-label="Previous photo" onClick={(e) => { e.preventDefault(); setI((i - 1 + images.length) % images.length); }} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-sm text-white">‹</button>
          <button aria-label="Next photo" onClick={(e) => { e.preventDefault(); setI((i + 1) % images.length); }} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-sm text-white">›</button>
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, d) => <span key={d} className={`h-1.5 w-1.5 rounded-full ${d === i ? "bg-white" : "bg-white/50"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
