"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useProgress } from "@react-three/drei";
import { Color, Mesh, MeshStandardMaterial } from "three";
import type { Group } from "three";
import { brand } from "./brand";

const MODEL_URL = "/models/blue-nexus.glb";
const MIN_SPLASH_DURATION = 2800;
const LOADING_FAILSAFE_DURATION = 6500;
const LAST_SECTION_KEY = "creatiq-last-section";

type DeviceInfo = {
  isLowEnd: boolean;
  reduceMotion: boolean;
};

function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isLowEnd: false,
      reduceMotion: false,
    };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };

  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;

  const isSmallScreen = window.innerWidth < 768;
  const isWeakHardware = cores <= 4 || memory <= 4;

  return {
    isLowEnd: isSmallScreen || isWeakHardware,
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

function normalizeSectionTarget(value: string | null) {
  if (!value) return "#home";

  const target = value.startsWith("#") ? value : `#${value}`;

  if (!/^#[A-Za-z][A-Za-z0-9_-]*$/.test(target)) {
    return "#home";
  }

  return target;
}

function NexusModel({ reduceMotion }: { reduceMotion: boolean }) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);

  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      child.frustumCulled = true;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      const enhancedMaterials = materials.map((material) => {
        const clonedMaterial = material.clone();

        if (clonedMaterial instanceof MeshStandardMaterial) {
          // This makes the dark blue model more visible.
          clonedMaterial.color.lerp(new Color("#1da8ff"), 0.45);
          clonedMaterial.emissive.set("#0057b8");
          clonedMaterial.emissiveIntensity = 0.42;
          clonedMaterial.roughness = 0.28;
          clonedMaterial.metalness = 0.18;
          clonedMaterial.needsUpdate = true;
        }

        return clonedMaterial;
      });

      child.material = Array.isArray(child.material)
        ? enhancedMaterials
        : enhancedMaterials[0];
    });

    return clonedScene;
  }, [scene]);

  useFrame((_state, delta) => {
    if (!groupRef.current || reduceMotion) return;

    elapsedRef.current += delta;

    groupRef.current.rotation.y += delta * 0.24;
    groupRef.current.rotation.x = Math.sin(elapsedRef.current * 0.75) * 0.05;
    groupRef.current.position.y =
      0.13 + Math.sin(elapsedRef.current * 1.05) * 0.04;
  });

  return (
    <group
      ref={groupRef}
      scale={0.9}
      rotation={[0, Math.PI, 0]}
      position={[0, 0.13, 0]}
      dispose={null}
    >
      <primitive object={model} />
    </group>
  );
}

