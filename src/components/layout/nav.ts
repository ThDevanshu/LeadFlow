import {
  Building2,
  CalendarClock,
  ChartColumn,
  Columns3,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { to: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/settings', label: 'Settings', icon: Settings },
]
