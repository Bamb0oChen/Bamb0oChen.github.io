/* eslint-disable react/no-unknown-property */
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Center, ContactShadows, Environment, Html, OrbitControls, useFBX, useGLTF } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import './ModelViewer.css';

function Loader() {
    return (
        <Html center>
            <span className="model-loader">Loading</span>
        </Html>
    );
}

function getDisplayMaterial(material) {
    const name = String(material?.name || '').toLowerCase();

    if (name.includes('horn')) {
        return new THREE.MeshStandardMaterial({
            name: material?.name || 'horn-brass',
            color: '#c4893a',
            roughness: 0.28,
            metalness: 0.86
        });
    }

    if (name.includes('cd')) {
        return new THREE.MeshStandardMaterial({
            name: material?.name || 'vinyl-record',
            color: '#111316',
            roughness: 0.34,
            metalness: 0.28
        });
    }

    return new THREE.MeshStandardMaterial({
        name: material?.name || 'wood-base',
        color: '#70462f',
        roughness: 0.46,
        metalness: 0.08
    });
}

function centerDetachedRecord(mesh, materials) {
    const geometry = mesh.geometry;
    const position = geometry?.attributes?.position;
    const groups = geometry?.groups || [];
    if (!position || !groups.length) return;

    const recordGroup = groups.find(group => {
        const material = materials[group.materialIndex];
        return String(material?.name || '').toLowerCase().includes('cd');
    });
    if (!recordGroup) return;

    const indices = new Set();
    const box = new THREE.Box3();

    for (let i = recordGroup.start; i < recordGroup.start + recordGroup.count; i += 1) {
        const index = geometry.index ? geometry.index.getX(i) : i;
        indices.add(index);
        box.expandByPoint(new THREE.Vector3().fromBufferAttribute(position, index));
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    const delta = new THREE.Vector3(0.02 - center.x, -0.03 - center.y, 0.82 - center.z);

    indices.forEach(index => {
        position.setXYZ(
            index,
            position.getX(index) + delta.x,
            position.getY(index) + delta.y,
            position.getZ(index) + delta.z
        );
    });

    position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
}

function GramophoneFallback({ autoRotateSpeed }) {
    const groupRef = useRef(null);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * autoRotateSpeed;
        }
    });

    return (
        <group ref={groupRef} rotation={[0.08, -0.25, 0]}>
            <mesh position={[0, -0.62, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.15, 0.34, 1.46]} />
                <meshStandardMaterial color="#3b2418" roughness={0.52} metalness={0.08} />
            </mesh>
            <mesh position={[0, -0.41, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.72, 0.16, 1.12]} />
                <meshStandardMaterial color="#6b3e28" roughness={0.45} metalness={0.08} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.18, -0.27, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.54, 0.54, 0.08, 96]} />
                <meshStandardMaterial color="#151719" roughness={0.42} metalness={0.25} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.18, -0.22, 0]} castShadow receiveShadow>
                <torusGeometry args={[0.42, 0.012, 10, 96]} />
                <meshStandardMaterial color="#3d444c" roughness={0.38} metalness={0.65} />
            </mesh>
            <mesh position={[-0.18, -0.17, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.05, 48]} />
                <meshStandardMaterial color="#c89b50" roughness={0.28} metalness={0.78} />
            </mesh>
            <mesh position={[0.62, -0.1, 0.02]} rotation={[0.08, 0, 0.72]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 1.05, 24]} />
                <meshStandardMaterial color="#c49443" roughness={0.22} metalness={0.9} />
            </mesh>
            <mesh position={[0.88, -0.42, 0.16]} rotation={[0.2, 0.35, 0]} castShadow>
                <coneGeometry args={[0.08, 0.22, 24]} />
                <meshStandardMaterial color="#d6b06a" roughness={0.24} metalness={0.82} />
            </mesh>
            <group position={[0.42, 0.52, -0.03]} rotation={[0, -0.72, -0.22]}>
                <mesh castShadow receiveShadow>
                    <coneGeometry args={[0.82, 1.24, 96, 1, true]} />
                    <meshStandardMaterial color="#c98b35" side={THREE.DoubleSide} roughness={0.32} metalness={0.78} />
                </mesh>
                <mesh position={[0, 0.63, 0]} castShadow>
                    <torusGeometry args={[0.83, 0.035, 16, 96]} />
                    <meshStandardMaterial color="#f0c77a" roughness={0.18} metalness={0.92} />
                </mesh>
                <mesh position={[0, -0.58, 0]} castShadow>
                    <cylinderGeometry args={[0.16, 0.2, 0.18, 48]} />
                    <meshStandardMaterial color="#b8732f" roughness={0.24} metalness={0.85} />
                </mesh>
            </group>
        </group>
    );
}

