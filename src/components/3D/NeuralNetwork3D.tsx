import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export function NeuralNetwork3D() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = isMobile ? 30 : 60;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      temp.push({ x, y, z, factor: Math.random() * 2 + 1, speed: Math.random() * 0.01 + 0.005 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.1;
      groupRef.current.rotation.x = time * 0.05;
    }

    if (meshRef.current) {
      particles.forEach((particle, i) => {
        const t = time * particle.speed;
        dummy.position.set(
          particle.x + Math.sin(t * particle.factor) * 0.5,
          particle.y + Math.cos(t * particle.factor) * 0.5,
          particle.z + Math.sin(t * particle.factor) * 0.5
        );
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </instancedMesh>
      
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.05} />
      </mesh>
    </group>
  );
}
