import React, { useState } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinkStyle = "text-slate-300 hover:text-cyan-400 text-sm font-medium transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]";

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050a0f]/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tighter text-white">
                LIQUI<span className="text-cyan-400">MAP</span>
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                v1.0
              </span>
            </Link>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/#recursos" className={navLinkStyle}>Recursos</Link>
              <Link href="/#precos" className={navLinkStyle}>Preços</Link>
              <Link href="/#comparativo" className={navLinkStyle}>vs Bookmap</Link>
              <Link href="/demo" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                Aceder Demo Live
              </Link>
            </div>
          </div>

          {/* Botão Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0f14] border-b border-slate-800 p-4 space-y-4">
          <Link href="/#recursos" className="block text-slate-300 py-2">Recursos</Link>
          <Link href="/#precos" className="block text-slate-300 py-2">Preços</Link>
          <Link href="/#comparativo" className="block text-slate-300 py-2">vs Bookmap</Link>
          <Link href="/demo" className="block bg-cyan-600 text-center text-white py-3 rounded-lg font-bold">
            Aceder Demo Live
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
