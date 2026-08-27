'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/* ─── Tool Data Definition ─── */
type Tool = {
  slug: string
  icon: string
  name: string
  desc: string
  badge?: 'Popular' | 'AI Powered' | 'Fast' | 'Pro'
}

type Category = {
  id: string
  label: string
  icon: string
  color: string
  tools: Tool[]
}

const CATEGORIES: Category[] = [
  {
    id: 'pdf',
    label: 'PDF Tools',
    icon: 'picture_as_pdf',
    color: 'from-rose-500 to-red-600',
    tools: [
      { slug: 'compress-pdf', icon: 'compress', name: 'Compress PDF', desc: 'Reduce PDF file size while maintaining original quality.', badge: 'Popular' },
      { slug: 'pdf-to-word', icon: 'description', name: 'PDF to Word', desc: 'Convert PDF files to editable Word documents seamlessly.', badge: 'Fast' },
      { slug: 'merge-pdf', icon: 'call_merge', name: 'Merge PDF', desc: 'Combine multiple PDFs into a single organized document.', badge: 'Popular' },
      { slug: 'split-pdf', icon: 'call_split', name: 'Split PDF', desc: 'Extract specific pages or separate PDF files in seconds.' },
      { slug: 'pdf-to-text', icon: 'document_scanner', name: 'OCR PDF', desc: 'Extract readable text from scanned PDF documents.', badge: 'AI Powered' },
    ],
  },
  {
    id: 'image',
    label: 'Image Tools',
    icon: 'image',
    color: 'from-indigo-500 to-blue-600',
    tools: [
      { slug: 'image-compressor', icon: 'photo_size_select_small', name: 'Image Compressor', desc: 'Compress PNG, JPG, and SVG images with zero visual loss.', badge: 'Popular' },
      { slug: 'resize-image', icon: 'aspect_ratio', name: 'Resize Image', desc: 'Change dimensions by custom width, height, or percentages.' },
      { slug: 'background-remover', icon: 'person_remove', name: 'Background Remover', desc: 'Remove image backgrounds automatically using AI OCR.', badge: 'AI Powered' },
      { slug: 'image-converter', icon: 'sync_alt', name: 'Image Converter', desc: 'Convert between PNG, JPG, WEBP, GIF, and SVG formats.' },
      { slug: 'merge-images', icon: 'call_merge', name: 'Merge Images', desc: 'Combine multiple images side-by-side or vertically into one canvas.' },
      { slug: 'image-to-text', icon: 'document_scanner', name: 'Image to Text', desc: 'Extract handwritten and printed text directly from photos.', badge: 'AI Powered' },
      { slug: 'image-to-pdf', icon: 'picture_as_pdf', name: 'Image to PDF', desc: 'Convert photo collections into a clean single PDF file.' },
    ],
  },
  {
    id: 'text',
    label: 'Text Tools',
    icon: 'text_fields',
    color: 'from-emerald-500 to-teal-600',
    tools: [
      { slug: 'word-counter', icon: 'pin', name: 'Word Counter', desc: 'Count words, characters, sentences, and estimated reading time.' },
      { slug: 'case-converter', icon: 'format_letter_spacing', name: 'Case Converter', desc: 'Convert text to UPPERCASE, lowercase, Title Case, or CamelCase.' },
      { slug: 'remove-line-breaks', icon: 'wrap_text', name: 'Remove Line Breaks', desc: 'Clean formatting, remove trailing spaces, and join paragraphs.' },
      { slug: 'bulk-ocr', icon: 'batch_prediction', name: 'Bulk OCR', desc: 'Process up to 50 images in batch to extract text at once.', badge: 'AI Powered' },
    ],
  },
  {
    id: 'converters',
    label: 'Converters',
    icon: 'swap_horiz',
    color: 'from-amber-500 to-orange-600',
    tools: [
      { slug: 'json-to-csv', icon: 'data_object', name: 'JSON to CSV/Excel', desc: 'Transform JSON structured data into clean CSV spreadsheets.' },
      { slug: 'unit-converter', icon: 'straighten', name: 'Unit Converter', desc: 'Convert length, weight, area, volume, and temperature units.' },
      { slug: 'currency-converter', icon: 'payments', name: 'Currency Converter', desc: 'Real-time global currency exchange rates converter.' },
      { slug: 'qr-code-generator', icon: 'qr_code_2', name: 'QR Code Generator', desc: 'Generate custom QR codes for websites, WiFi, and contacts.' },
    ],
  },
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({})

  // Fetch active tool configuration from MySQL
  useEffect(() => {
    fetch('/api/tools/active-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.activeMap) {
          setActiveMap(data.activeMap)
        }
      })
      .catch(() => {})
  }, [])

  // Filter Categories & Tools dynamically based on Active Status + Category Tab + Search Term
  const displayCategories = useMemo(() => {
    return CATEGORIES.map((cat) => {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) {
        return { ...cat, tools: [] }
      }
      return {
        ...cat,
        tools: cat.tools.filter((t) => {
          // Hide deactivated tools
          if (activeMap[t.slug] === false) return false

          // Search term filter
          if (!searchTerm) return true
          const term = searchTerm.toLowerCase()
          return t.name.toLowerCase().includes(term) || t.desc.toLowerCase().includes(term)
        }),
      }
    }).filter((cat) => cat.tools.length > 0)
  }, [selectedCategory, activeMap, searchTerm])

  const totalActiveToolsCount = useMemo(() => {
    return CATEGORIES.flatMap((c) => c.tools).filter((t) => activeMap[t.slug] !== false).length
  }, [activeMap])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">
      <Navbar />

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        {/* Glowing Background Blur Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-pink-500/15 dark:from-indigo-600/30 dark:via-purple-600/20 dark:to-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container-max relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-8 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping" />
            <span>{totalActiveToolsCount} Active Professional Utilities</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="text-emerald-600 dark:text-emerald-400">100% Free & Unlimited</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6 text-slate-900 dark:text-white">
            All Your Everyday Digital Tools,{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">
              In One Secure Workspace
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            Compress PDFs, remove backgrounds, convert formats, and extract OCR text instantly. Fast, private, and powered by browser-first computing.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto relative group mb-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-md opacity-25 dark:opacity-30 group-hover:opacity-60 dark:group-hover:opacity-75 transition duration-500"></div>
            <div className="relative flex items-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2 shadow-xl backdrop-blur-xl">
              <span className="material-symbols-outlined text-slate-400 ml-4 text-2xl">search</span>
              <input
                type="text"
                placeholder="Search tools (e.g. PDF to Word, Image Compressor, OCR)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base focus:outline-none font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white mr-2"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Quick Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span className="text-slate-400 dark:text-slate-500">Popular Queries:</span>
            {['compress-pdf', 'background-remover', 'image-compressor', 'json-to-csv'].map((slug) => (
              <button
                key={slug}
                onClick={() => setSearchTerm(slug.replace('-', ' '))}
                className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all shadow-xs"
              >
                {slug.replace('-', ' ')}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ═══ STATS & TRUST BAR ═══ */}
      <section className="border-y border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md py-10">
        <div className="container-max grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">19+</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Online Utilities</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">100%</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Privacy Guaranteed</div>
          </div>
          <div>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">0 Server</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Storage Retention</div>
          </div>
          <div>
            <div className="text-3xl font-black text-pink-600 dark:text-pink-400 mb-1">⚡ Instant</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Browser Execution</div>
          </div>
        </div>
      </section>

      {/* ═══ TOOL CATEGORIES & GRID ═══ */}
      <section className="py-20 container-max">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Categories ({totalActiveToolsCount})
          </button>
          {CATEGORIES.map((cat) => {
            const count = cat.tools.filter((t) => activeMap[t.slug] !== false).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Display Tool Cards */}
        <div className="space-y-16">
          {displayCategories.map((category) => (
            <div key={category.id} className="space-y-6">
              
              {/* Category Title */}
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${category.color} text-white flex items-center justify-center shadow-md`}>
                  <span className="material-symbols-outlined text-xl">{category.icon}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{category.label}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{category.tools.length} Tools Available</p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 shadow-md dark:shadow-xl flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden"
                  >
                    {/* Badge */}
                    {tool.badge && (
                      <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 shadow-xs">
                        {tool.badge}
                      </span>
                    )}

                    <div>
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-800 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-300 shadow-xs">
                        <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                      </div>

                      {/* Info */}
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-6 font-medium">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <span>Launch Utility</span>
                      <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          ))}

          {/* Empty Search Result State */}
          {displayCategories.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-600 mb-4">search_off</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Matching Tools Found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                We couldn&apos;t find any active tool matching &quot;{searchTerm}&quot;. Try searching for another keyword or browse all categories.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-500 transition-all shadow-md"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

      </section>

      {/* ═══ WHY QUICKTOOLS SECTION ═══ */}
      <section className="py-20 bg-white dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
        <div className="container-max">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
              Engineered for Speed, Privacy & Precision
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
              We built QuickTools to solve everyday digital file bottlenecks without privacy compromises or paywalls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">bolt</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Lightning Browser Processing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Operations execute right inside your browser session, delivering sub-second response times without server delays.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">shield</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Zero Cloud Retention</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Your documents and confidential images stay private. No files are stored or analyzed on external third-party servers.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">AI Powered Precision</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                High accuracy background removal, image vector conversions, and OCR text recognition built for professionals.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ═══ CTA PRO BANNER ═══ */}
      <section className="py-24 relative overflow-hidden">
        <div className="container-max">
          <div className="relative rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 dark:from-indigo-900 dark:via-indigo-800 dark:to-purple-900 p-10 sm:p-16 border border-indigo-500/30 overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                Unlock Pro Features & Batch Power
              </h2>
              <p className="text-indigo-100 dark:text-indigo-200 text-base mb-8 font-medium">
                Process up to 50 files simultaneously, unlock higher resolution AI background removals, and access priority OCR API endpoints.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/pricing"
                  className="px-8 py-4 rounded-2xl bg-white text-indigo-950 font-black text-sm hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                >
                  Explore Pro Plans
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 rounded-2xl bg-indigo-950/60 text-white border border-indigo-400/40 font-black text-sm hover:bg-indigo-900/60 transition-all backdrop-blur-md"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}