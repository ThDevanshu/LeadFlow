import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { cx } from '../../utils/cx'
import { NAV_ITEMS } from './nav'

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp()

  return (
    <>
      {open ? (
        <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" aria-label="Close menu" onClick={onClose} />
      ) : null}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-700 text-sm font-semibold text-white">
            LF
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-slate-900">LeadFlow</p>
            <p className="truncate text-xs text-slate-500">{state.settings.agencyName}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                  isActive ? 'bg-indigo-50 font-medium text-indigo-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
       
      </aside>
    </>
  )
}
