'use client';

import { motion } from 'motion/react';
import { Camera, Layers, MonitorPlay, ShieldCheck } from 'lucide-react';

// Four co-equal pillars — no sequence, no hierarchy
const pillars = [
  { id: 'detect',   Icon: Camera,      title: 'Vision AI',            desc: 'Real-time hazard detection on existing CCTV infrastructure'     },
  { id: 'document', Icon: Layers,      title: 'Spatial Intelligence', desc: 'Gaussian splatting capture for scene documentation'             },
  { id: 'train',    Icon: MonitorPlay, title: 'Immersive Platform',   desc: 'Platform-agnostic training delivery across web, mobile, and VR' },
  { id: 'assess',   Icon: ShieldCheck, title: 'Compliance Outcomes',  desc: 'SCORM-ready assessments with full compliance evidence trail'     },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cellVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function PlatformLoopDiagram() {
  return (
    <div className="w-full">

      {/* ── Desktop + tablet: 2×2 quadrant grid ── */}
      <motion.div
        className="hidden sm:grid grid-cols-2 divide-x divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {pillars.map(({ id, Icon, title, desc }) => (
          <motion.div
            key={id}
            variants={cellVariants}
            className="flex flex-col gap-2.5 px-5 py-5 bg-white hover:bg-neutral-50 transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 stroke-neutral-700" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-neutral-900 leading-snug">{title}</p>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Mobile: single-column list ── */}
      <motion.div
        className="sm:hidden flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {pillars.map(({ id, Icon, title, desc }) => (
          <motion.div
            key={id}
            variants={cellVariants}
            className="flex items-start gap-3 px-5 py-4 bg-white"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-4 h-4 stroke-neutral-700" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-neutral-900 leading-snug">{title}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}
