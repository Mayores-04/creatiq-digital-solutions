"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useProgress } from "@react-three/drei";
import type { Group, PerspectiveCamera } from "three";
import { brand } from "./brand";

const MODEL_URL =
  "/models/creatiq_digital_solutions_logo_bright_blue_match.glb";

const MIN_SPLASH_DURATION = 2800;
const LOADING_FAILSAFE_DURATION = 6500;
const LAST_SECTION_KEY = "creatiq-last-section";

/**
 * ============================================================
 * EASY RESPONSIVE SETTINGS
 * ============================================================
 *
 * HOW TO ADJUST:
 *
 * modelScale       = size ng 3D model
 *                    lower number = smaller
 *                    higher number = bigger
 *
 * cameraDistance   = layo ng camera
 *                    higher number = smaller/farther
 *                    lower number = bigger/closer
 *
 * modelY           = vertical position ng model
 *                    positive = taas
 *                    negative = baba
 *
 * cameraY          = vertical angle/position ng camera
 *
 * cameraFov        = camera field of view
 *                    higher number = more zoomed out feel
 *                    lower number = more zoomed in feel
 */

const PHONE_3D = {
  modelScale: 0.32,
  modelY: 0.03,
  cameraDistance: 10.8,
  cameraY: 0.04,
  cameraFov: 36,
};

const TABLET_3D = {
  modelScale: 0.42,
  modelY: 0.05,
  cameraDistance: 9.8,
  cameraY: 0.08,
  cameraFov: 35,
};

const LAPTOP_3D = {
  modelScale: 0.5,
  modelY: 0.07,
  cameraDistance: 8.9,
  cameraY: 0.12,
  cameraFov: 35,
};

const PC_3D = {
  modelScale: 0.54,
  modelY: 0.08,
  cameraDistance: 8.7,
  cameraY: 0.15,
  cameraFov: 35,
};

/**
 * EASY ANIMATION / LIGHT SETTINGS
 */
const ROTATION_SPEED = 0.24;

const LIGHT_POWER = 1.25;
const DESKTOP_EXPOSURE = 1.75;
const LOW_END_EXPOSURE = 1.25;

type ResponsiveSettings = {
  isLowEnd: boolean;
  reduceMotion: boolean;
  modelScale: number;
  modelY: number;
  cameraDistance: number;
  cameraY: number;
  cameraFov: number;
};

function getDefaultResponsiveSettings(): ResponsiveSettings {
  return {
    isLowEnd: false,
    reduceMotion: false,
    ...LAPTOP_3D,
  };
}

function getResponsiveSettings(): ResponsiveSettings {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return getDefaultResponsiveSettings();
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };

  const width = window.innerWidth;
  const height = window.innerHeight;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;

  const isWeakHardware = cores <= 4 || memory <= 4;
  const isShortScreen = height < 720;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let preset = PC_3D;

  if (width < 640) {
    preset = PHONE_3D;
  } else if (width < 1024) {
    preset = TABLET_3D;
  } else if (width < 1440) {
    preset = LAPTOP_3D;
  } else {
    preset = PC_3D;
  }

  /**
   * Extra fix for short-height devices.
   * Example: small laptops, landscape phones, short browser height.
   */
  if (isShortScreen) {
    preset = {
      ...preset,
      modelScale: preset.modelScale * 0.9,
      cameraDistance: preset.cameraDistance + 0.4,
      modelY: preset.modelY - 0.02,
    };
  }

  return {
    isLowEnd: width < 768 || isWeakHardware,
    reduceMotion,
    ...preset,
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

function ResponsiveCamera({
  cameraDistance,
  cameraY,
  cameraFov,
}: {
  cameraDistance: number;
  cameraY: number;
  cameraFov: number;
}) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const perspectiveCamera = camera as PerspectiveCamera;

    perspectiveCamera.position.set(0, cameraY, cameraDistance);
    perspectiveCamera.fov = cameraFov;
    perspectiveCamera.updateProjectionMatrix();

    invalidate();
  }, [camera, invalidate, cameraDistance, cameraY, cameraFov]);

  return null;
}

function NexusModel({
  reduceMotion,
  modelScale,
  modelY,
}: {
  reduceMotion: boolean;
  modelScale: number;
  modelY: number;
}) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);

  const { scene } = useGLTF(MODEL_URL);

  useFrame((_state, delta) => {
    if (!groupRef.current || reduceMotion) return;

    elapsedRef.current += delta;

    groupRef.current.rotation.y += delta * ROTATION_SPEED;
    groupRef.current.rotation.x = Math.sin(elapsedRef.current * 0.75) * 0.05;

    groupRef.current.position.y =
      modelY + Math.sin(elapsedRef.current * 1.05) * 0.035;
  });

  return (
    <group
      ref={groupRef}
      scale={modelScale}
      rotation={[0, 0, 0]}
      position={[0, modelY, 0]}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  );
}

