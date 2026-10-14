import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Page not found</h2>
      <p className="mt-1 text-sm text-slate-500">That address is not part of the LeadFlow demo.</p>
      <Link to="/dashboard" className="mt-4 inline-flex text-sm font-medium text-indigo-700">
        Go to dashboard
      </Link>
    </div>
  )
}
