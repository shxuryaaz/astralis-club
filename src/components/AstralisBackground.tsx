import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 180;
const TRAIL_LENGTH = 8;
const CONNECTION_THRESHOLD = 8;
const MAX_CONNECTIONS = 400;

function DataPoints() {
  const pointsRef   = useRef<THREE.Points>(null!);
  const trailsRef   = useRef<THREE.LineSegments>(null!);
  const connsRef    = useRef<THREE.LineSegments>(null!);
  const icoRef      = useRef<THREE.LineSegments>(null!);
  const elapsed     = useRef(0);

  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
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

  const [pointPositions, trailPositions, trailColors] = useMemo(() => {
    const pPos  = new Float32Array(PARTICLE_COUNT * 3);
    const lPos  = new Float32Array(PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2 * 3);
    const lCol  = new Float32Array(PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2 * 3);
    return [pPos, lPos, lCol];
  }, []);

  const [connPositions, connColors] = useMemo(() => {
    const cPos = new Float32Array(MAX_CONNECTIONS * 2 * 3);
    const cCol = new Float32Array(MAX_CONNECTIONS * 2 * 3);
    return [cPos, cCol];
  }, []);

  // Icosahedron wireframe geometry (built once)
  const icoGeometry = useMemo(() => {
    const geo    = new THREE.IcosahedronGeometry(3.5, 1);
    const wireGeo = new THREE.WireframeGeometry(geo);
    return wireGeo;
  }, []);

  useFrame((_, delta) => {
    elapsed.current = Math.min(elapsed.current + delta, 3);
    const fadeIn = Math.min(elapsed.current / 3, 1);

    // ── Rotate icosahedron ──
    if (icoRef.current) {
      icoRef.current.rotation.x += 0.0008;
      icoRef.current.rotation.y += 0.0012;
    }

    // ── Update particles + trails ──
    let trailIdx = 0;
    let trailColIdx = 0;

    particles.forEach((p, i) => {
      for (let j = TRAIL_LENGTH - 1; j > 0; j--) p.history[j].copy(p.history[j - 1]);
      p.history[0].copy(p.position);
      p.position.add(p.velocity);

      if (Math.abs(p.position.x) > 25) p.position.x *= -0.95;
      if (Math.abs(p.position.y) > 25) p.position.y *= -0.95;
      if (Math.abs(p.position.z) > 15) p.position.z *= -0.95;

      pointPositions[i * 3]     = p.position.x;
      pointPositions[i * 3 + 1] = p.position.y;
      pointPositions[i * 3 + 2] = p.position.z;

      for (let j = 0; j < TRAIL_LENGTH - 1; j++) {
        const s = p.history[j], e = p.history[j + 1];
        trailPositions[trailIdx++] = s.x; trailPositions[trailIdx++] = s.y; trailPositions[trailIdx++] = s.z;
        trailPositions[trailIdx++] = e.x; trailPositions[trailIdx++] = e.y; trailPositions[trailIdx++] = e.z;
        const alpha = (1 - j / TRAIL_LENGTH) * 0.15 * fadeIn;
        for (let k = 0; k < 2; k++) {
          trailColors[trailColIdx++] = alpha;
          trailColors[trailColIdx++] = alpha;
          trailColors[trailColIdx++] = alpha;
        }
      }
    });

    // ── Connection lines between nearby particles ──
    let connIdx = 0;
    let connColIdx = 0;
    let connectionCount = 0;

    outer: for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (connectionCount >= MAX_CONNECTIONS) break outer;
        const dist = particles[i].position.distanceTo(particles[j].position);
        if (dist < CONNECTION_THRESHOLD) {
          const alpha = (1 - dist / CONNECTION_THRESHOLD) * 0.07 * fadeIn;
          const a = particles[i].position, b = particles[j].position;
          connPositions[connIdx++] = a.x; connPositions[connIdx++] = a.y; connPositions[connIdx++] = a.z;
          connPositions[connIdx++] = b.x; connPositions[connIdx++] = b.y; connPositions[connIdx++] = b.z;
          for (let k = 0; k < 2; k++) {
            connColors[connColIdx++] = alpha;
            connColors[connColIdx++] = alpha;
            connColors[connColIdx++] = alpha;
          }
          connectionCount++;
        }
      }
    }
    // Zero out unused connection slots
    for (let i = connIdx; i < connPositions.length; i++) connPositions[i] = 0;
    for (let i = connColIdx; i < connColors.length; i++) connColors[i] = 0;

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    trailsRef.current.geometry.attributes.position.needsUpdate = true;
    trailsRef.current.geometry.attributes.color.needsUpdate = true;
    connsRef.current.geometry.attributes.position.needsUpdate = true;
    connsRef.current.geometry.attributes.color.needsUpdate = true;

    (pointsRef.current.material as THREE.PointsMaterial).opacity    = 0.4 * fadeIn;
    (trailsRef.current.material as THREE.LineBasicMaterial).opacity  = 0.5 * fadeIn;
    (connsRef.current.material as THREE.LineBasicMaterial).opacity   = 1;
    (icoRef.current.material as THREE.LineBasicMaterial).opacity     = 0.07 * fadeIn;
  });

  return (
    <group>
      {/* Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={pointPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#ffffff" transparent opacity={0} sizeAttenuation />
      </points>

      {/* Trails */}
      <lineSegments ref={trailsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2} array={trailPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color"    count={PARTICLE_COUNT * (TRAIL_LENGTH - 1) * 2} array={trailColors}    itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0} />
      </lineSegments>

      {/* Connection lines */}
      <lineSegments ref={connsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={MAX_CONNECTIONS * 2} array={connPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color"    count={MAX_CONNECTIONS * 2} array={connColors}    itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={1} />
      </lineSegments>

      {/* Wireframe icosahedron */}
      <lineSegments ref={icoRef} geometry={icoGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0} />
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
      </Canvas>
    </div>
  );
}
