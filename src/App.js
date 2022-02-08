import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Plane, useHelper } from '@react-three/drei'
import { BoxHelper, PlaneHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib'

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  //useFrame((state, delta) => (ref.current.rotation.x += 0.01))
  // Return the view, these are regular Threejs elements expressed in JSX
  useHelper(ref, VertexNormalsHelper, 1, 'red')

  return (
    <mesh
      {...props}
      ref={ref}
      onUpdate={(self) => {
        self.geometry.computeVertexNormals()
      }}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry
        args={[1, 1, 0.05]}
        onUpdate={(self) => {
          self.computeVertexNormals()
        }}
      />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

function MyPlane() {
  const mesh = useRef()

  //var vnh = new THREE.VertexNormalsHelper( mesh, 1, 0xff0000 );
  useHelper(mesh, VertexNormalsHelper, 0.2, 'red')

  return (
    <Plane
      ref={mesh}
      onUpdate={(self) => {
        self.geometry.computeVertexNormals()
      }}>
      <meshPhongMaterial attach="material" color="#f3f3f3" />
    </Plane>
  )
}

function Figure({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <MyPlane />
      <SideIndicator />
    </group>
  )
}

function SideIndicator() {
  return (
    <Plane
      args={[0.05, 0.8]}
      position={[0.45, 0, 0.01]}
      onUpdate={(self) => {
        self.geometry.computeVertexNormals()
      }}>
      <meshStandardMaterial attach="material" color="red" />
    </Plane>
  )
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Figure position={[-0.5, 0, 0]} rotation={[-0.3, 0, 0]} />
      <Figure position={[0.7, 0.5, 0]} />
      <OrbitControls />
    </Canvas>
  )
}
