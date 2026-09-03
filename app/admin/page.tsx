"use client";
import React from 'react';
import { ShieldAlert, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import AdminNewsManager from '@/components/admin/News/AdminNewsManager';

export default function AdminPage() {
  return (
    <div className="h-[100dvh] bg-gradient-to-br from-[#0f172a] via-[#09090b] to-[#1e1b4b] overflow-hidden flex flex-col w-full max-w-full relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50 sticky top-0 z-50 backdrop-blur-md">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-white text-lg font-bold flex items-center gap-2">
          <ShieldAlert size={18} className="text-indigo-400" />
          Global Admin Panel
        </h1>
      </div>
      <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col items-center w-full min-w-0">
        <div className="max-w-5xl w-full mx-auto flex flex-col mt-4 min-w-0 flex-1">

          <div className="flex items-center gap-2 mb-8">
            <Settings className="text-white/40 w-6 h-6" />
            <h2 className="text-2xl font-bold text-white">Dashboard Administration</h2>
          </div>

          <div className="flex-1 flex flex-col min-h-0 w-full">
            <AdminNewsManager />
          </div>

        </div>
      </div>
    </div>
  );
}
