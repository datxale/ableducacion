import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import * as THREE from 'three';

const createParticles = (count) => {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const radius = 3.2 + Math.random() * 2.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[(index * 3) + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[(index * 3) + 2] = radius * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return geometry;
};

const disposeMaterial = (material) => {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  if (material) {
    material.dispose();
  }
};

const HeroThreeScene = ({ highlights = [] }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.25, 6.8);

    const root = new THREE.Group();
    scene.add(root);

    const orbitLayer = new THREE.Group();
    root.add(orbitLayer);

    const ambientLight = new THREE.HemisphereLight(0xd9fffb, 0x071d34, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x82f6ff, 22, 18, 2);
    keyLight.position.set(3.2, 3.6, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff7c7c, 18, 14, 2);
    rimLight.position.set(-3.5, 1.5, 3.2);
    scene.add(rimLight);

    const bottomLight = new THREE.PointLight(0xffd93d, 16, 14, 2);
    bottomLight.position.set(0, -3.4, 3.5);
    scene.add(bottomLight);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.55, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0x1a8ff2,
        metalness: 0.2,
        roughness: 0.12,
        transmission: 0.22,
        thickness: 1.4,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        emissive: 0x0d55d8,
        emissiveIntensity: 0.55,
      }),
    );
    root.add(core);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.07, 18, 140),
      new THREE.MeshStandardMaterial({
        color: 0x89f1ff,
        emissive: 0x42d9ff,
        emissiveIntensity: 0.95,
        metalness: 0.55,
        roughness: 0.25,
      }),
    );
    halo.rotation.x = Math.PI / 2.6;
    halo.rotation.y = 0.4;
    root.add(halo);

    const secondaryHalo = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.09, 18, 100),
      new THREE.MeshStandardMaterial({
        color: 0xffd357,
        emissive: 0xffbf47,
        emissiveIntensity: 0.65,
        metalness: 0.35,
        roughness: 0.34,
      }),
    );
    secondaryHalo.rotation.x = Math.PI / 2.1;
    secondaryHalo.rotation.z = 0.55;
    root.add(secondaryHalo);

    const shield = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.95, 0),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05,
        wireframe: true,
      }),
    );
    root.add(shield);

    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('/logo-circulo.png');
    logoTexture.colorSpace = THREE.SRGBColorSpace;

    const logoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.65, 2.65),
      new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        opacity: 0.98,
      }),
    );
    logoPanel.position.z = 0.55;
    root.add(logoPanel);

    const glowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.45, 64),
      new THREE.MeshBasicMaterial({
        color: 0x6ce8ff,
        transparent: true,
        opacity: 0.12,
      }),
    );
    glowPlane.position.z = -0.25;
    root.add(glowPlane);

    const accentPalette = [0x4ecdc4, 0xff6b6b, 0x56ccf2, 0xffd93d, 0xffffff];
    const satellites = Array.from({ length: 6 }, (_, index) => {
      const geometry = index % 2 === 0
        ? new THREE.BoxGeometry(0.36, 0.36, 0.36)
        : new THREE.SphereGeometry(0.23, 24, 24);
      const material = new THREE.MeshStandardMaterial({
        color: accentPalette[index % accentPalette.length],
        emissive: accentPalette[index % accentPalette.length],
        emissiveIntensity: index % 2 === 0 ? 0.18 : 0.1,
        metalness: 0.4,
        roughness: 0.28,
      });
      const mesh = new THREE.Mesh(geometry, material);
      orbitLayer.add(mesh);
      return mesh;
    });

    const particleField = new THREE.Points(
      createParticles(180),
      new THREE.PointsMaterial({
        color: 0xf5ffff,
        size: 0.055,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(particleField);

    const pointerTarget = new THREE.Vector2(0, 0);
    const pointer = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    let animationFrameId = 0;

    const resizeScene = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerMove = (event) => {
      const bounds = container.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointerTarget.y = -((((event.clientY - bounds.top) / bounds.height) * 2) - 1);
    };

    const handlePointerLeave = () => {
      pointerTarget.set(0, 0);
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    let resizeObserver;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(resizeScene);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resizeScene);
    }

    resizeScene();

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      pointer.lerp(pointerTarget, 0.06);

      root.rotation.y = (pointer.x * 0.32) + (Math.sin(elapsed * 0.34) * 0.08);
      root.rotation.x = (pointer.y * 0.16) + (Math.cos(elapsed * 0.28) * 0.04);

      core.rotation.x += 0.0028;
      core.rotation.y += 0.004;
      core.position.y = Math.sin(elapsed * 1.2) * 0.08;

      halo.rotation.z = elapsed * 0.24;
      secondaryHalo.rotation.y = -elapsed * 0.26;
      shield.rotation.z = -elapsed * 0.18;

      logoPanel.position.y = Math.sin(elapsed * 1.35) * 0.12;
      logoPanel.rotation.z = Math.sin(elapsed * 0.8) * 0.05;
      glowPlane.scale.setScalar(1 + (Math.sin(elapsed * 1.2) * 0.04));

      satellites.forEach((mesh, index) => {
        const angle = (elapsed * (0.24 + (index * 0.02))) + (index * 1.4);
        const radius = 2.2 + ((index % 2) * 0.55);
        mesh.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.45) * 0.9,
          Math.sin(angle * 0.9) * 1.15,
        );
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.013;
      });

      particleField.rotation.y = elapsed * 0.03;
      particleField.rotation.x = Math.sin(elapsed * 0.17) * 0.08;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.45, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.25 + (pointer.y * 0.25), 0.04);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resizeScene);
      }

      scene.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }

        if (child.material) {
          disposeMaterial(child.material);
        }
      });

      logoTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 360, sm: 440, md: 520 },
        borderRadius: { xs: '30px', md: '38px' },
        overflow: 'hidden',
        background: `
          radial-gradient(circle at 24% 18%, rgba(124, 244, 255, 0.28), transparent 24%),
          radial-gradient(circle at 78% 28%, rgba(255, 107, 107, 0.18), transparent 16%),
          linear-gradient(155deg, rgba(6, 20, 42, 0.88) 0%, rgba(14, 70, 118, 0.82) 48%, rgba(17, 128, 196, 0.48) 100%)
        `,
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 35px 90px rgba(7, 18, 41, 0.34), inset 0 1px 0 rgba(255,255,255,0.2)',
      }}
    >
      <Box
        ref={mountRef}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(circle at center, black 32%, transparent 88%)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />

      {highlights.slice(0, 3).map((label, index) => (
        <Box
          key={`${label}-${index}`}
          sx={{
            position: 'absolute',
            left: index === 2 ? 'auto' : { xs: 16, sm: 22 },
            right: index === 2 ? { xs: 16, sm: 22 } : 'auto',
            top: index === 0 ? { xs: 16, sm: 22 } : 'auto',
            bottom: index === 0 ? 'auto' : index === 1 ? { xs: 20, sm: 24 } : { xs: 82, sm: 102 },
            maxWidth: { xs: 180, sm: 220 },
            px: 1.8,
            py: 1.2,
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 18px 35px rgba(3, 12, 30, 0.22)',
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 800,
              mb: 0.4,
            }}
          >
            0{index + 1}
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 800,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              lineHeight: 1.35,
            }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default HeroThreeScene;
