import { useFrame } from '@react-three/fiber';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';

export type ReefUniforms = {
  time: THREE.IUniform<number>;
  health: THREE.IUniform<number>;
  causticColor: THREE.IUniform<THREE.Color>;
};

const ReefShaderContext = createContext<ReefUniforms | null>(null);

export function ReefShaderProvider({
  children,
  health,
  paused,
}: {
  children: ReactNode;
  health: number;
  paused: boolean;
}) {
  const uniforms = useMemo<ReefUniforms>(
    () => ({
      time: { value: 0 },
      health: { value: health },
      causticColor: { value: new THREE.Color('#9ff7e8') },
    }),
    [],
  );

  useEffect(() => {
    uniforms.health.value = health;
  }, [health, uniforms]);

  useFrame((_, delta) => {
    if (!paused) uniforms.time.value += delta;
  });

  return <ReefShaderContext.Provider value={uniforms}>{children}</ReefShaderContext.Provider>;
}

export function useReefUniforms() {
  const uniforms = useContext(ReefShaderContext);
  if (!uniforms) throw new Error('Reef materials must be rendered inside ReefShaderProvider.');
  return uniforms;
}

export function decorateReefMaterial(material: THREE.Material, uniforms: ReefUniforms) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return material;

  material.flatShading = true;
  material.roughness = Math.max(0.68, material.roughness);
  material.onBeforeCompile = (shader) => injectReefShader(shader, uniforms);
  material.customProgramCacheKey = () => 'ocean-slice-reef-look-v1';
  material.needsUpdate = true;
  return material;
}

export function cloneWithReefLook(root: THREE.Object3D, uniforms: ReefUniforms) {
  const clone = root.clone(true);
  clone.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const sources = Array.isArray(node.material) ? node.material : [node.material];
    const decorated = sources.map((source) => decorateReefMaterial(source.clone(), uniforms));
    node.material = Array.isArray(node.material) ? decorated : decorated[0];
  });
  return clone;
}

export function ReefMaterial({
  color,
  emissive = '#061d24',
  emissiveIntensity = 0.08,
  metalness = 0,
  opacity = 1,
  roughness = 0.82,
  side = THREE.FrontSide,
  transparent = false,
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  opacity?: number;
  roughness?: number;
  side?: THREE.Side;
  transparent?: boolean;
}) {
  const uniforms = useReefUniforms();
  const onBeforeCompile = useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => injectReefShader(shader, uniforms),
    [uniforms],
  );

  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      flatShading
      metalness={metalness}
      opacity={opacity}
      roughness={roughness}
      side={side}
      transparent={transparent}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'ocean-slice-reef-look-v1'}
    />
  );
}

function injectReefShader(shader: THREE.WebGLProgramParametersWithUniforms, uniforms: ReefUniforms) {
  shader.uniforms.uReefTime = uniforms.time;
  shader.uniforms.uReefHealth = uniforms.health;
  shader.uniforms.uReefCausticColor = uniforms.causticColor;

  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
      varying vec3 vReefWorldPosition;`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vReefWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
      uniform float uReefTime;
      uniform float uReefHealth;
      uniform vec3 uReefCausticColor;
      varying vec3 vReefWorldPosition;

      float reefCaustic(vec2 p) {
        float a = sin(p.x * 2.7 + sin(p.y * 1.9 - uReefTime * 0.62) * 1.7 + uReefTime * 0.34);
        float b = sin(p.y * 3.1 + sin(p.x * 2.2 + uReefTime * 0.48) * 1.5 - uReefTime * 0.26);
        float ridge = 1.0 - abs(a + b) * 0.5;
        return smoothstep(0.76, 0.98, ridge);
      }`,
    )
    .replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float reefHealth = clamp(uReefHealth, 0.0, 1.0);
      float luminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 stressed = mix(vec3(luminance), vec3(0.43, 0.48, 0.38), 0.42);
      diffuseColor.rgb = mix(stressed, diffuseColor.rgb, 0.18 + reefHealth * 0.82);
      float caustic = reefCaustic(vReefWorldPosition.xz * 0.68 + vReefWorldPosition.y * 0.13);
      float depthAttenuation = 1.0 - smoothstep(-10.0, 10.0, -vReefWorldPosition.y);
      diffuseColor.rgb += uReefCausticColor * caustic * depthAttenuation * (0.045 + reefHealth * 0.13);`,
    );
}
