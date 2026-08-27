'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Fetch Current MySQL User Session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setEmail(data.user.email)
          setDisplayName(data.user.full_name || data.user.email.split('@')[0])
          setRole(data.user.role || 'user')
        } else {
          // Supabase Fallback Check
          supabase.auth.getSession().then(({ data: sbData }) => {
            const sbUser = sbData.session?.user
            if (sbUser) {
              setEmail(sbUser.email || '')
              setDisplayName(sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || '')
            }
          })
        }
      })
      .catch(() => {})

    const isDarkClass = document.documentElement.classList.contains('dark')
    setIsDark(isDarkClass)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
    } catch {}
    setEmail('')
    setDisplayName('')
    setRole('user')
    router.push('/')
    router.refresh()
  }

  const toggleDarkMode = () => {
    const active = document.documentElement.classList.toggle('dark')
    setIsDark(active)
    localStorage.setItem('theme', active ? 'dark' : 'light')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 transition-all duration-300 shadow-sm">
      <div className="flex justify-between items-center h-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        
        {/* Brand & Main Nav */}
        <div className="flex items-center gap-8 lg:gap-12">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                QuickTools
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 -mt-1">
                Workspace
              </span>
            </div>
          </Link>

          {/* Desktop Mega Nav */}
          <nav className="hidden lg:flex items-center gap-6 whitespace-nowrap text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            
            {/* PDF Tools */}
            <div className="relative group nav-item py-4">
              <button className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span>PDF Tools</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <div className="mega-menu absolute top-full left-0 pt-2 w-64">
                <div className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <Link href="/tools/compress-pdf" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">compress</span>
                    <div>
                      <div className="text-sm font-bold">Compress PDF</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Reduce file size</div>
                    </div>
                  </Link>
                  <Link href="/tools/pdf-to-word" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">description</span>
                    <div>
                      <div className="text-sm font-bold">PDF to Word</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Editable Word DOCX</div>
                    </div>
                  </Link>
                  <Link href="/tools/merge-pdf" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">call_merge</span>
                    <div>
                      <div className="text-sm font-bold">Merge PDF</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Combine documents</div>
                    </div>
                  </Link>
                  <Link href="/tools/split-pdf" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">call_split</span>
                    <div>
                      <div className="text-sm font-bold">Split PDF</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Extract pages</div>
                    </div>
                  </Link>
                  <Link href="/tools/pdf-to-text" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">document_scanner</span>
                    <div>
                      <div className="text-sm font-bold">OCR PDF</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">AI Text Extraction</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Image Tools */}
            <div className="relative group nav-item py-4">
              <button className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span>Image Tools</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <div className="mega-menu absolute top-full left-0 pt-2 w-64">
                <div className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <Link href="/tools/image-compressor" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">photo_size_select_small</span>
                    <div>
                      <div className="text-sm font-bold">Image Compressor</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">PNG, JPG & SVG</div>
                    </div>
                  </Link>
                  <Link href="/tools/resize-image" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">aspect_ratio</span>
                    <div>
                      <div className="text-sm font-bold">Resize Image</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Custom dimensions</div>
                    </div>
                  </Link>
                  <Link href="/tools/background-remover" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">person_remove</span>
                    <div>
                      <div className="text-sm font-bold">Background Remover</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">AI cutout</div>
                    </div>
                  </Link>
                  <Link href="/tools/image-converter" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">sync_alt</span>
                    <div>
                      <div className="text-sm font-bold">Image Converter</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">JPG, PNG, WEBP</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Converters */}
            <div className="relative group nav-item py-4">
              <button className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span>Converters</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <div className="mega-menu absolute top-full left-0 pt-2 w-64">
                <div className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <Link href="/tools/json-to-csv" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">data_object</span>
                    <div>
                      <div className="text-sm font-bold">JSON to CSV</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Spreadsheet converter</div>
                    </div>
                  </Link>
                  <Link href="/tools/unit-converter" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">straighten</span>
                    <div>
                      <div className="text-sm font-bold">Unit Converter</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Metrics & Weights</div>
                    </div>
                  </Link>
                  <Link href="/tools/currency-converter" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 transition-all font-semibold">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">payments</span>
                    <div>
                      <div className="text-sm font-bold">Currency Converter</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Real-time rates</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Pricing
            </Link>

          </nav>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-4 shrink-0">
          
          {/* Theme Switcher Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            <span className="material-symbols-outlined text-xl">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Admin / User Dropdown */}
          {email ? (
            <div className="relative group nav-item">
              <button className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-700/60 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all font-bold text-xs">
                <span className="material-symbols-outlined text-base">
                  {role === 'admin' ? 'admin_panel_settings' : 'account_circle'}
                </span>
                <span className="truncate max-w-[120px]">{displayName}</span>
                {role === 'admin' && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    ADMIN
                  </span>
                )}
              </button>

              <div className="mega-menu absolute top-full right-0 pt-2 w-64">
                <div className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{email}</p>
                  </div>

                  {role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs"
                    >
                      <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                      Admin Console
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 transition-all font-bold text-xs text-left"
                  >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth?tab=login"
                className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth?tab=register"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <span className="material-symbols-outlined text-2xl">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>

        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4">
          <div className="flex flex-col gap-3 font-bold text-sm text-slate-700 dark:text-slate-300">
            <Link href="/" onClick={() => setMenuOpen(false)} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900">
              Home
            </Link>
            <Link href="/pricing" onClick={() => setMenuOpen(false)} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900">
              Pricing
            </Link>
            {role === 'admin' && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black">
                👑 Admin Control Console
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {email ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sign Out ({displayName})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/auth?tab=login"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-center font-bold text-xs border border-slate-200 dark:border-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?tab=register"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 rounded-2xl bg-indigo-600 text-white text-center font-black text-xs shadow-lg shadow-indigo-600/30"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}