import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useUi } from '../../context/UiContext'
import { CsvImportModal } from '../leads/CsvImportModal'
import { LeadFormModal } from '../leads/LeadFormModal'
import { FollowUpFormModal } from '../followups/FollowUpFormModal'
import { PropertyFormModal } from '../properties/PropertyFormModal'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const { openLeadForm } = useUi()
  const { storageWarning } = useApp()

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-60">
        <Header onMenu={() => setNavOpen(true)} onAddLead={() => openLeadForm()} />
        {storageWarning ? (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 lg:px-6">{storageWarning}</p>
        ) : null}
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <LeadFormModal />
      <FollowUpFormModal />
      <PropertyFormModal />
      <CsvImportModal />
    </div>
  )
}
