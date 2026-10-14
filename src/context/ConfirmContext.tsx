import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
}

type ConfirmApi = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmApi | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function close(result: boolean) {
    resolver.current?.(result)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        title={options?.title ?? 'Confirm'}
        description={options?.message}
        onClose={() => close(false)}
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" data-autofocus onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={options?.tone === 'primary' ? 'primary' : 'danger'} onClick={() => close(true)}>
            {options?.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmApi {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider')
  return context
}
