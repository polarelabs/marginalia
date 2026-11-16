import { Suspense } from 'react';
import { SketchDefs } from '@/components/marginalia/SketchDefs';
import { MarginaliaPlayer } from '@/components/marginalia/MarginaliaPlayer';

export default function Home() {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-8 overflow-hidden p-6">
      <SketchDefs />
      <h1 className="page-title flex items-center gap-3 font-hand text-4xl font-bold -rotate-2 sm:text-5xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark.svg" alt="" width={33} height={36} />
        Marginalia
      </h1>
      <Suspense fallback={<div className="paper-skeleton" />}>
        <MarginaliaPlayer />
      </Suspense>
    </main>
  );
}