import { useState } from 'react'
import { Building2 } from 'lucide-react'
import type { Property } from '../../types'
import { cx } from '../../utils/cx'

export function PropertyImage({
  property,
  className,
}: {
  property: Pick<Property, 'imageUrl' | 'title'>
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed || !property.imageUrl) {
    return (
      <div className={cx('flex items-center justify-center bg-slate-100 text-slate-400', className)} role="img" aria-label={property.title}>
        <Building2 className="h-8 w-8" />
      </div>
    )
  }
  return (
    <img
      src={property.imageUrl}
      alt={property.title}
      className={cx('bg-slate-100 object-cover', className)}
      onError={() => setFailed(true)}
    />
  )
}
