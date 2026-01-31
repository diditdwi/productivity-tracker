import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { cn } from '../lib/utils';
import teamworkImg from '../assets/motivation/teamwork.png';
import innovationImg from '../assets/motivation/innovation.png';
import growthImg from '../assets/motivation/growth.png';

const dailyMotivations = [
  {
    image: teamworkImg,
    theme: 'Teamwork',
    quote: 'Kekuatan tim adalah rahasia kesuksesan terbesar.',
    sub: 'Transformasikan tantangan menjadi peluang untuk memberikan pelayanan terbaik.',
    author: 'Michael Jordan',
    color: 'from-blue-500/20 to-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-300'
  },
  {
    image: innovationImg,
    theme: 'Innovation',
    quote: 'Inovasi membedakan pemimpin dari pengikut.',
    sub: 'Inovasi dimulai dari sikap positif dan kemauan untuk mencoba hal baru.',
    author: 'Steve Jobs',
    color: 'from-orange-500/20 to-purple-500/20',
    textColor: 'text-purple-700 dark:text-purple-300'
  },
  {
    image: growthImg,
    theme: 'Growth',
    quote: 'Setiap hari adalah kesempatan untuk menjadi versi terbaik diri sendiri.',
    sub: 'Setiap masalah adalah kesempatan untuk berkembang lebih jauh.',
    author: 'Anonymous',
    color: 'from-green-500/20 to-blue-500/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  }
];

export default function MotivationalWidget({ className }) {
  const motivation = useMemo(() => {
    // Use the day of the year to rotate motivations
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Rotate through the array
    return dailyMotivations[dayOfYear % dailyMotivations.length];
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-glass-sm",
        "bg-gradient-to-br bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl",
        className
      )}
    >
      {/* Dynamic Background Gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 dark:opacity-20", motivation.color)} />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Floating Image */}
        <motion.div 
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/50 dark:bg-white/5 rounded-full p-4 border-4 border-white/30 shadow-xl backdrop-blur-sm">
             <img 
               src={motivation.image} 
               alt={motivation.theme} 
               className="w-full h-full object-contain filter drop-shadow-md"
             />
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/20 shadow-sm">
            <span className={cn("text-xs font-bold uppercase tracking-wider", motivation.textColor)}>
              ✨ {motivation.theme}
            </span>
          </div>
          
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-8 h-8 text-current opacity-10 rotate-180" />
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
              "{motivation.quote}"
            </h3>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">
             {motivation.sub}
          </p>
          
          <div className="pt-2 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
            — {motivation.author}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