function SplashCanvas({ settings }: { settings: ResponsiveSettings }) {
  return (
    <Canvas
      camera={{
        position: [0, settings.cameraY, settings.cameraDistance],
        fov: settings.cameraFov,
      }}
      dpr={settings.isLowEnd ? 1 : [1, 1.5]}
      frameloop={settings.reduceMotion ? "demand" : "always"}
      performance={{ min: 0.5 }}
      gl={{
        antialias: !settings.isLowEnd,
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = settings.isLowEnd
          ? LOW_END_EXPOSURE
          : DESKTOP_EXPOSURE;
      }}
      className="absolute inset-0"
    >
      <ResponsiveCamera
        cameraDistance={settings.cameraDistance}
        cameraY={settings.cameraY}
        cameraFov={settings.cameraFov}
      />

      <color attach="background" args={["#020b1f"]} />

      <ambientLight intensity={1.55 * LIGHT_POWER} />

      <hemisphereLight args={["#dff7ff", "#020b1f", 1.15 * LIGHT_POWER]} />

      <directionalLight
        position={[4, 4, 4]}
        intensity={3.25 * LIGHT_POWER}
        color="#e0f7ff"
      />

      <directionalLight
        position={[-4, 3, 2]}
        intensity={1.85 * LIGHT_POWER}
        color="#38bdf8"
      />

      <pointLight
        position={[0, 1.6, 4]}
        intensity={3.1 * LIGHT_POWER}
        color="#22d3ee"
      />

      <pointLight
        position={[2.5, -1.2, 3]}
        intensity={1.9 * LIGHT_POWER}
        color="#0ea5e9"
      />

      <pointLight
        position={[-2.5, -1, 3]}
        intensity={1.35 * LIGHT_POWER}
        color="#3b82f6"
      />

      {!settings.isLowEnd && (
        <spotLight
          position={[0, 4.8, 5.5]}
          angle={0.5}
          penumbra={1}
          intensity={2.45 * LIGHT_POWER}
          color="#67e8f9"
        />
      )}

      <Suspense fallback={null}>
        <NexusModel
          reduceMotion={settings.reduceMotion}
          modelScale={settings.modelScale}
          modelY={settings.modelY}
        />
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

  const [settings, setSettings] = useState<ResponsiveSettings>(
    getDefaultResponsiveSettings,
  );

  const previousOverflowRef = useRef("");
  const previousScrollRestorationRef = useRef<ScrollRestoration | null>(null);

  useEffect(() => {
    function updateSettings() {
      setSettings(getResponsiveSettings());
    }

    updateSettings();

    let frame = 0;

    function handleResize() {
      window.cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        updateSettings();
      });
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
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
        const headerOffset = window.innerWidth < 768 ? 72 : 88;
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
      className={`fixed inset-0 z-[9999] h-[100svh] overflow-hidden bg-[#020b1f] transition-opacity duration-700 ${
        fadeOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0">
        <SplashCanvas settings={settings} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,31,0.04),rgba(2,11,31,0.82))]" />

      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/12 blur-3xl sm:h-[30rem] sm:w-[30rem] lg:h-[42rem] lg:w-[42rem]" />

      <div className="pointer-events-none absolute left-1/2 top-[47%] h-[15rem] w-[15rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/14 blur-3xl sm:h-[24rem] sm:w-[24rem] lg:h-[32rem] lg:w-[32rem]" />

      <div className="pointer-events-none absolute left-1/2 top-[47%] h-[10rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/8 blur-2xl sm:h-[16rem] sm:w-[34rem] lg:h-[22rem] lg:w-[48rem]" />

      <div className="pointer-events-none absolute inset-0 tech-grid opacity-10 sm:opacity-15 lg:opacity-20" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(2,11,31,0.08)_42%,rgba(2,11,31,0.78)_100%)]" />

      <div className="absolute right-4 top-4 z-20 flex items-center justify-end sm:right-6 sm:top-6 lg:right-10">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.22em] text-secondary backdrop-blur-md transition hover:bg-cyan-300/15 sm:px-4 sm:text-[10px]"
        >
          Skip
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-8">
        <div className="max-w-[78vw] rounded-[1.25rem] border border-cyan-300/15 bg-white/[0.035] px-5 py-4 shadow-[0_0_60px_rgba(8,189,255,0.14)] backdrop-blur-xl sm:rounded-[1.5rem] sm:px-7 sm:py-5">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={300}
            height={100}
            priority
            className="h-9 w-auto max-w-[62vw] object-contain sm:h-12 md:h-14"
          />
        </div>
      </div>
    </div>
  );
}

export function SectionMemory() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[id], div[id]"),
    ).filter((section) => {
      const id = section.id?.trim();

      if (!id) return false;

      return !["__next", "root"].includes(id);
    });

    if (!sections.length) return;

    let currentSection = "";

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const id = visibleEntry.target.id;

        if (!id || id === currentSection) return;

        currentSection = id;
        window.sessionStorage.setItem(LAST_SECTION_KEY, `#${id}`);
      },
      {
        root: null,
        rootMargin: "-38% 0px -45% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
