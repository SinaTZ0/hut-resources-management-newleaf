'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database, Layers, LayoutDashboard, Menu, Plus } from 'lucide-react'

import { ModeToggle } from '@/components/theme/theme-toggle'
import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function Navbar() {
  /*---------------------- State & Hooks -----------------------*/
  const pathname = usePathname()

  /*--------------------- Navigation Items ---------------------*/
  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      title: 'Entities',
      href: '/entities',
      icon: Layers,
      active: pathname.startsWith('/entities'),
    },
    {
      title: 'Records',
      href: '/records',
      icon: Database,
      active: pathname.startsWith('/records'),
    },
  ]

  /*-------------------------- Render --------------------------*/
  return (
    <header className='sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm supports-backdrop-filter:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-backdrop-filter:bg-zinc-950/80'>
      <nav
        className='flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8'
        role='navigation'
      >
        {/*-------------------- Logo & Mobile Menu --------------------*/}
        <div className='flex items-center gap-6'>
          {/*----------------------- Mobile Menu ------------------------*/}
          <div className='md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  data-testid='navbar-mobile-menu-btn'
                >
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side='left'
                className='w-72 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
              >
                <SheetHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-800'>
                  <SheetTitle className='flex items-center gap-2.5 text-xl font-semibold tracking-tight'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white'>
                      <span className='font-mono text-sm font-bold text-white dark:text-zinc-900'>
                        H
                      </span>
                    </div>
                    <span className='text-zinc-900 dark:text-zinc-50'>HUT.MGMT</span>
                  </SheetTitle>
                </SheetHeader>

                {/*----------------- Mobile Navigation Links ------------------*/}
                <div className='flex flex-col gap-1 py-4'>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                        item.active
                          ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'
                      )}
                      data-testid={`navbar-mobile-link-${item.title.toLowerCase()}`}
                    >
                      <item.icon className='h-4 w-4' />
                      {item.title}
                    </Link>
                  ))}
                </div>

                {/*------------------------ Mobile CTA ------------------------*/}
                <div className='absolute bottom-6 left-4 right-4'>
                  <Button className='w-full gap-2 cursor-pointer' asChild>
                    <Link href='/entities/create'>
                      <Plus className='h-4 w-4' />
                      New Entity
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/*--------------------------- Logo ---------------------------*/}
          <Link
            href='/'
            className='flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80'
            data-testid='navbar-logo'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white'>
              <span className='font-mono text-sm font-bold text-white dark:text-zinc-900'>H</span>
            </div>
            <span className='hidden text-lg font-semibold tracking-tight text-zinc-900 sm:block dark:text-zinc-50'>
              HUT.MGMT
            </span>
          </Link>

          {/*-------------------- Desktop Navigation --------------------*/}
          <div className='hidden items-center gap-1 md:flex'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                  item.active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                )}
                data-testid={`navbar-link-${item.title.toLowerCase()}`}
              >
                <item.icon className='h-4 w-4' />
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        {/*------------------------- Actions --------------------------*/}
        <div className='flex items-center gap-2'>
          {/*--------------------- Status Indicator ---------------------*/}
          <div className='hidden items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 md:flex dark:bg-emerald-950/50'>
            <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
            <span className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>Live</span>
          </div>

          {/*------------------------- Divider --------------------------*/}
          <div className='hidden h-6 w-px bg-zinc-200 md:block dark:bg-zinc-800' />

          {/*----------------------- Theme Toggle -----------------------*/}
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
