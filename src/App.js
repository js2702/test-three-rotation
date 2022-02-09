import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Plane, useHelper } from '@react-three/drei'
import { BoxHelper, PlaneHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib'
import * as THREE from 'three'

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

function getPointsFromFigure(mesh) {
  let pos = mesh.geometry.attributes.position
  let points = []
  for (let i = 0; i < 8; i++) {
    let v = new THREE.Vector3()
    v.fromBufferAttribute(pos, i)
    points.push(v)
  }

  // console.log('Points', points)

  return [
    points[5], // tl
    points[0], // tr
    points[2], // br
    points[7] // bl
  ]
}

function getPlane(mesh) {
  mesh.updateMatrix()
  const worldPoints = getPointsFromFigure(mesh).map((p) => {
    return mesh.localToWorld(p)
  })

  const pivot = worldPoints[1] // tr

  const pivotToTL = worldPoints[0].clone().sub(pivot)
  const pivotToBR = worldPoints[2].clone().sub(pivot)

  const normal = new THREE.Vector3().crossVectors(pivotToBR, pivotToTL)

  return new THREE.Plane(normal)
}

function alignMeshes(baseMesh, otherMesh, groupToRotate) {
  const basePlane = getPlane(baseMesh)
  const otherPlane = getPlane(otherMesh)

  const baseNormal = basePlane.normal.normalize()
  // console.log(baseNormal)
  const otherNormal = otherPlane.normal.normalize()
  // console.log(otherNormal)

  const m = baseNormal.clone().add(otherNormal).normalize()

  const axis = m.clone().cross(baseNormal)

  const angle = m.clone().dot(baseNormal)

  const q = new THREE.Quaternion(axis.x, axis.y, axis.z, angle).normalize()

  // console.log(q.normalize())

  // console.log(basePlane)

  groupToRotate.applyQuaternion(q)
}

function MyPlane({ sRef, color }) {
  //var vnh = new THREE.VertexNormalsHelper( mesh, 1, 0xff0000 );
  useHelper(sRef, VertexNormalsHelper, 0.2, 'red')

  return (
    <mesh ref={sRef}>
      <boxGeometry
        args={[1, 1, 0.05]}
        onUpdate={(self) => {
          self.computeVertexNormals()
        }}
      />
      <meshStandardMaterial color={color} />
    </mesh>
  )

  return (
    <Plane
      ref={sRef}
      onUpdate={(self) => {
        self.geometry.computeVertexNormals()
      }}>
      <meshPhongMaterial attach="material" color={color ?? '#f3f3f3'} />
    </Plane>
  )
}

function Figure({ sRef, position, rotation, color, groupRef }) {
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <MyPlane sRef={sRef} color={color} />
      <SideIndicator />
    </group>
  )
}

function SideIndicator() {
  return (
    <Plane
      args={[0.05, 0.8]}
      position={[0.45, 0, 0.03]}
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
      <Dummy />
    </Canvas>
  )
}

function Dummy() {
  const baseRef = useRef()
  const otherRef = useRef()
  const groupRef = useRef()
  const baseGroupRef = useRef()

  // useEffect(() => {
  //   alignMeshes(baseRef.current, otherRef.current, groupRef.current)
  // }, [])

  useFrame(() => {
    baseGroupRef.current.rotation.x += 0.01
    // baseGroupRef.current.rotation.y += 0.01
    alignMeshes(baseRef.current, otherRef.current, groupRef.current)
  })
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Figure sRef={baseRef} groupRef={baseGroupRef} color="green" position={[-0.5, 0, 0]} rotation={[-0.3, 0, 0]} />
      <Figure sRef={otherRef} groupRef={groupRef} position={[0.7, 0.5, 0]} />
      <OrbitControls />
    </>
  )
}
