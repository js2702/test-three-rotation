import React, { useEffect, useRef, useState } from 'react'
import { Canvas, invalidate, useFrame, useThree } from '@react-three/fiber'
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
  // mesh.updateMatrix()
  const worldPoints = getPointsFromFigure(mesh).map((p) => {
    return mesh.localToWorld(p)
  })

  const pivot = worldPoints[1] // tr

  const pivotToTL = worldPoints[0].clone().sub(pivot)
  const pivotToBR = worldPoints[2].clone().sub(pivot)

  const normal = new THREE.Vector3().crossVectors(pivotToBR, pivotToTL)

  return new THREE.Plane(normal)
}

function getAlignPlaneQuaternion(baseNormal, otherNormal) {
  const m = baseNormal.clone().add(otherNormal).normalize()
  const axis = m.clone().cross(baseNormal)
  const angle = m.clone().dot(baseNormal)
  const q = new THREE.Quaternion(axis.x, axis.y, axis.z, angle).normalize()
  return q
}

function getBond(mesh) {
  const baseWorldPoints = getPointsFromFigure(mesh).map((p) => {
    return mesh.localToWorld(p)
  })

  const TR = baseWorldPoints[1]
  const BR = baseWorldPoints[2]

  return [TR, BR]
}

function getBondNormal([v, w], originalPlaneNormal) {
  const bondDir = v.clone().sub(w).normalize()

  const bondNormal = new THREE.Vector3()
    .copy(originalPlaneNormal)
    .applyAxisAngle(bondDir, -Math.PI / 2)
    .normalize()

  // console.log('bondnormal', bondNormal)
  return bondNormal
}

let stopAnimation = false

function getAngleBetweenBonds(a, b) {
  let angle = a.angleTo(b)

  const orientation = a.x * b.z - a.z * b.x
  console.log('Orientation', orientation)
  if (orientation > 0) angle = 2 * Math.PI - angle

  return angle
}

function alignMeshes(baseMesh, otherMesh, groupToRotate) {
  const basePlane = getPlane(baseMesh)
  const otherPlane = getPlane(otherMesh)

  const baseNormal = basePlane.normal.normalize()
  // console.log(baseNormal)
  const otherNormal = otherPlane.normal.normalize()
  // console.log(otherNormal)

  // Make planes parallel
  const q = getAlignPlaneQuaternion(baseNormal, otherNormal)
  groupToRotate.applyQuaternion(q)

  // Coger perpendicular del enlace
  groupToRotate.updateWorldMatrix(true, true)
  const baseBond = getBond(baseMesh)
  const otherBond = getBond(otherMesh)

  // console.log('Base bond', baseBond)
  // console.log('Other bond', otherBond)

  // console.log(freshOtherNormal, baseNormal, otherNormal)

  const baseBondNormal = getBondNormal(baseBond, baseNormal)
  const otherBondNormal = getBondNormal(otherBond, baseNormal)

  baseInfo = new FigureInfo(baseBondNormal, baseBond[0], baseBond[1])
  otherInfo = new FigureInfo(otherBondNormal, otherBond[0], otherBond[1])

  // console.log('Between bonds', THREE.MathUtils.radToDeg(angleBetweenBondNormals), 'final', THREE.MathUtils.radToDeg(orientationAngle))
  const targetBondNormal = baseBondNormal.clone().multiplyScalar(-1)
  const alignBondVectorsQ = q.setFromUnitVectors(otherBondNormal, targetBondNormal)
  groupToRotate.applyQuaternion(alignBondVectorsQ)
  // groupToRotate.rotateOnAxis(new THREE.Vector3(0, 0, 1), orientationAngle)
  // groupToRotate.lookAt(baseBondNormal)
  groupToRotate.updateWorldMatrix(true, true)

  const isFirstTime = currentAngle === null
  const dif = isFirstTime ? 0 : Math.abs(orientationAngle - currentAngle)

  currentAngle = orientationAngle
  console.log('dif', dif.toFixed(4), currentAngle.toFixed(4))

  // const baseV =

  // console.log(q.normalize())

  // console.log(basePlane)
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
    <Canvas frameloop="demand" onCreated={(state) => state.gl.setClearColor('black')}>
      <Dummy />
    </Canvas>
  )
}

let currentAngle = null

function ButtonForPros({ onClick }) {
  const { invalidate, camera, gl } = useThree()
  return (
    <mesh
      onClick={() => {
        onClick()
        invalidate()
      }}
      position={[2, 2, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.05]} />
      <meshStandardMaterial color={'green'} />
    </mesh>
  )
}

function Controls() {
  const ref = useRef()
  const { invalidate, camera, gl } = useThree()
  useEffect(() => {
    ref.current.addEventListener('change', invalidate)
    return () => ref.current.removeEventListener('change', invalidate)
  }, [])
  return <OrbitControls ref={ref} args={[camera, gl.domElement]} />
}

class FigureInfo {
  constructor(bondNormal, v, w) {
    this.bondNormal = bondNormal
    this.v = v
    this.w = w
  }
}

let baseInfo
let otherInfo

function FigureInfoComponent({ info }) {
  if (!info) {
    return null
  }

  const midPoint = info.v.clone().add(info.w).multiplyScalar(0.5)

  return <arrowHelper args={[info.bondNormal.normalize(), midPoint, 0.5]} />
  // return <arrowHelper args={[new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(0, 0, 0), 1]} />
}

function Dummy() {
  const baseRef = useRef()
  const otherRef = useRef()
  const groupRef = useRef()
  const baseGroupRef = useRef()

  useEffect(() => {
    setTimeout(() => {
      alignMeshes(baseRef.current, otherRef.current, groupRef.current)
      invalidate()
    }, 1000)
  }, [])

  function triggerAnimation() {
    baseGroupRef.current.rotation.z += 0.01
    baseGroupRef.current.rotation.y += 0.02
    baseGroupRef.current.rotation.x += 0.04
    alignMeshes(baseRef.current, otherRef.current, groupRef.current)
  }

  const [baseInfoState, setBaseInfoState] = useState()
  const [otherInfoState, setOtherInfoState] = useState()

  useFrame(() => {
    if (currentAngle !== null && currentAngle.toFixed(4) === '0.2682') {
      console.log('Ay', baseGroupRef.current.rotation)
    } else {
    }

    triggerAnimation()
    if (baseInfo) {
      setBaseInfoState(baseInfo)
    }

    if (otherInfo) {
      setOtherInfoState(otherInfo)
    }
  })

  // const initialRotation = [5.9, 3.6, 5.48]
  // const initialRotation = [6.14, 3.72, 5.54]
  const initialRotation = [-0.3, 0.5, Math.PI + Math.PI / 4]

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Figure sRef={baseRef} groupRef={baseGroupRef} color="green" position={[-0.7, 0, 0]} rotation={initialRotation} />
      <Figure sRef={otherRef} groupRef={groupRef} position={[0.7, 0, 0]} />
      <Controls />
      <ButtonForPros onClick={triggerAnimation} />
      <axesHelper args={[3]} />
      <gridHelper />
      <FigureInfoComponent info={baseInfoState} />
      <FigureInfoComponent info={otherInfoState} />
    </>
  )
}
