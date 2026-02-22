'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gift, Loader2 } from 'lucide-react';
import type { AlbumPageData } from '@/lib/types';

export default function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AlbumPageData | null>(null);
  const [unwrapping, setUnwrapping] = useState(false);

  useEffect(() => {
    fetch(`/api/album/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.isGift) {
          // Not a gift — redirect to album
          router.replace(`/album/${slug}`);
          return;
        }
        setData(d);
      })
      .catch(() => {});
  }, [slug, router]);

  const handleUnwrap = () => {
    setUnwrapping(true);
    setTimeout(() => {
      router.push(`/album/${slug}`);
    }, 1200);
  };

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#E8A87C]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-[#F5F0EB] flex flex-col items-center justify-center px-6">
      <div className="text-center mb-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0EB]/60 hover:text-[#F5F0EB] transition-colors" style={{ fontFamily: 'var(--font-dm-serif)' }}>
          BROADWAYIFY
        </Link>
      </div>

      <div className={`max-w-md mx-auto text-center transition-all duration-1000 ${unwrapping ? 'opacity-0 scale-95 blur-sm' : 'opacity-100'}`}>
        <div className="w-20 h-20 rounded-full bg-[#E8A87C]/15 flex items-center justify-center mx-auto mb-8">
          <Gift className="h-10 w-10 text-[#E8A87C]" />
        </div>

        <p className="text-sm tracking-widest text-[#9B8E99] uppercase mb-3">
          Someone made this for you
        </p>

        {data.recipientName && (
          <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            For {data.recipientName}
          </h1>
        )}

        {data.giftMessage && (
          <p className="text-[#A89DAF] text-base mb-8 italic leading-relaxed" style={{ fontFamily: 'var(--font-lora)' }}>
            &ldquo;{data.giftMessage}&rdquo;
          </p>
        )}

        <p className="text-[#9B8E99] text-sm mb-8">
          A personal musical biography has been created just for you — three songs that tell a story only you know.
        </p>

        <button
          onClick={handleUnwrap}
          disabled={unwrapping}
          className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#E8A87C] text-[#1A1518] text-base font-medium hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#E8A87C]/25 disabled:opacity-70"
        >
          {unwrapping ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Opening...</>
          ) : (
            <><Gift className="h-5 w-5" /> Unwrap your Broadwayify</>
          )}
        </button>
      </div>
    </main>
  );
}
