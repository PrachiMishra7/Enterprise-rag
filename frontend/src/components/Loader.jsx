import { motion } from 'framer-motion';
import { Loader2, Sparkles, RefreshCw, Cpu } from 'lucide-react';

export default function Loader({ 
  size = 'md',          // 'sm' | 'md' | 'lg' | 'full'
  text = 'Loading…', 
  subtext = '',
  variant = 'spinner'   // 'spinner' | 'pulse' | 'dots' | 'glow'
}) {
  if (size === 'full') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px] w-full bg-background text-foreground relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <motion.div 
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-16 h-16 rounded-full bg-primary/20 border border-primary/40"
            />
            
            {/* Spinning core */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-2xl bg-card border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Cpu className="w-6 h-6 text-primary" />
            </motion.div>
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2 justify-center">
              {text}
            </h3>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{subtext}</p>
            )}
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.span
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="inline-flex items-center gap-1.5">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
    );
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center gap-3 text-muted-foreground p-4">
      <Loader2 className={`${iconSizes[size] || iconSizes.md} text-primary animate-spin`} />
      {text && <span className="text-xs font-semibold text-foreground">{text}</span>}
    </div>
  );
}
