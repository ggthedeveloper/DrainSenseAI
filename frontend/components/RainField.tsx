"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { useReducedMotion } from "motion/react";

async function registerSlim(engine: Engine) {
  await loadSlim(engine);
}

export function RainField() {
  const reduce = useReducedMotion();
  const [narrow, setNarrow] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onMedia = () => setNarrow(media.matches);
    const onVis = () => setHidden(document.hidden);
    onMedia();
    onVis();
    media.addEventListener("change", onMedia);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      media.removeEventListener("change", onMedia);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 40,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      detectRetina: true,
      particles: {
        number: { value: narrow ? 16 : 40 },
        color: { value: "#7BA9A4" },
        opacity: { value: 0.35 },
        size: { value: { min: 1, max: 2.2 } },
        move: {
          enable: true,
          speed: 0.7,
          direction: "bottom",
          straight: false,
          outModes: { default: "out" },
        },
      },
      interactivity: {
        detectsOn: "window",
        events: { onHover: { enable: false }, onClick: { enable: false } },
      },
    }),
    [narrow]
  );

  if (reduce || hidden) return null;

  return (
    <ParticlesProvider init={registerSlim}>
      <Particles
        id="rain-field"
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ pointerEvents: "none" }}
        options={options}
      />
    </ParticlesProvider>
  );
}
