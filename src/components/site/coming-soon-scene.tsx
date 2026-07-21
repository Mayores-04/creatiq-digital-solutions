"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Center, useGLTF } from "@react-three/drei";
import type { Group } from "three";

import { brand } from "@/components/site/brand";

const MODEL_URL =
  "/models/creatiq_digital_solutions_logo_bright_blue_match.glb";

type SceneSettings = {
  reduceMotion: boolean;
  lowQuality: boolean;
};

const DEFAULT_SETTINGS: SceneSettings = {
  reduceMotion: false,
  lowQuality: false,
};

function FloatingLogo({ reduceMotion }: { reduceMotion: boolean }) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);

  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      child.frustumCulled = false;
    });

    return clonedScene;
  }, [scene]);

  useFrame((_state, delta) => {
    const group = groupRef.current;

    if (!group || reduceMotion) {
      return;
    }

    elapsedRef.current += delta;

    const elapsed = elapsedRef.current;

    group.rotation.x = Math.sin(elapsed * 0.55) * 0.035;

    group.rotation.y = -0.25 + Math.sin(elapsed * 0.35) * 0.28;

    group.rotation.z = Math.sin(elapsed * 0.4) * 0.015;

    group.position.y = Math.sin(elapsed * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef} rotation={[0, -0.25, 0]} dispose={null}>
      <Center>
        <primitive object={model} dispose={null} />
      </Center>
    </group>
  );
}

function LogoCanvas({ settings }: { settings: SceneSettings }) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 7],
        fov: 34,
        near: 0.01,
        far: 100,
      }}
      dpr={settings.lowQuality ? 1 : [1, 1.5]}
      gl={{
        alpha: true,
        depth: true,
        stencil: false,
        antialias: !settings.lowQuality,
        powerPreference: "high-performance",
      }}
      performance={{
        min: 0.5,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = settings.lowQuality ? 1.25 : 1.65;
      }}
      className="h-full w-full"
    >
      <ambientLight intensity={1.7} />

      <hemisphereLight args={["#dff7ff", "#020b1f", 1.3]} />

      <directionalLight position={[4, 5, 5]} intensity={3.8} color="#e0f7ff" />

      <directionalLight position={[-4, 3, 3]} intensity={2.2} color="#38bdf8" />

      <pointLight position={[0, 2, 5]} intensity={3.2} color="#22d3ee" />

      <pointLight position={[3, -1, 4]} intensity={1.8} color="#0ea5e9" />

      <pointLight position={[-3, -1, 4]} intensity={1.4} color="#3b82f6" />

      {!settings.lowQuality && (
        <spotLight
          position={[0, 5, 6]}
          angle={0.5}
          penumbra={1}
          intensity={2.4}
          color="#67e8f9"
        />
      )}

      <Suspense fallback={null}>
        <Bounds fit clip margin={1.15}>
          <FloatingLogo reduceMotion={settings.reduceMotion} />
        </Bounds>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);

const websiteHighlights = [
  {
    number: "01",
    title: "Explore our services",
  },
  {
    number: "02",
    title: "View our projects",
  },
  {
    number: "03",
    title: "Start a project",
  },
];

export function ComingSoonScene() {
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let resizeFrame = 0;

    function updateSettings() {
      setSettings({
        reduceMotion: motionQuery.matches,
        lowQuality:
          window.innerWidth < 640 || (navigator.hardwareConcurrency ?? 8) <= 4,
      });
    }

    function handleResize() {
      window.cancelAnimationFrame(resizeFrame);

      resizeFrame = window.requestAnimationFrame(updateSettings);
    }

    updateSettings();

    window.addEventListener("resize", handleResize);

    motionQuery.addEventListener("change", updateSettings);

    return () => {
      window.cancelAnimationFrame(resizeFrame);

      window.removeEventListener("resize", handleResize);

      motionQuery.removeEventListener("change", updateSettings);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b1f] px-5 py-6 text-white sm:px-8 lg:px-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(8,189,255,0.20),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.13),transparent_40%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,31,0.18),rgba(2,11,31,0.9))]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl sm:h-[44rem] sm:w-[44rem]" />

      <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 bottom-16 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={240}
            height={80}
            priority
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
          />

          <div className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-[0.6rem] font-black uppercase tracking-[0.28em] text-cyan-200 shadow-[0_0_28px_rgba(8,189,255,0.15)] backdrop-blur-md sm:px-5">
            Launching soon
          </div>
        </header>

        {/* Main content */}
        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:py-5">
          {/* Left side */}
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.4em] text-cyan-300">
              Creatiq Digital Solutions
            </p>

            <h1 className="max-w-2xl text-balance text-5xl font-black leading-[0.92] tracking-[-0.07em] text-[#cbd4ff] sm:text-7xl lg:text-[5.25rem]">
              A better Creatiq experience is coming.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              We&apos;re refreshing our public website so you can easily explore
              our services, view our latest projects, and connect with our team.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {websiteHighlights.map((item) => (
                <div
                  key={item.number}
                  className="rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-4 shadow-[0_0_30px_rgba(8,189,255,0.07)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300/10 text-xs font-black text-cyan-200 ring-1 ring-cyan-300/20">
                    {item.number}
                  </span>

                  <p className="mt-4 text-sm font-bold leading-5 text-slate-200">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-start gap-3 text-sm leading-6 text-slate-400 sm:items-center">
              <span className="mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)] sm:mt-0" />

              <span>Our refreshed public website will be available soon.</span>
            </div>
          </div>

          {/* Right side */}
          <div className="relative min-h-[29rem] overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-white/[0.035] shadow-[0_0_80px_rgba(8,189,255,0.14)] backdrop-blur-xl sm:min-h-[34rem] lg:min-h-[42rem]">
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[9.5rem] sm:bottom-[10.25rem]">
              <LogoCanvas settings={settings} />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[9.5rem] bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,11,31,0.04)_48%,rgba(2,11,31,0.72)_100%)] sm:bottom-[10.25rem]" />

            <div className="pointer-events-none absolute left-1/2 top-[38%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 bg-cyan-300/[0.025] shadow-[0_0_80px_rgba(34,211,238,0.08)]" />

            {/* Progress panel */}
            <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-cyan-300/15 bg-[#03132d]/90 p-5 shadow-[0_0_48px_rgba(8,189,255,0.14)] backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.32em] text-cyan-300">
                  Create. Innovate. Elevate.
                </p>

                <span className="text-xs font-bold text-cyan-200">80%</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-200 shadow-[0_0_24px_rgba(8,189,255,0.5)]" />
              </div>

              <p className="mt-3 text-sm text-slate-300">
                Preparing a better online experience for you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
