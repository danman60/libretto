import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Music, BookOpen, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
        <div className="relative max-w-4xl mx-auto px-6 py-32 text-center">
          <p className="text-sm font-medium tracking-widest text-gray-500 uppercase mb-4">
            Libretto
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Your life. Your libretto.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Transform your life story into a 5-track concept album — complete with
            AI-generated lyrics, music, and a cinematic biography.
          </p>
          <Link href="/create">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full">
              Create Your Album
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="h-7 w-7 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tell your story
            </h3>
            <p className="text-gray-600">
              Share the turning points, emotions, and scenes that shaped your life
              through a guided narrative wizard.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Music className="h-7 w-7 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI composes your album
            </h3>
            <p className="text-gray-600">
              Our AI analyzes your story, writes personalized lyrics, and generates
              5 unique tracks tailored to your musical taste.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Shield className="h-7 w-7 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Listen and share
            </h3>
            <p className="text-gray-600">
              Receive a cinematic album page with your biography, lyrics, and
              playable tracks — shareable with a single link.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy note */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            Your story is personal. We automatically redact sensitive information
            like phone numbers and emails. Your narrative is processed securely
            and never shared.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400">
        Libretto &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
