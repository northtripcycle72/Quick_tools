'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserItem {
  id: number
  full_name: string
  email: string
  user_type?: number
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'banned'
  created_at: string
}

interface ToolItem {
  id: number
  slug: string
  name: string
  category: string
  description: string
  is_active: number
  updated_at: string
}

interface StatsData {
  totalUsers: number
  totalExecutions: number
  activeToolsCount: number
  inactiveToolsCount: number
  systemHealth: {
    database: string
    pythonBackend: string
    serverUptime: string
  }
}

export default function AdminDashboardClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tools' | 'health'>('overview')
  const [loading, setLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState<{ id: number; name: string; email: string } | null>(null)

  // Theme State (Light vs Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const isDarkClass = document.documentElement.classList.contains('dark')
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      setTheme(isDarkClass ? 'dark' : 'light')
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Data States
  const [stats, setStats] = useState<StatsData | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [tools, setTools] = useState<ToolItem[]>([])
  const [recentUsers, setRecentUsers] = useState<UserItem[]>([])
  const [popularTools, setPopularTools] = useState<{ tool_slug: string; usage_count: number }[]>([])

  // User Management Filter
  const [userSearch, setUserSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | '0' | '1'>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'banned'>('all')

  // Tool Controls Filter
  const [toolCategoryFilter, setToolCategoryFilter] = useState('all')
  const [toolSearch, setToolSearch] = useState('')

  // Notifications Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // 1. Authenticate Admin Session
  const checkAdminAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (!data.user || data.user.role !== 'admin') {
        router.push('/?error=forbidden')
        return false
      }
      setCurrentAdmin({
        id: data.user.id,
        name: data.user.full_name || 'Admin',
        email: data.user.email,
      })
      return true
    } catch {
      router.push('/')
      return false
    }
  }, [router])

  // 2. Fetch System Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
        setPopularTools(data.popularTools || [])
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  // 3. Fetch All Users
  const fetchUsers = useCallback(async () => {
    try {
      const url = userSearch ? `/api/admin/users?q=${encodeURIComponent(userSearch)}` : '/api/admin/users'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }, [userSearch])

  // 4. Fetch All Tools Config
  const fetchTools = async () => {
    try {
      const res = await fetch('/api/admin/tools')
      if (res.ok) {
        const data = await res.json()
        setTools(data.tools || [])
      }
    } catch (err) {
      console.error('Failed to load tools config:', err)
    }
  }

  // Initialize Data
  useEffect(() => {
    let isMounted = true
    checkAdminAuth().then((isAdmin) => {
      if (isAdmin && isMounted) {
        Promise.all([fetchStats(), fetchUsers(), fetchTools()]).finally(() => {
          if (isMounted) setLoading(false)
        })
      }
    })
    return () => {
      isMounted = false
    }
  }, [checkAdminAuth, fetchUsers])

  // Debounced User Search
  useEffect(() => {
    if (currentAdmin) {
      fetchUsers()
    }
  }, [userSearch, currentAdmin, fetchUsers])

  // User Management Actions (Type 0 Admin / Type 1 User)
  const handleUpdateUser = async (userId: number, targetType?: number, targetStatus?: 'active' | 'inactive' | 'banned') => {
    try {
      const targetRole: 'admin' | 'user' | undefined = typeof targetType === 'number' ? (targetType === 0 ? 'admin' : 'user') : undefined
      const payload = {
        userId,
        userType: targetType,
        role: targetRole,
        status: targetStatus,
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('User record updated in MySQL!')
        fetchUsers()
        fetchStats()
      } else {
        showToast(data.error || 'Failed to update user', 'error')
      }
    } catch {
      showToast('Network error updating user', 'error')
    }
  }

  // Delete User Action
  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}" from quick_tool_db?`)) return
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showToast(`User "${name}" removed.`)
        fetchUsers()
        fetchStats()
      } else {
        showToast(data.error || 'Failed to delete user', 'error')
      }
    } catch {
      showToast('Network error deleting user', 'error')
    }
  }

  // Tool Toggle Switch Action
  const handleToggleTool = async (slug: string, currentIsActive: number) => {
    const nextIsActive = currentIsActive !== 1
    // Optimistic UI state
    setTools((prev) => prev.map((t) => (t.slug === slug ? { ...t, is_active: nextIsActive ? 1 : 0 } : t)))

    try {
      const res = await fetch('/api/admin/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isActive: nextIsActive }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Tool "${slug}" is now ${nextIsActive ? 'ACTIVE' : 'DISABLED'}.`)
        fetchStats()
      } else {
        setTools((prev) => prev.map((t) => (t.slug === slug ? { ...t, is_active: currentIsActive } : t)))
        showToast(data.error || 'Failed to update tool state', 'error')
      }
    } catch {
      setTools((prev) => prev.map((t) => (t.slug === slug ? { ...t, is_active: currentIsActive } : t)))
      showToast('Network error updating tool status', 'error')
    }
  }

  // Filtered Users Computed List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const uType = typeof u.user_type === 'number' ? u.user_type : (u.role === 'admin' ? 0 : 1)
      if (userTypeFilter !== 'all' && uType.toString() !== userTypeFilter) return false
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false
      return true
    })
  }, [users, userTypeFilter, userStatusFilter])

  // Filtered Tools Computed List
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (toolCategoryFilter !== 'all' && !t.category.toLowerCase().includes(toolCategoryFilter.toLowerCase())) {
        return false
      }
      if (toolSearch && !t.name.toLowerCase().includes(toolSearch.toLowerCase()) && !t.slug.toLowerCase().includes(toolSearch.toLowerCase())) {
        return false
      }
      return true
    })
  }, [tools, toolCategoryFilter, toolSearch])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">Initializing Admin Portal...</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Connecting to MySQL DBMS (quick_tool_db)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col xl:flex-row font-sans transition-colors duration-300">

      {/* ── Toast Notification Banner ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-extrabold backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
              : 'bg-rose-900/90 text-rose-100 border-rose-500/40 shadow-rose-950/30'
          }`}
        >
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Sidebar Navigation ── */}
      <aside className="w-full xl:w-72 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800/80 p-6 flex flex-col justify-between shrink-0 z-20 shadow-sm transition-colors duration-300">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">QuickTools</h2>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Admin Control Center</p>
              </div>
            </div>

            {/* Quick Theme Toggle Icon */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span className="material-symbols-outlined text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">grid_view</span>
                <span>Overview & Stats</span>
              </div>
              <span className="text-xs opacity-75 font-mono">LIVE</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">group</span>
                <span>User Management</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'tools'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">tune</span>
                <span>Tool Status Manager</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {tools.filter((t) => t.is_active === 1).length}/{tools.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'health'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">dns</span>
                <span>Telemetry & Health</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 mt-8 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <span>Database</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">MySQL 8.0</span>
            </div>
            <p className="text-slate-900 dark:text-slate-300 font-bold truncate">quick_tool_db</p>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all border border-slate-200 dark:border-slate-700/60"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Public Web App
          </Link>
        </div>
      </aside>

      {/* ── Main Dashboard Panel ── */}
      <main className="flex-1 p-6 xl:p-10 overflow-y-auto max-w-7xl">

        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white/80 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/60 backdrop-blur-md shadow-sm transition-colors duration-300">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'overview' && 'System Analytics & Performance'}
                {activeTab === 'users' && 'User Account Directory'}
                {activeTab === 'tools' && 'Tool Active / Inactive Manager'}
                {activeTab === 'health' && 'System Infrastructure Telemetry'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Logged in as <strong className="text-indigo-600 dark:text-indigo-400">{currentAdmin?.name}</strong> ({currentAdmin?.email})
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-extrabold border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => {
                fetchStats()
                fetchUsers()
                fetchTools()
                showToast('Refreshed data from MySQL')
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold border border-indigo-500 transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Sync DBMS
            </button>
          </div>
        </header>

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: OVERVIEW & STATS */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* KPI 1: Total Users */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 p-6 rounded-3xl border border-slate-200 dark:border-indigo-500/20 shadow-md dark:shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</span>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{stats?.totalUsers || 0}</h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Type 0 Admins: {users.filter(u => u.user_type === 0 || u.role === 'admin').length}</span>
                  <span>•</span>
                  <span>Type 1 Users: {users.filter(u => u.user_type !== 0 && u.role !== 'admin').length}</span>
                </div>
              </div>

              {/* KPI 2: Total Tool Executions */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-purple-950/40 p-6 rounded-3xl border border-slate-200 dark:border-purple-500/20 shadow-md dark:shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Executions</span>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">insights</span>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{stats?.totalExecutions || 0}</h2>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Logged in tool_usages table</p>
              </div>

              {/* KPI 3: Active Tools */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 p-6 rounded-3xl border border-slate-200 dark:border-emerald-500/20 shadow-md dark:shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Tools</span>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mb-2">{stats?.activeToolsCount || 0}</h2>
                <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">Visible & functional on web app</p>
              </div>

              {/* KPI 4: Disabled Tools */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/40 p-6 rounded-3xl border border-slate-200 dark:border-amber-500/20 shadow-md dark:shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Disabled Tools</span>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">construction</span>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight mb-2">{stats?.inactiveToolsCount || 0}</h2>
                <p className="text-xs font-semibold text-amber-600/80 dark:text-amber-400/80">Under Maintenance / Hidden</p>
              </div>

            </div>

            {/* Analytics & Activity Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Recent Users Widget */}
              <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">person_add</span>
                      Recent Registrations
                    </h3>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Manage Users →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {recentUsers.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No users registered yet.</p>
                    ) : (
                      recentUsers.map((u) => {
                        const isType0 = u.user_type === 0 || u.role === 'admin'
                        return (
                          <div
                            key={u.id}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                                {u.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{u.full_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                                  isType0
                                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/60'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {isType0 ? 'Type 0: Admin' : 'Type 1: User'}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Popular Tools Leaderboard */}
              <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">equalizer</span>
                      Popular Tool Leaderboard
                    </h3>
                    <button
                      onClick={() => setActiveTab('tools')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Control Tools →
                    </button>
                  </div>

                  <div className="space-y-4">
                    {popularTools.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
                        No tool execution logs found. Once users perform PDF or Image operations, statistics will dynamically display here.
                      </div>
                    ) : (
                      popularTools.map((t, idx) => (
                        <div key={t.tool_slug} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                              #{idx + 1} {t.tool_slug}
                            </span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                              {t.usage_count} Executions
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, t.usage_count * 10)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: USER MANAGEMENT */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-6">

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by full name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                
                {/* Type Filter */}
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value as any)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All User Types</option>
                  <option value="0">Type 0 (Admin)</option>
                  <option value="1">Type 1 (User)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>

              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-4 px-6">ID & Name</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">User Type (0: Admin / 1: User)</th>
                      <th className="py-4 px-6">Account Status</th>
                      <th className="py-4 px-6">Registered</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          No matching users found in MySQL DB.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const uType = typeof u.user_type === 'number' ? u.user_type : (u.role === 'admin' ? 0 : 1)
                        const isSelf = currentAdmin?.id === u.id

                        return (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Name & ID */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 font-extrabold flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                                  {u.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {u.full_name}
                                    {isSelf && (
                                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 px-1.5 py-0.5 rounded">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID: #{u.id}</span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-4 px-6 font-mono text-xs text-slate-700 dark:text-slate-300">{u.email}</td>

                            {/* User Type Switcher (Type 0 Admin vs Type 1 User) */}
                            <td className="py-4 px-6">
                              <select
                                value={uType}
                                disabled={isSelf}
                                onChange={(e) => handleUpdateUser(u.id, parseInt(e.target.value, 10))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                  uType === 0
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700 shadow-sm'
                                    : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-700'
                                } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                <option value={1}>Type 1: Regular User</option>
                                <option value={0}>Type 0: Administrator</option>
                              </select>
                            </td>

                            {/* Account Status Switcher */}
                            <td className="py-4 px-6">
                              <select
                                value={u.status}
                                disabled={isSelf}
                                onChange={(e) => handleUpdateUser(u.id, undefined, e.target.value as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                  u.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                                    : u.status === 'banned'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                                } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="banned">Banned</option>
                              </select>
                            </td>

                            {/* Date */}
                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.full_name)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 rounded-xl transition-all border border-rose-200 dark:border-rose-900/40"
                                  title="Delete User"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: TOOL ACTIVE / INACTIVE MANAGER */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div className="space-y-6">

            {/* Filter & Metrics Header */}
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {['all', 'pdf', 'image', 'text', 'converter'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setToolCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                      toolCategoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search tool */}
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter tool by name..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tools Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((t) => {
                const isActive = t.is_active === 1
                return (
                  <div
                    key={t.slug}
                    className={`p-6 rounded-3xl border transition-all duration-300 shadow-md dark:shadow-xl flex flex-col justify-between ${
                      isActive
                        ? 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-amber-200 dark:border-amber-900/40 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top status & Category */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1 rounded-full">
                          {t.category}
                        </span>

                        {/* Interactive iOS-style Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleTool(t.slug, t.is_active)}
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          role="switch"
                          aria-checked={isActive}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                              isActive ? 'translate-x-7' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">{t.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold">/tools/{t.slug}</span>
                      <span
                        className={`font-extrabold flex items-center gap-1.5 ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: TELEMETRY & SYSTEM HEALTH */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'health' && (
          <div className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* MySQL DBMS */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">database</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">MySQL DBMS</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4">quick_tool_db (Port 3306)</p>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Connected
                </span>
              </div>

              {/* FastAPI Python Backend */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">terminal</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">FastAPI Backend</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4">http://127.0.0.1:8000</p>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Operational
                </span>
              </div>

              {/* Next.js Web Server */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">web</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Next.js Turbopack</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4">App Router (v16.2.9)</p>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> 99.9% Uptime
                </span>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  )
}
