'use client'

import Link from 'next/link'
import { Sparkles, Database, Layers } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className='relative overflow-hidden bg-linear-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950'>
      <div className='mx-auto max-w-7xl px-6 py-24 lg:py-28'>
        <div className='mx-auto max-w-3xl text-center'>
          <p className='inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'>
            <Sparkles className='h-4 w-4 text-amber-600 dark:text-amber-400' />
            New: Lightweight, schema-backed resource manager
          </p>

          <h1 className='mt-6 text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl'>
            Flexible resource management that adapts to your team
          </h1>

          <p className='mt-4 text-lg text-zinc-600 dark:text-zinc-300'>
            Define the fields you care about, keep the rest in a flexible JSON blob, and search,
            filter, and organize resources without being locked into rigid forms.
          </p>

          <div className='mt-8 flex items-center justify-center gap-3 sm:justify-center'>
            <Button asChild size='lg'>
              <Link href='/entities/create'>Get started — create an Entity</Link>
            </Button>
            <Button variant='ghost' asChild size='lg'>
              <Link href='#features'>See features</Link>
            </Button>
          </div>

          <div className='pointer-events-none relative mt-14 flex justify-center'>
            <div className='relative w-[680px] max-w-full'>
              {/* Floating preview card */}
              <div className='absolute -left-8 top-0 hidden transform-gpu scale-95 -rotate-2 animate-[float_6s_ease-in-out_infinite] sm:block'>
                <div className='w-[320px] rounded-2xl bg-white/90 px-5 py-4 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900/90 dark:ring-zinc-800'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
                        Entities
                      </div>
                      <div className='mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
                        12
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800'>
                        <Layers className='h-5 w-5 text-zinc-700 dark:text-zinc-200' />
                      </div>
                    </div>
                  </div>

                  <div className='mt-4 border-t border-zinc-100 pt-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400'>
                    Lightweight schemas, search-ready fields, and unlimited details.
                  </div>
                </div>
              </div>

              <div className='mx-auto max-w-2xl transform-gpu overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-amber-500 to-emerald-500 p-1 shadow-xl ring-1 ring-zinc-900/5'>
                <div className='rounded-2xl bg-white/95 px-6 py-8 dark:bg-zinc-950/90'>
                  <div className='flex items-start justify-between gap-6'>
                    <div>
                      <div className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
                        Inventory
                      </div>
                      <div className='mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
                        Router — SW-2960-12
                      </div>
                      <div className='mt-3 text-sm text-zinc-500 dark:text-zinc-400'>
                        Model: Catalyst 2960 • Status: Active • Serial: FOC1831Z90S
                      </div>
                    </div>

                    <div className='hidden items-center gap-3 sm:flex'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800'>
                        <Database className='h-4 w-4 text-zinc-700 dark:text-zinc-200' />
                      </div>
                    </div>
                  </div>

                  <div className='mt-6 flex flex-wrap gap-2'>
                    <span className='rounded-full bg-zinc-100/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200'>
                      Model: Catalyst
                    </span>
                    <span className='rounded-full bg-zinc-100/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200'>
                      Uplink: Gi0/24
                    </span>
                    <span className='rounded-full bg-zinc-100/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200'>
                      Rack: 3U
                    </span>
                  </div>
                </div>
              </div>

              <div className='absolute -right-8 bottom-0 hidden transform-gpu scale-95 rotate-2 animate-[float_7s_ease-in-out_infinite] sm:block'>
                <div className='w-[220px] rounded-2xl bg-white/90 px-5 py-4 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900/90 dark:ring-zinc-800'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
                        Records
                      </div>
                      <div className='mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
                        320
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800'>
                        <Database className='h-5 w-5 text-zinc-700 dark:text-zinc-200' />
                      </div>
                    </div>
                  </div>

                  <div className='mt-4 border-t border-zinc-100 pt-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400'>
                    Rich JSON notes for everything else — no schema migrations.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-8 flex items-center justify-center gap-3 text-sm text-zinc-500 dark:text-zinc-400'>
            <span>Trusted by small teams and IT pros • Built for speed</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </section>
  )
}