function SplashCanvas({
  isLowEnd,
  reduceMotion,
}: {
  isLowEnd: boolean;
  reduceMotion: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 6.2], fov: 35 }}
      dpr={isLowEnd ? 1 : [1, 1.6]}
      frameloop={reduceMotion ? "demand" : "always"}
      performance={{ min: 0.5 }}
      gl={{
        antialias: !isLowEnd,
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = isLowEnd ? 1.25 : 1.45;
      }}
      className="absolute inset-0"
    >
      <color attach="background" args={["#020b1f"]} />

      <ambientLight intensity={1.8} />

      <directionalLight position={[4, 4, 4]} intensity={3.4} color="#8be9ff" />

      <directionalLight
        position={[-4, 2.5, 2]}
        intensity={1.8}
        color="#3b82f6"
      />

      <pointLight position={[0, 1.6, 4]} intensity={3.2} color="#18c8ff" />

      <pointLight position={[0, -1.3, 3]} intensity={1.8} color="#0ea5e9" />

      {!isLowEnd && (
        <spotLight
          position={[0, 4.5, 5]}
          angle={0.45}
          penumbra={1}
          intensity={2.4}
          color="#22d3ee"
        />
      )}

      <Suspense fallback={null}>
        <NexusModel reduceMotion={reduceMotion} />
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
  const [failsafeDone, setFailsafeDone] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isLowEnd: false,
    reduceMotion: false,
  });

  const previousOverflowRef = useRef("");
  const previousScrollRestorationRef = useRef<ScrollRestoration | null>(null);

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if ("scrollRestoration" in window.history) {
      previousScrollRestorationRef.current = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
    }

    const minTimer = window.setTimeout(() => {
      setMinimumDone(true);
    }, MIN_SPLASH_DURATION);

    const failsafeTimer = window.setTimeout(() => {
      setFailsafeDone(true);
    }, LOADING_FAILSAFE_DURATION);

    restoreLastSection();

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(failsafeTimer);

      document.body.style.overflow = previousOverflowRef.current;

      if (
        "scrollRestoration" in window.history &&
        previousScrollRestorationRef.current
      ) {
        window.history.scrollRestoration = previousScrollRestorationRef.current;
      }
    };
  }, []);

  useEffect(() => {
    if (!visible || fadeOut) return;

    const modelLoaded = !active && progress >= 99;
    const canDismiss =
      minimumDone && sectionRestored && (modelLoaded || failsafeDone);

    if (canDismiss) {
      dismiss();
    }
  }, [
    visible,
    fadeOut,
    minimumDone,
    sectionRestored,
    active,
    progress,
    failsafeDone,
  ]);

  function getTargetSection() {
    const hash = normalizeSectionTarget(window.location.hash);
    const stored = normalizeSectionTarget(
      window.sessionStorage.getItem(LAST_SECTION_KEY),
    );

    return hash !== "#home" ? hash : stored;
  }

  function restoreLastSection() {
    const target = getTargetSection();
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    const baseUrl = `${window.location.pathname}${window.location.search}`;

    html.style.scrollBehavior = "auto";

    let attempts = 0;

    function finish() {
      html.style.scrollBehavior = previousScrollBehavior;
      setSectionRestored(true);
    }

    function tryRestore() {
      attempts += 1;

      if (target === "#home") {
        window.scrollTo(0, 0);
        window.history.replaceState(null, "", baseUrl);
        finish();
        return;
      }

      const sectionId = target.slice(1);
      const element = document.getElementById(sectionId);

      if (element) {
        const headerOffset = 88;
        const top =
          element.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top,
          left: 0,
          behavior: "auto",
        });

        window.history.replaceState(null, "", `${baseUrl}${target}`);
        finish();
        return;
      }

      if (attempts < 14) {
        window.setTimeout(tryRestore, 70);
        return;
      }

      window.scrollTo(0, 0);
      window.history.replaceState(null, "", baseUrl);
      finish();
    }

    requestAnimationFrame(tryRestore);
  }

  function dismiss() {
    if (fadeOut) return;

    setFadeOut(true);
    document.body.style.overflow = previousOverflowRef.current;

    window.setTimeout(() => {
      setVisible(false);
    }, 700);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#020b1f] transition-opacity duration-700 ${
        fadeOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0">
        <SplashCanvas
          isLowEnd={deviceInfo.isLowEnd}
          reduceMotion={deviceInfo.reduceMotion}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,31,0.02),rgba(2,11,31,0.72))]" />

      <div className="pointer-events-none absolute left-1/2 top-[48%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/18 blur-3xl sm:h-[44rem] sm:w-[44rem]" />

      <div className="pointer-events-none absolute left-1/2 top-[48%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl sm:h-[34rem] sm:w-[34rem]" />

      <div className="pointer-events-none absolute left-1/2 top-[47%] h-[15rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/12 blur-2xl sm:h-[23rem] sm:w-[50rem]" />

      <div className="pointer-events-none absolute inset-0 tech-grid opacity-10 sm:opacity-15" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(2,11,31,0.04)_42%,rgba(2,11,31,0.62)_100%)]" />

      <div className="absolute left-0 right-0 top-0 mx-auto flex h-24 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-10 xl:px-16">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary backdrop-blur-md transition hover:bg-cyan-300/15"
        >
          Skip
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-4 sm:bottom-10">
        <div className="rounded-[1.5rem] border border-cyan-300/15 bg-white/[0.045] px-7 py-5 shadow-[0_0_70px_rgba(8,189,255,0.2)] backdrop-blur-xl">
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
