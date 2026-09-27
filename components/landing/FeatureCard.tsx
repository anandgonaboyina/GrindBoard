import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  glow: string;
}

export default function FeatureCard({ title, description, icon: Icon, color, bg, glow }: FeatureCardProps) {
  return (
    <div className="group relative flex flex-col p-6 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      
      {/* Ambient Hover Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-bl ${glow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

      <div className={`w-12 h-12 flex items-center justify-center rounded-xl border mb-4 relative z-10 transition-transform duration-300 group-hover:scale-110 ${bg}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>

      <h3 className="text-lg font-black text-white tracking-tight mb-2 relative z-10">
        {title}
      </h3>
      
      <p className="text-sm font-medium text-white/60 leading-relaxed relative z-10">
        {description}
      </p>
    </div>
  );
}