'use client';

import React from 'react';
import FeatureCard from './FeatureCard';
import { CORE_FEATURES } from './featureData';

export default function FeatureShowcase() {
  return (
    <section className="w-full py-12 md:py-20 px-4 md:px-8 relative z-10 flex flex-col items-center justify-center">
      
      {/* Header Section */}
      <div className="max-w-3xl text-center mb-10 md:mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
          Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Deep Work.</span>
        </h2>
        <p className="text-sm md:text-base font-bold text-white/50 uppercase tracking-widest">
          The ultimate engine to measure and beat your best self.
        </p>
      </div>

      {/* Dynamic Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-5xl relative z-10">
        {CORE_FEATURES.map((feature) => (
          <FeatureCard 
            key={feature.id}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            color={feature.color}
            bg={feature.bg}
            glow={feature.glow}
          />
        ))}
      </div>
      
    </section>
  );
}