function NormalizedModel({ object, targetSize = 2.35 }) {
    const groupRef = useRef(null);
    const cloned = useMemo(() => object.clone(true), [object]);

    useLayoutEffect(() => {
        const group = groupRef.current;
        if (!group) return;

        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(group);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxSize = Math.max(size.x, size.y, size.z) || 1;
        const scale = targetSize / maxSize;
        group.scale.setScalar(scale);
        group.position.set(-center.x * scale, -center.y * scale - 0.08, -center.z * scale);

        group.traverse(child => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            child.geometry = child.geometry.clone();
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            centerDetachedRecord(child, materials);
            const themedMaterials = materials.filter(Boolean).map(material => {
                const nextMaterial = getDisplayMaterial(material);
                nextMaterial.side = material.side ?? THREE.FrontSide;
                nextMaterial.needsUpdate = true;
                return nextMaterial;
            });
            child.material = Array.isArray(child.material) ? themedMaterials : themedMaterials[0];
        });
    }, [cloned, targetSize]);

    return (
        <group ref={groupRef}>
            <primitive object={cloned} />
        </group>
    );
}

function GlbModel({ url, modelScale }) {
    const { scene } = useGLTF(url);
    return <NormalizedModel object={scene} targetSize={modelScale} />;
}

function FbxModel({ url, modelScale }) {
    const fbx = useFBX(url);
    return <NormalizedModel object={fbx} targetSize={modelScale} />;
}

function ObjModel({ url, modelScale }) {
    const obj = useLoader(OBJLoader, url);
    return <NormalizedModel object={obj} targetSize={modelScale} />;
}

function ModelContent({ url, autoRotateSpeed, modelScale }) {
    const ext = String(url || '').split('.').pop()?.toLowerCase();

    if (ext === 'glb' || ext === 'gltf') {
        return <GlbModel url={url} modelScale={modelScale} />;
    }

    if (ext === 'obj') {
        return <ObjModel url={url} modelScale={modelScale} />;
    }

    if (ext === 'fbx') {
        return <FbxModel url={url} modelScale={modelScale} />;
    }

    return <GramophoneFallback autoRotateSpeed={autoRotateSpeed} />;
}

export default function ModelViewer({
    url = '',
    width = '100%',
    height = 440,
    defaultRotationX = -12,
    defaultRotationY = -24,
    defaultZoom = 4.4,
    modelScale = 2.55,
    modelXOffset = 0,
    modelYOffset = 0,
    minZoomDistance = 2.6,
    maxZoomDistance = 8,
    ambientIntensity = 0.55,
    keyLightIntensity = 2.1,
    fillLightIntensity = 0.95,
    rimLightIntensity = 1.25,
    environmentPreset = 'city',
    autoRotate = true,
    autoRotateSpeed = 0.32,
    enableManualRotation = true,
    enableManualZoom = false,
    className = ''
}) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={`model-viewer ${className}`} style={{ width, height }}>
            <Canvas
                shadows
                dpr={[1, 1.65]}
                camera={{ fov: 38, position: [0, 0.35, defaultZoom], near: 0.1, far: 100 }}
                gl={{ alpha: true, antialias: true }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                {environmentPreset !== 'none' && <Environment preset={environmentPreset} background={false} />}
                <ambientLight intensity={ambientIntensity} />
                <directionalLight position={[4, 5, 5]} intensity={keyLightIntensity} castShadow />
                <directionalLight position={[-4, 1.8, 3]} intensity={fillLightIntensity} />
                <directionalLight position={[0, 4, -4]} intensity={rimLightIntensity} />
                <Suspense fallback={<Loader />}>
                    <Center
                        onCentered={() => setLoaded(true)}
                        position={[modelXOffset, modelYOffset, 0]}
                        rotation={[THREE.MathUtils.degToRad(defaultRotationX), THREE.MathUtils.degToRad(defaultRotationY), 0]}
                    >
                        <ModelContent url={url} autoRotateSpeed={autoRotate ? autoRotateSpeed : 0} modelScale={modelScale} />
                    </Center>
                </Suspense>
                <ContactShadows position={[0, -1.02, 0]} opacity={0.42} scale={5.5} blur={2.6} far={3.2} />
                <OrbitControls
                    makeDefault
                    enablePan={false}
                    enableRotate={enableManualRotation}
                    enableZoom={enableManualZoom}
                    minDistance={minZoomDistance}
                    maxDistance={maxZoomDistance}
                    autoRotate={autoRotate}
                    autoRotateSpeed={autoRotateSpeed}
                    target={[0, -0.05, 0]}
                />
            </Canvas>
            <div className="model-viewer-shine" />
        </div>
    );
}
