"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, useGLTF, useProgress } from "@react-three/drei";
import type { Group } from "three";
import { brand } from "./brand";

const MODEL_URL = "/models/blue-nexus.glb";
const MIN_SPLASH_DURATION = 4800;
const LAST_SECTION_KEY = "creatiq-last-section";

function NexusModel() {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => scene.clone(), [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * 0.28;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.75) * 0.055;

    groupRef.current.position.y =
      0.16 + Math.sin(state.clock.elapsedTime * 1.1) * 0.045;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.18}>
      <group
        ref={groupRef}
        scale={0.92}
        rotation={[0, Math.PI, 0]}
        position={[0, 0.16, 0]}
      >
        <primitive object={model} />
      </group>
    </Float>
  );
}

function SplashCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 6.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="absolute inset-0"
    >
      <color attach="background" args={["#020b1f"]} />

      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 4, 3]} intensity={2.35} color="#7dd3fc" />
      <directionalLight position={[-3, 2, -2]} intensity={1} color="#60a5fa" />
      <pointLight position={[0, 1.4, 4]} intensity={2.1} color="#08bdff" />
      <spotLight
        position={[0, 4.5, 5]}
        angle={0.45}
        penumbra={1}
        intensity={2.15}
        color="#22d3ee"
      />

      <Suspense fallback={null}>
        <NexusModel />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);

export function SplashScreen() {
  const { active, progress } = useProgress();

  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [minimumDone, setMinimumDone] = useState(false);
  const [sectionRestored, setSectionRestored] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const timer = window.setTimeout(() => {
      setMinimumDone(true);
    }, MIN_SPLASH_DURATION);

    restoreLastSection();

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!visible || fadeOut) return;

    if (minimumDone && sectionRestored && !active && progress >= 99) {
      dismiss();
    }
  }, [visible, fadeOut, minimumDone, sectionRestored, active, progress]);

  function getTargetSection() {
    const hash = window.location.hash;
    const stored = window.sessionStorage.getItem(LAST_SECTION_KEY);

    return hash || stored || "#home";
  }

  function restoreLastSection() {
    const target = getTargetSection();
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;

    html.style.scrollBehavior = "auto";

    let attempts = 0;

    function tryRestore() {
      attempts += 1;

      const element =
        target === "#home" ? null : document.querySelector(target);

      if (target === "#home") {
        window.scrollTo(0, 0);
        window.history.replaceState(null, "", window.location.pathname);
        html.style.scrollBehavior = previousScrollBehavior;
        setSectionRestored(true);
        return;
      }

      if (element instanceof HTMLElement) {
        const headerOffset = 88;
        const top =
          element.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top,
          left: 0,
          behavior: "auto",
        });

        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${target}`,
        );

        html.style.scrollBehavior = previousScrollBehavior;
        setSectionRestored(true);
        return;
      }

      if (attempts < 12) {
        window.setTimeout(tryRestore, 80);
        return;
      }

      window.scrollTo(0, 0);
      window.history.replaceState(null, "", window.location.pathname);
      html.style.scrollBehavior = previousScrollBehavior;
      setSectionRestored(true);
    }

    requestAnimationFrame(tryRestore);
  }

  function dismiss() {
    if (fadeOut) return;

    setFadeOut(true);
    document.body.style.overflow = "";

    window.setTimeout(() => {
      setVisible(false);
    }, 1000);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#020b1f] transition-opacity duration-1000 ${
        fadeOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0">
        <SplashCanvas />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,31,0.06),rgba(2,11,31,0.92))]" />

      <div className="pointer-events-none absolute left-1/2 top-[48%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/12 blur-3xl sm:h-[42rem] sm:w-[42rem]" />

      <div className="pointer-events-none absolute left-1/2 top-[48%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/14 blur-3xl sm:h-[32rem] sm:w-[32rem]" />

      <div className="pointer-events-none absolute left-1/2 top-[47%] h-[18rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/8 blur-2xl sm:h-[22rem] sm:w-[48rem]" />

      <div className="pointer-events-none absolute inset-0 tech-grid opacity-20" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(2,11,31,0.12)_42%,rgba(2,11,31,0.88)_100%)]" />

      <div className="absolute left-0 right-0 top-0 mx-auto flex h-24 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-10 xl:px-16">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary backdrop-blur-md transition hover:bg-cyan-300/15"
        >
          Skip
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-4 sm:bottom-10">
        <div className="rounded-[1.5rem] border border-cyan-300/15 bg-white/[0.035] px-7 py-5 shadow-[0_0_60px_rgba(8,189,255,0.14)] backdrop-blur-xl">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={300}
            height={100}
            priority
            className="h-11 w-auto object-contain sm:h-14"
          />
        </div>
      </div>
    </div>
  );
}
