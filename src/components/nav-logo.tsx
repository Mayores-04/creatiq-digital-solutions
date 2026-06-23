"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function NavLogo() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 40;
    const height = container.clientHeight || 40;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({
        color: 0x08bdff,
        emissive: 0x0356e7,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
      }),
    );

    const outer = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.5),
      new THREE.MeshPhongMaterial({
        color: 0x08bdff,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      }),
    );

    group.add(core);
    group.add(outer);
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const pointLight = new THREE.PointLight(0x08bdff, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 4;

    let animationFrame = 0;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      group.rotation.y += 0.01;
      group.rotation.x += 0.005;

      const scale = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      core.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const nextWidth = container.clientWidth || 40;
      const nextHeight = container.clientHeight || 40;

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="h-10 w-10" aria-hidden="true" />;
}
