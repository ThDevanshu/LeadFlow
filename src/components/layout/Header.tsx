import { Bell, Menu, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { agentName } from '../../utils/records'
import { buildNotifications, notificationTime } from '../../utils/notifications'
import { cx } from '../../utils/cx'
import { Button } from '../ui/Button'
import { NAV_ITEMS } from './nav'

const toneDot = {
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-indigo-500',
  success: 'bg-emerald-500',
}

export function Header({ onMenu, onAddLead }: { onMenu: () => void; onAddLead: () => void }) {
  const { state, markNotificationsRead } = useApp()
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const notifications = useMemo(
    () => buildNotifications(state.leads, state.followUps),
    [state.leads, state.followUps],
  )
  const unread = notifications.filter((item) => !state.settings.notificationReadIds.includes(item.id))
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    if (q.length < 2) return []
    return state.leads
      .filter((lead) => {
        const phoneDigits = lead.phone.replace(/\D/g, '')
        return (
          lead.fullName.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          (digits.length >= 3 && phoneDigits.includes(digits))
        )
      })
      .slice(0, 8)
  }, [query, state.leads])

  const lead = params.leadId ? state.leads.find((item) => item.id === params.leadId) : undefined
  const property = params.propertyId ? state.properties.find((item) => item.id === params.propertyId) : undefined
  const navItem = NAV_ITEMS.find((item) => location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)))
  const title = lead?.fullName ?? property?.title ?? navItem?.label ?? 'LeadFlow'
  const crumb = lead ? { label: 'Leads', to: '/leads' } : property ? { label: 'Properties', to: '/properties' } : null
  const profile = state.agents.find((agent) => agent.id === state.settings.demoAgentId)

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!searchRef.current?.contains(target)) setSearchOpen(false)
      if (!notesRef.current?.contains(target)) setNotesOpen(false)
      if (!profileRef.current?.contains(target)) setProfileOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setNotesOpen(false)
        setProfileOpen(false)
        setMobileSearch(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    document.title = `${title} · LeadFlow`
  }, [title])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          {crumb ? (
            <p className="truncate text-xs text-slate-500">
              <Link to={crumb.to} className="hover:text-indigo-700">
                {crumb.label}
              </Link>
              <span className="px-1">/</span>
              <span className="text-slate-700">{title}</span>
            </p>
          ) : (
            <p className="truncate text-xs text-slate-500">Sample workspace · {state.settings.agencyName}</p>
          )}
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>

        <div ref={searchRef} className="relative hidden md:block">
          <label className="sr-only" htmlFor="global-search">
            Search leads
          </label>
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            id="global-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search name, phone, email"
            className="h-9 w-72 rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          {searchOpen && query.trim().length >= 2 ? (
            <div className="absolute top-11 right-0 z-40 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {results.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-500">No leads match “{query.trim()}”.</p>
              ) : (
                <ul>
                  {results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => {
                          setSearchOpen(false)
                          setQuery('')
                          navigate(`/leads/${item.id}`)
                        }}
                      >
                        <span className="block text-sm font-medium text-slate-900">{item.fullName}</span>
                        <span className="block text-xs text-slate-500">
                          {item.phone} · {item.email}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Search leads"
          onClick={() => setMobileSearch((value) => !value)}
        >
          <Search className="h-5 w-5" />
        </button>

        <div ref={notesRef} className="relative">
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label={unread.length > 0 ? `Notifications, ${unread.length} unread` : 'Notifications'}
            aria-expanded={notesOpen}
            onClick={() => {
              setNotesOpen((value) => !value)
              setProfileOpen(false)
            }}
          >
            <Bell className="h-5 w-5" />
            {unread.length > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            ) : null}
          </button>
          {notesOpen ? (
            <div className="absolute top-11 right-0 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Alerts</p>
                  <p className="text-xs text-slate-500">Generated from demo data in this browser</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-700 disabled:text-slate-400"
                  disabled={unread.length === 0}
                  onClick={() => markNotificationsRead(notifications.map((item) => item.id))}
                >
                  Mark all read
                </button>
              </div>
              <ul className="max-h-96 overflow-auto">
                {notifications.length === 0 ? (
                  <li className="px-3 py-6 text-sm text-slate-500">You’re caught up. Due follow-ups and new leads show up here.</li>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !state.settings.notificationReadIds.includes(item.id)
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cx('flex w-full gap-2 px-3 py-2.5 text-left hover:bg-slate-50', isUnread && 'bg-indigo-50/50')}
                          onClick={() => {
                            markNotificationsRead([item.id])
                            setNotesOpen(false)
                            navigate(item.href)
                          }}
                        >
                          <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', isUnread ? toneDot[item.tone] : 'bg-transparent')} />
                          <span>
                            <span className="block text-sm font-medium text-slate-900">{item.title}</span>
                            <span className="block text-xs text-slate-600">{item.body}</span>
                            <span className="block text-xs text-slate-400">{notificationTime(item.createdAt)}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          ) : null}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100"
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
            onClick={() => {
              setProfileOpen((value) => !value)
              setNotesOpen(false)
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {(profile?.name ?? 'Demo')
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-slate-900">{profile?.name ?? 'Demo user'}</span>
              <span className="block text-xs text-slate-500">{profile?.role ?? 'Local demo'}</span>
            </span>
          </button>
          {profileOpen ? (
            <div className="absolute top-12 right-0 z-40 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <p className="text-sm font-medium text-slate-900">{profile?.name ?? 'Demo user'}</p>
              <p className="text-xs text-slate-500">{profile?.email ?? 'No sign-in on this demo'}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                This profile is stored locally. LeadFlow does not sign anyone in or send notifications.
              </p>
              <Link
                to="/settings"
                className="mt-3 inline-flex text-sm font-medium text-indigo-700"
                onClick={() => setProfileOpen(false)}
              >
                Agency settings
              </Link>
              <p className="mt-2 text-xs text-slate-400">Shown as {agentName(state.agents, state.settings.demoAgentId)}</p>
            </div>
          ) : null}
        </div>

        <Button onClick={onAddLead} aria-label="Add lead">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
      </div>
      {mobileSearch ? (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden">
          <label className="sr-only" htmlFor="mobile-search">
            Search leads
          </label>
          <input
            id="mobile-search"
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, email"
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          {query.trim().length >= 2 ? (
            <ul className="mt-2 overflow-hidden rounded-lg border border-slate-200">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">No leads match.</li>
              ) : (
                results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setMobileSearch(false)
                        setQuery('')
                        navigate(`/leads/${item.id}`)
                      }}
                    >
                      {item.fullName}
                      <span className="block text-xs text-slate-500">{item.phone}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
