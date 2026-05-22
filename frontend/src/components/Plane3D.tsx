import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Un componente de avión de papel estilizado
function PaperPlane(props: any) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      // Movimiento suave hacia adelante y balanceo
      group.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
      group.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        {/* Usamos un tetraedro para simular un avión de papel moderno/low-poly */}
        <coneGeometry args={[1, 3, 3]} />
        <meshStandardMaterial 
          color="#ffffff" 
          metalness={0.2} 
          roughness={0.5} 
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Estela o propulsor estilizado */}
      <mesh position={[0, -1.5, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export default function Plane3D() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Float
          speed={2} // Animation speed
          rotationIntensity={0.5} // XYZ rotation intensity
          floatIntensity={1.5} // Up/down float intensity
          floatingRange={[-0.5, 0.5]} // Range of y-axis values the object will float within
        >
          <PaperPlane position={[0, 0, 0]} rotation={[0.5, -0.5, 0]} />
        </Float>

        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
