import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const STAR_COUNT = 200;

function createMonogramTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#ff6347";
  ctx.lineWidth = 18;
  ctx.strokeRect(28, 28, 456, 456);

  ctx.fillStyle = "#f5f5f5";
  ctx.font = "700 176px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HB", 256, 250);

  ctx.fillStyle = "#ff6347";
  ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("PORTFOLIO", 256, 380);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function Stars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < STAR_COUNT; i += 1) {
      dummy.position.set(
        THREE.MathUtils.randFloatSpread(100),
        THREE.MathUtils.randFloatSpread(100),
        THREE.MathUtils.randFloatSpread(100),
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[0.25, 24, 24]} />
      <meshStandardMaterial color="#ffffff" />
    </instancedMesh>
  );
}

function SceneContents() {
  const torusRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const avatarRef = useRef<THREE.Mesh>(null);
  const { camera, scene } = useThree();
  const [moonMap, normalMap, spaceMap] = useTexture([
    "/textures/moon.jpg",
    "/textures/normal.jpg",
    "/textures/space.jpg",
  ]);

  const avatarTexture = useMemo(() => createMonogramTexture(), []);

  useEffect(() => {
    moonMap.colorSpace = THREE.SRGBColorSpace;
    spaceMap.colorSpace = THREE.SRGBColorSpace;
    scene.background = spaceMap;
    return () => {
      scene.background = null;
    };
  }, [moonMap, scene, spaceMap]);

  useEffect(() => {
    return () => {
      avatarTexture.dispose();
    };
  }, [avatarTexture]);

  useEffect(() => {
    const onScroll = () => {
      if (moonRef.current) {
        moonRef.current.rotation.x += 0.05;
        moonRef.current.rotation.y += 0.075;
        moonRef.current.rotation.z += 0.05;
      }
      if (avatarRef.current) {
        avatarRef.current.rotation.y += 0.01;
        avatarRef.current.rotation.z += 0.01;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame(() => {
    if (torusRef.current) {
      torusRef.current.rotation.x += 0.01;
      torusRef.current.rotation.y += 0.005;
      torusRef.current.rotation.z += 0.01;
    }

    if (moonRef.current) {
      moonRef.current.rotation.x += 0.005;
    }

    const t = -window.scrollY;
    camera.position.z = t * -0.01;
    camera.position.x = t * -0.0002;
    camera.rotation.y = t * -0.0002;
  });

  return (
    <>
      <ambientLight color={0xffffff} intensity={1} />
      <pointLight color={0xffffff} position={[5, 5, 5]} intensity={2} decay={0} />

      <Stars />

      <mesh ref={torusRef}>
        <torusGeometry args={[10, 3, 16, 100]} />
        <meshStandardMaterial color={0xff6347} />
      </mesh>

      <mesh ref={avatarRef} position={[2, 0, -5]}>
        <boxGeometry args={[3, 3, 3]} />
        <meshBasicMaterial map={avatarTexture} />
      </mesh>

      <mesh ref={moonRef} position={[-10, 0, 30]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial map={moonMap} normalMap={normalMap} />
      </mesh>
    </>
  );
}

export default function ThreeScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-dvh w-dvw">
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [-3, 0, 30] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
