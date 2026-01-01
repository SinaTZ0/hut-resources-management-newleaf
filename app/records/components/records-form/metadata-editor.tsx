'use client'

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { useTheme } from 'next-themes'

import { cn, validateJsonSize, MAX_METADATA_SIZE } from '@/lib/utils/common-utils'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'

/*-------------------------- Types ---------------------------*/
type MetadataEditorProps = {
  readonly value: string | null
  readonly onChange: (value: string | null) => void
  readonly disabled?: boolean
  readonly error?: string
  readonly className?: string
  readonly testId?: string
  readonly maxSizeKb?: number
}

/*------------------ Client Mount Detection ------------------*/
const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/*------------------------ Component -------------------------*/
export function MetadataEditor({
  value,
  onChange,
  disabled,
  error,
  className,
  testId,
  maxSizeKb,
}: MetadataEditorProps) {
  /*-------------------------- State ---------------------------*/
  const [isValid, setIsValid] = useState(true)
  const isMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
  const { resolvedTheme } = useTheme()

  /*--------------------- Computed Values ----------------------*/
  const maxBytes = (maxSizeKb ?? MAX_METADATA_SIZE / 1024) * 1024

  /*-------------------------- Memos ---------------------------*/
  const extensions = useMemo(() => [json()], [])

  /*------------------------- Handlers -------------------------*/
  const handleChange = useCallback(
    (newValue: string) => {
      if (!newValue || newValue.trim() === '') {
        onChange(null)
        setIsValid(true)
        return
      }

      /*------------------- Validate Size Limit --------------------*/
      if (!validateJsonSize(newValue, maxBytes)) {
        setIsValid(false)
        onChange(newValue) // Still update to show user input
        return
      }

      try {
        JSON.parse(newValue)
        setIsValid(true)
        onChange(newValue)
      } catch {
        setIsValid(false)
        onChange(newValue) // Still update to show user input
      }
    },
    [onChange, maxBytes]
  )

  /*-------------------------- Render --------------------------*/
  return (
    <Field data-invalid={!isValid || !!error} data-testid={testId}>
      <FieldLabel>Additional Details (JSON)</FieldLabel>
      <FieldDescription>Optional free-form JSON for extra information</FieldDescription>

      <div
        className={cn(
          'overflow-hidden rounded-md border',
          !isValid && 'border-destructive',
          className
        )}
      >
        {/*-------- Show Skeleton Until Mounted (Avoids Hydration Mismatch) --------*/}
        {!isMounted ? (
          <Skeleton className='h-[200px] w-full rounded-none' />
        ) : (
          <CodeMirror
            value={value ?? ''}
            height='200px'
            extensions={extensions}
            onChange={handleChange}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            readOnly={disabled}
            editable={!disabled}
            basicSetup={{
              lineNumbers: false,
              foldGutter: true,
              highlightActiveLine: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              indentOnInput: true,
            }}
          />
        )}
      </div>

      {!isValid && (
        <FieldError>
          {value && !validateJsonSize(value, maxBytes)
            ? `Metadata exceeds maximum size (${String(maxBytes / 1024)}KB)`
            : 'Invalid JSON format'}
        </FieldError>
      )}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
