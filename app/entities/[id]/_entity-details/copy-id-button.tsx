'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/*------------------------ Props Type ------------------------*/
type CopyIdButtonProps = Readonly<{
  id: string
  testId?: string
}>

/*------------------------ Component -------------------------*/
export function CopyIdButton({ id, testId = 'copy-id-btn' }: CopyIdButtonProps) {
  /*-------------------------- State ---------------------------*/
  const [copied, setCopied] = useState(false)

  /*------------------------- Handlers -------------------------*/
  const handleCopy = () => {
    void navigator.clipboard
      .writeText(id)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((error: unknown) => {
        console.error('Failed to copy ID:', error)
      })
  }

  /*-------------------------- Render --------------------------*/
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={handleCopy}
            data-testid={testId}
          >
            {copied ? (
              <Check className='h-4 w-4 text-green-600' data-testid={`${testId}-success`} />
            ) : (
              <Copy className='h-4 w-4' />
            )}
            <span className='sr-only'>Copy ID</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : 'Copy ID'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
