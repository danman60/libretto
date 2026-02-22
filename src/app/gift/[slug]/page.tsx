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
        <Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-[#F2E8D5] flex flex-col items-center justify-center px-6">
      <div className="text-center mb-4">
        <Link href="/" className="marquee-title inline-block py-2 text-2xl font-bold tracking-[0.15em] text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
          BROADWAYIFY
        </Link>
      </div>

      <div className={`max-w-md mx-auto text-center transition-all duration-1000 ${unwrapping ? 'opacity-0 scale-95 blur-sm' : 'opacity-100'}`}>
        <div className="w-20 h-20 rounded-full bg-[#C9A84C]/15 flex items-center justify-center mx-auto mb-8">
          <Gift className="h-10 w-10 text-[#C9A84C]" />
        </div>

        <p className="text-sm tracking-[0.3em] text-[#F2E8D5]/40 uppercase mb-3"
          style={{ fontFamily: 'var(--font-oswald)' }}
        >
          Someone made this for you
        </p>

        {data.recipientName && (
          <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
            For {data.recipientName}
          </h1>
        )}

        {data.giftMessage && (
          <p className="text-[#F2E8D5]/60 text-base mb-8 italic leading-relaxed" style={{ fontFamily: 'var(--font-cormorant)' }}>
            &ldquo;{data.giftMessage}&rdquo;
          </p>
        )}

        <p className="text-[#F2E8D5]/40 text-sm mb-8" style={{ fontFamily: 'var(--font-cormorant)' }}>
          A personal musical biography has been created just for you — three songs that tell a story only you know.
        </p>

        <button
          onClick={handleUnwrap}
          disabled={unwrapping}
          className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#C9A84C] text-[#08070A] text-base font-semibold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-[#C9A84C]/30 disabled:opacity-70 tracking-wide"
          style={{ fontFamily: 'var(--font-oswald)' }}
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
