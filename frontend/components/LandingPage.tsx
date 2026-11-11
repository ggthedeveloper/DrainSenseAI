"use client";

import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { RainField } from "@/components/RainField";

const ease = [0.16, 1, 0.3, 1] as const;

interface LandingPageProps {
  onEnterDashboard: () => void;
}

export function LandingPage({ onEnterDashboard }: LandingPageProps) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay, ease },
        };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#F3F7F6] text-[#12262A]">
      <RainField />
      <header className="relative z-10 mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="text-sm font-semibold tracking-tight">DrainSense</div>
        <Button type="button" onClick={onEnterDashboard}>
          Open console
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:pt-16">
        <div className="max-w-xl">
          <motion.p className="text-sm font-medium text-[#115E59]" {...rise(0)}>
            Vijayawada
          </motion.p>
          <motion.h1
            className="mt-3 max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
            {...rise(0.05)}
          >
            See which wards flood first.
          </motion.h1>
          <motion.p className="mt-4 max-w-[42ch] text-base leading-relaxed text-[#4C5E62]" {...rise(0.1)}>
            500 m waterlogging risk for Vijayawada, from rainfall, terrain, and past floods.
          </motion.p>
          <motion.div className="mt-8" {...rise(0.16)}>
            <Button type="button" size="lg" onClick={onEnterDashboard}>
              Open console
            </Button>
          </motion.div>
        </div>

        <motion.figure
          className="relative min-h-[280px] overflow-hidden rounded-xl border border-[#D5E2E0] lg:min-h-[520px]"
          {...rise(0.12)}
        >
          <img
            src="/monsoon_backdrop.jpg"
            alt="Rain over the Krishna river corridor at Vijayawada"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#F3F7F6] via-[#F3F7F6]/20 to-transparent" />
        </motion.figure>
      </main>

      <section className="relative z-10 border-t border-[#D5E2E0] bg-[#FBFDFC]">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <h2 className="max-w-[14ch] text-3xl font-semibold tracking-tight md:text-4xl">
            Rain, ground, and the floods already on record.
          </h2>
          <p className="max-w-[42ch] text-base leading-relaxed text-[#4C5E62]">
            Each cell is a 500 m ward sector. The score ranks susceptibility for the next few hours. It is not a street-level water depth.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <p className="max-w-3xl text-2xl font-medium leading-snug tracking-tight md:text-3xl">
          Open the console to inspect the live grid, the ranked wards, and the model report. No sign-in.
        </p>
      </section>
    </div>
  );
}
