import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 90;
const TRAIL_LENGTH = 8;

function DataPoints() {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const elapsed = useRef(0);

  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spawn already spread across the scene — history pre-filled so no burst
      const spawn = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20
      );
      data.push({
        position: spawn.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.003
        ),
        history: Array.from({ length: TRAIL_LENGTH }, () => spawn.clone())
      });
    }
    return data;
  }, []);

  const [pointPositions, linePositions, lineColors] = useMemo(() => {
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    const lPos = new Float32Array(PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2 * 3);
    const lCol = new Float32Array(PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2 * 3);
    return [pPos, lPos, lCol];
  }, []);

  useFrame((_, delta) => {
    elapsed.current = Math.min(elapsed.current + delta, 3);
    // Fade in over 3 seconds
    const fadeIn = Math.min(elapsed.current / 3, 1);

    let lineIdx = 0;
    let colorIdx = 0;

    particles.forEach((p, i) => {
      for (let j = TRAIL_LENGTH - 1; j > 0; j--) {
        p.history[j].copy(p.history[j - 1]);
      }
      p.history[0].copy(p.position);

      p.position.add(p.velocity);

      if (Math.abs(p.position.x) > 25) p.position.x *= -0.95;
      if (Math.abs(p.position.y) > 25) p.position.y *= -0.95;
      if (Math.abs(p.position.z) > 15) p.position.z *= -0.95;

      pointPositions[i * 3]     = p.position.x;
      pointPositions[i * 3 + 1] = p.position.y;
      pointPositions[i * 3 + 2] = p.position.z;

      for (let j = 0; j < TRAIL_LENGTH - 1; j++) {
        const start = p.history[j];
        const end   = p.history[j + 1];

        linePositions[lineIdx++] = start.x;
        linePositions[lineIdx++] = start.y;
        linePositions[lineIdx++] = start.z;
        linePositions[lineIdx++] = end.x;
        linePositions[lineIdx++] = end.y;
        linePositions[lineIdx++] = end.z;

        const alpha = (1 - j / TRAIL_LENGTH) * 0.15 * fadeIn;
        for (let k = 0; k < 2; k++) {
          lineColors[colorIdx++] = alpha;
          lineColors[colorIdx++] = alpha;
          lineColors[colorIdx++] = alpha;
        }
      }
    });

    const pts = pointsRef.current;
    const lines = linesRef.current;

    pts.geometry.attributes.position.needsUpdate = true;
    lines.geometry.attributes.position.needsUpdate = true;
    lines.geometry.attributes.color.needsUpdate = true;

    // Fade in point + line opacity
    (pts.material as THREE.PointsMaterial).opacity = 0.4 * fadeIn;
    (lines.material as THREE.LineBasicMaterial).opacity = 0.5 * fadeIn;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={pointPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#ffffff"
          transparent
          opacity={0}
          sizeAttenuation
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2}
            array={linePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2}
            array={lineColors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0} />
      </lineSegments>
    </group>
  );
}

export default function AstralisBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 15, 35]} />
        <ambientLight intensity={0.1} />
        <DataPoints />
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[4, 32, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.15} />
        </mesh>
      </Canvas>
    </div>
  );
}
