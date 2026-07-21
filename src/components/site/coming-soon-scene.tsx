"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
import { Box3, Group, Vector3, type Mesh, type Object3D } from "three";

import { brand } from "@/components/site/brand";

const MODEL_URL =
  "/models/creatiq_digital_solutions_logo_bright_blue_match.glb";

type SceneSettings = {
  lowEnd: boolean;
  reduceMotion: boolean;
};

const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  lowEnd: false,
  reduceMotion: false,
};

function getSceneSettings(): SceneSettings {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return DEFAULT_SCENE_SETTINGS;
  }

  const navigatorWithMemory = navigator as Navigator & {
    deviceMemory?: number;
  };

  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;

  const lowMemory = (navigatorWithMemory.deviceMemory ?? 8) <= 4;

  const smallScreen = window.innerWidth < 640;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return {
    lowEnd: smallScreen || lowCpu || lowMemory,
    reduceMotion,
  };
}

/**
 * Creates a clean model containing only visible meshes.
 *
 * The original world transforms are copied into each mesh.
 * The resulting model is then centered around [0, 0, 0].
 *
 * This removes incorrect GLB parent offsets and unusual origins.
 */
function createCenteredRenderable(source: Object3D): Group {
  const cleanRoot = new Group();

  source.updateMatrixWorld(true);

  source.traverse((child) => {
    const mesh = child as Mesh;

    if (!mesh.isMesh || !mesh.visible || !mesh.geometry) {
      return;
    }

    const meshClone = mesh.clone(false) as Mesh;

    /*
     * Preserve the final world transform from the GLB,
     * rather than preserving its problematic parent hierarchy.
     */
    meshClone.matrixAutoUpdate = false;
    meshClone.matrix.copy(mesh.matrixWorld);
    meshClone.matrixWorldNeedsUpdate = true;

    /*
     * Prevent the mesh from disappearing because its original
     * bounding information no longer matches the new hierarchy.
     */
    meshClone.frustumCulled = false;

    cleanRoot.add(meshClone);
  });

  cleanRoot.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(cleanRoot);

  if (!bounds.isEmpty()) {
    const center = bounds.getCenter(new Vector3());

    cleanRoot.position.set(-center.x, -center.y, -center.z);
  }

  cleanRoot.updateMatrixWorld(true);

  return cleanRoot;
}

function FloatingLogo({ reduceMotion }: { reduceMotion: boolean }) {
  const animatedGroupRef = useRef<Group>(null);
  const elapsedTimeRef = useRef(0);

  const { scene } = useGLTF(MODEL_URL);

  const centeredModel = useMemo(() => {
    return createCenteredRenderable(scene);
  }, [scene]);

  useFrame((_state, delta) => {
    const group = animatedGroupRef.current;

    if (!group || reduceMotion) {
      return;
    }

    elapsedTimeRef.current += delta;

    const elapsed = elapsedTimeRef.current;

    /*
     * Always calculate rotation from elapsed time.
     * This prevents uncontrolled cumulative rotation.
     */
    group.rotation.x = Math.sin(elapsed * 0.55) * 0.035;

    group.rotation.y = -0.22 + Math.sin(elapsed * 0.35) * 0.28;

    group.rotation.z = Math.sin(elapsed * 0.42) * 0.015;

    group.position.y = Math.sin(elapsed * 0.8) * 0.07;
  });

  return (
    <group
      ref={animatedGroupRef}
      position={[0, 0, 0]}
      rotation={[0, -0.22, 0]}
      dispose={null}
    >
      <primitive object={centeredModel} dispose={null} />
    </group>
  );
}

function ComingSoonCanvas({ settings }: { settings: SceneSettings }) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 8],
        fov: 32,
        near: 0.01,
        far: 100,
      }}
      dpr={settings.lowEnd ? 1 : [1, 1.5]}
      frameloop={settings.reduceMotion ? "demand" : "always"}
      performance={{
        min: 0.5,
      }}
      gl={{
        antialias: !settings.lowEnd,
        alpha: true,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = settings.lowEnd ? 1.25 : 1.65;
      }}
      className="h-full w-full"
    >
      <ambientLight intensity={1.7} />

      <hemisphereLight args={["#dff7ff", "#020b1f", 1.3]} />

      <directionalLight position={[4, 5, 5]} intensity={3.8} color="#e0f7ff" />

      <directionalLight position={[-4, 3, 3]} intensity={2.2} color="#38bdf8" />

      <pointLight position={[0, 2, 5]} intensity={3.4} color="#22d3ee" />

      <pointLight position={[3, -1, 4]} intensity={2} color="#0ea5e9" />

      <pointLight position={[-3, -1, 4]} intensity={1.5} color="#3b82f6" />

      {!settings.lowEnd && (
        <spotLight
          position={[0, 5, 6]}
          angle={0.5}
          penumbra={1}
          intensity={2.6}
          color="#67e8f9"
        />
      )}

      <Suspense fallback={null}>
        {/*
         * Bounds controls the camera framing.
         *
         * Smaller margin = larger model.
         * 1.25 keeps enough room for the floating rotation.
         */}
        <Bounds fit clip observe margin={1.25}>
          <FloatingLogo reduceMotion={settings.reduceMotion} />
        </Bounds>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);

export function ComingSoonScene() {
  const [settings, setSettings] = useState<SceneSettings>(
    DEFAULT_SCENE_SETTINGS,
  );

  const launchItems = useMemo(
    () => [
      "CRM-powered project gallery",
      "Smarter inquiry workflow",
      "Messenger and content planning tools",
    ],
    [],
  );

  useEffect(() => {
    let animationFrame = 0;

    function updateSettings() {
      setSettings(getSceneSettings());
    }

    function handleResize() {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(updateSettings);
    }

    updateSettings();

    window.addEventListener("resize", handleResize);

    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);

      window.removeEventListener("resize", handleResize);

      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b1f] px-5 py-6 text-white sm:px-8 lg:px-12">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(8,189,255,0.20),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.14),transparent_38%)]" />

      {/* Inline Tailwind grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.025)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,31,0.28),rgba(2,11,31,0.88))]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl sm:h-[42rem] sm:w-[42rem]" />

      <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="pointer-events-none absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Image
            src={brand.landscape}
            alt="Creatiq Digital Solutions"
            width={240}
            height={80}
            priority
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
          />

          <div className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.28em] text-cyan-200 shadow-[0_0_28px_rgba(8,189,255,0.15)] backdrop-blur">
            Launching soon
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-4">
          {/* Left content */}
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
              <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />

              <span>
                Public access is temporarily locked while we polish the launch.
              </span>
            </div>
          </div>

          {/* Right 3D card */}
          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-white/[0.035] shadow-[0_0_80px_rgba(8,189,255,0.16)] backdrop-blur-xl sm:min-h-[34rem] lg:min-h-[42rem]">
            {/*
             * Critical fix:
             * The Canvas now has its own area above the progress panel.
             * It no longer uses the entire card as its framing area.
             */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[9.75rem] sm:bottom-[10.25rem]">
              <ComingSoonCanvas settings={settings} />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[9.75rem] bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,11,31,0.05)_48%,rgba(2,11,31,0.72)_100%)] sm:bottom-[10.25rem]" />

            {/* Progress panel */}
            <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-cyan-300/15 bg-[#03132d]/90 p-5 shadow-[0_0_48px_rgba(8,189,255,0.14)] backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7">
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
