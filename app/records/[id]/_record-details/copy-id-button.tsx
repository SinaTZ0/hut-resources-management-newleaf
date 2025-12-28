'use client'

import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

/*------------------------ Props Type ------------------------*/
type CopyIdButtonProps = Readonly<{
  id: string
}>

/*------------------------ Component -------------------------*/
export function CopyIdButton({ id }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(id)
    toast.success('Record ID copied to clipboard')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className='h-6 w-6'
      onClick={handleCopy}
      data-testid='copy-record-id-btn'
    >
      {copied ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
      <span className='sr-only'>Copy record ID</span>
    </Button>
  )
}
