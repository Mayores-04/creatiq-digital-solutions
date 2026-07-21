"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

import { brand } from "@/components/site/brand";

const MODEL_URL =
  "/models/creatiq_digital_solutions_logo_bright_blue_match.glb";

type SceneSettings = {
  lowEnd: boolean;
  reduceMotion: boolean;
  modelScale: number;
  cameraDistance: number;
};

function getSceneSettings(): SceneSettings {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      lowEnd: false,
      reduceMotion: false,
      modelScale: 0.58,
      cameraDistance: 8.7,
    };
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const width = window.innerWidth;
  const weakDevice = (navigator.hardwareConcurrency || 4) <= 4 || (nav.deviceMemory || 4) <= 4;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (width < 640) {
    return {
      lowEnd: true,
      reduceMotion,
      modelScale: 0.42,
      cameraDistance: 10.8,
    };
  }

  if (width < 1024) {
    return {
      lowEnd: weakDevice,
      reduceMotion,
      modelScale: 0.48,
      cameraDistance: 10,
    };
  }

  return {
    lowEnd: weakDevice,
    reduceMotion,
    modelScale: width < 1440 ? 0.55 : 0.62,
    cameraDistance: width < 1440 ? 9 : 8.5,
  };
}

function FloatingLogo({
  reduceMotion,
  scale,
}: {
  reduceMotion: boolean;
  scale: number;
}) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_state, delta) => {
    if (!groupRef.current || reduceMotion) return;

    elapsedRef.current += delta;
    groupRef.current.rotation.y += delta * 0.18;
    groupRef.current.rotation.x = Math.sin(elapsedRef.current * 0.65) * 0.045;
    groupRef.current.position.y = Math.sin(elapsedRef.current * 0.9) * 0.05;
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

function ComingSoonCanvas({ settings }: { settings: SceneSettings }) {
  return (
    <Canvas
      camera={{ position: [0, 0.12, settings.cameraDistance], fov: 35 }}
      dpr={settings.lowEnd ? 1 : [1, 1.5]}
      frameloop={settings.reduceMotion ? "demand" : "always"}
      performance={{ min: 0.5 }}
      gl={{
        antialias: !settings.lowEnd,
        alpha: true,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = settings.lowEnd ? 1.2 : 1.72;
      }}
      className="absolute inset-0"
    >
      <ambientLight intensity={1.65} />
      <hemisphereLight args={["#dff7ff", "#020b1f", 1.25]} />
      <directionalLight position={[4, 4, 4]} intensity={3.5} color="#e0f7ff" />
      <directionalLight position={[-4, 3, 2]} intensity={2.1} color="#38bdf8" />
      <pointLight position={[0, 1.6, 4]} intensity={3.3} color="#22d3ee" />
      <pointLight position={[2.5, -1.2, 3]} intensity={2} color="#0ea5e9" />
      <pointLight position={[-2.5, -1, 3]} intensity={1.45} color="#3b82f6" />
      {!settings.lowEnd && (
        <spotLight
          position={[0, 4.8, 5.5]}
          angle={0.5}
          penumbra={1}
          intensity={2.6}
          color="#67e8f9"
        />
      )}
      <Suspense fallback={null}>
        <FloatingLogo
          reduceMotion={settings.reduceMotion}
          scale={settings.modelScale}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);

export function ComingSoonScene() {
  const [settings, setSettings] = useState<SceneSettings>(() => ({
    lowEnd: false,
    reduceMotion: false,
    modelScale: 0.58,
    cameraDistance: 8.7,
  }));

  useEffect(() => {
    function update() {
      setSettings(getSceneSettings());
    }

    update();

    let frame = 0;
    function handleResize() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const launchItems = useMemo(
    () => [
      "CRM-powered project gallery",
      "Smarter inquiry workflow",
      "Messenger and content planning tools",
    ],
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b1f] px-5 py-6 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(8,189,255,0.2),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.14),transparent_38%)]" />
      <div className="absolute inset-0 tech-grid opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,31,0.28),rgba(2,11,31,0.88))]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl sm:h-[42rem] sm:w-[42rem]" />
      <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={240}
            height={80}
            priority
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
          />
          <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.28em] text-cyan-200 shadow-[0_0_28px_rgba(8,189,255,0.15)] backdrop-blur">
            Launching soon
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-4">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.42em] text-cyan-300">
              Creatiq Digital Solutions
            </p>
            <h1 className="text-balance text-5xl font-black leading-[0.9] tracking-[-0.08em] text-[#c9d2ff] sm:text-7xl lg:text-8xl">
              We&apos;re building something sharper.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Our new digital home is getting a full system upgrade — cleaner
              portfolio, smarter inquiry flow, and a more connected Creatiq
              experience.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {launchItems.map((item, index) => (
                <div
                  key={item}
                  className="group rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-4 shadow-[0_0_30px_rgba(8,189,255,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/10"
                >
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300/10 text-xs font-black text-cyan-200 ring-1 ring-cyan-300/20">
                    0{index + 1}
                  </span>
                  <p className="text-sm font-bold leading-5 text-slate-200">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
              <span>Public access is temporarily locked while we polish the launch.</span>
            </div>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-white/[0.035] shadow-[0_0_80px_rgba(8,189,255,0.16)] backdrop-blur-xl sm:min-h-[32rem] lg:min-h-[42rem]">
            <ComingSoonCanvas settings={settings} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(2,11,31,0.08)_45%,rgba(2,11,31,0.78)_100%)]" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-cyan-300/15 bg-[#03132d]/80 p-5 shadow-[0_0_48px_rgba(8,189,255,0.14)] backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.36em] text-cyan-300">
                Create. Innovate. Elevate.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-200 shadow-[0_0_24px_rgba(8,189,255,0.55)]" />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Final systems check in progress.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
