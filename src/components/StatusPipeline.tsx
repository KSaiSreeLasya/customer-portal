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
    <div className="py-8 overflow-x-auto scrollbar-hide">
      <div className="relative min-w-[900px] px-8">
        {/* Progress Background Track */}
        <div className="absolute top-6 left-12 right-12 h-1 bg-[#F5F5F4] rounded-full" />
        
        {/* Active Progress Track */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: `calc(${(currentIndex / (SOLAR_STAGES.length - 1)) * 100}% - ${currentIndex === 0 ? 0 : 24}px)` 
          }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="absolute top-6 left-12 h-1 bg-black rounded-full z-10"
        />

        {/* Milestones */}
        <div className="relative flex justify-between z-20">
          {SOLAR_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <div key={stage} className="flex flex-col items-center gap-3 w-24">
                {/* Node */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.25 : 1,
                    opacity: 1,
                    borderColor: isActive || isCompleted ? '#000000' : '#E5E5E5',
                    backgroundColor: isCompleted ? '#000000' : '#FFFFFF'
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 z-20 shadow-sm ${
                    isActive ? 'shadow-lg shadow-black/10' : ''
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-white" />
                  ) : isActive ? (
                    <div className="w-3 h-3 rounded-full bg-black animate-pulse" />
                  ) : (
                    <Circle size={16} className="text-[#9E9E9E]" />
                  )}
                </motion.div>

                {/* Label */}
                <div className="text-center px-1">
                  <p className={`text-[10px] font-black uppercase tracking-tighter leading-tight ${
                    isActive ? 'text-black' : isCompleted ? 'text-[#424242]' : 'text-[#9E9E9E]'
                  }`}>
                    {stage}
                  </p>
                  {isActive && (
                    <motion.span 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[8px] font-bold text-black/40 uppercase tracking-widest mt-1 block"
                    >
                      Active
                    </motion.span>
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
