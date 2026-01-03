import { Hero } from './_homepage/hero'

export default function Home() {
  return (
    <main className='min-h-screen bg-zinc-50 dark:bg-zinc-950'>
      <Hero />
      {/* Minimal footer CTA to keep the page anchored */}
      <section className='mx-auto max-w-7xl px-6 py-12 text-center'>
        <p className='mx-auto max-w-2xl text-sm text-zinc-500 dark:text-zinc-400'>
          Curious? Create an entity and try it out—no rigid forms, just fields you care about and a
          flexible space for everything else.
        </p>
      </section>
    </main>
  )
}
