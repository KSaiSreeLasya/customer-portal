import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { SolarStage } from '../types';
import { SOLAR_STAGES } from '../constants';

interface StatusPipelineProps {
  currentStatus: SolarStage;
}

export function StatusPipeline({ currentStatus }: StatusPipelineProps) {
  const currentIndex = SOLAR_STAGES.indexOf(currentStatus);

  return (
    <div className="py-12 overflow-x-auto scrollbar-hide">
      <div className="relative min-w-[1000px] px-12">
        {/* Progress Background Track */}
        <div className="absolute top-6 left-16 right-16 h-0.5 bg-brand-primary/5 rounded-full" />
        
        {/* Active Progress Track */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: `calc(${(currentIndex / (SOLAR_STAGES.length - 1)) * 100}% - ${currentIndex === 0 ? 0 : 32}px)` 
          }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-6 left-16 h-0.5 bg-brand-primary rounded-full z-10 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        />

        {/* Milestones */}
        <div className="relative flex justify-between z-20">
          {SOLAR_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <div key={stage} className="flex flex-col items-center gap-5 w-28">
                {/* Node */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    opacity: 1,
                    backgroundColor: isCompleted ? '#1A1A1A' : isActive ? '#FFD43B' : '#FFFFFF',
                    borderColor: isCompleted ? '#1A1A1A' : isActive ? '#1A1A1A' : '#E9ECEF'
                  }}
                  transition={{ duration: 0.4 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 z-20 transition-all duration-500 ${
                    isActive ? 'shadow-xl shadow-brand-accent/20' : isCompleted ? 'shadow-lg shadow-black/5' : ''
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-brand-accent" strokeWidth={3} />
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E9ECEF]" />
                  )}
                </motion.div>

                {/* Label */}
                <div className="text-center px-1">
                  <p className={`text-[9px] font-black uppercase tracking-[0.15em] leading-tight transition-colors duration-500 ${
                    isActive ? 'text-brand-primary' : isCompleted ? 'text-brand-primary/60' : 'text-[#9E9E9E]'
                  }`}>
                    {stage}
                  </p>
                  {isActive && (
                    <motion.div 
                      layoutId="current-badge"
                      className="mt-2 px-2 py-0.5 bg-brand-primary rounded-md inline-block"
                    >
                      <span className="text-[7px] font-black text-brand-accent uppercase tracking-widest whitespace-nowrap">Current Node</span>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
