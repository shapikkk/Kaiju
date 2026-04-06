import { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container } from "@tsparticles/engine";

export function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const particlesLoaded = useCallback(
    async (_container: Container | undefined) => {},
    [],
  );

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      className="pointer-events-none fixed inset-0 -z-10"
      particlesLoaded={particlesLoaded}
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: false },
            onClick: { enable: false },
          },
        },
        particles: {
          color: { value: "#888888" },
          links: {
            color: "#888888",
            distance: 160,
            enable: true,
            opacity: 0.15,
            width: 0.8,
          },
          move: {
            enable: true,
            speed: 0.4,
            direction: "none",
            random: true,
            straight: false,
            outModes: { default: "bounce" },
          },
          number: {
            value: 55,
            density: { enable: true },
          },
          opacity: {
            value: { min: 0.08, max: 0.22 },
            animation: { enable: true, speed: 0.4, sync: false },
          },
          shape: { type: "circle" },
          size: {
            value: { min: 1, max: 2.5 },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
