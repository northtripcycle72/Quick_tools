import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-16 transition-colors duration-300">
      <div className="container-max">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">QuickTools</span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Free, private, and powerful online tools for everyday document, image, text, and data operations.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
              All Systems Operational
            </div>
          </div>

          {/* Col 2: PDF & Image Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">Featured Utilities</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/tools/compress-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-to-word" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF to Word
                </Link>
              </li>
              <li>
                <Link href="/tools/image-compressor" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Image Compressor
                </Link>
              </li>
              <li>
                <Link href="/tools/background-remover" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Background Remover
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">Product & Plans</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  All 19 Utilities
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Pro Membership
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Admin Control Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">Trust & Legal</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Help & Contact
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} QuickTools DBMS. All rights reserved.</p>
          <p>Powered by MySQL & Next.js App Router</p>
        </div>

      </div>
    </footer>
  )
}