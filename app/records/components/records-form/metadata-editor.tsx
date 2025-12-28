'use client'

import { useState, useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils/common-utils'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

/*-------------------------- Types ---------------------------*/
type MetadataEditorProps = {
  readonly value: string | null
  readonly onChange: (value: string | null) => void
  readonly disabled?: boolean
  readonly error?: string
  readonly className?: string
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function MetadataEditor({
  value,
  onChange,
  disabled,
  error,
  className,
  testId,
}: MetadataEditorProps) {
  /*-------------------------- State ---------------------------*/
  const [isValid, setIsValid] = useState(true)
  const { resolvedTheme } = useTheme()

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

      try {
        JSON.parse(newValue)
        setIsValid(true)
        onChange(newValue)
      } catch {
        setIsValid(false)
        onChange(newValue) // Still update to show user input
      }
    },
    [onChange]
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
      </div>

      {!isValid && <FieldError>Invalid JSON format</FieldError>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
