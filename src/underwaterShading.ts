import * as THREE from 'three';

export const oceanTime = { value: 0 };

export function swayKelp(material: THREE.Material) {
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uKelpTime = oceanTime;
    shader.vertexShader = 'uniform float uKelpTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec3 kelpWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
      float rootWeight = smoothstep(-6.0, 12.0, kelpWorld.y);
      vec3 drift = vec3(sin(uKelpTime * .65 + kelpWorld.y * .22 + kelpWorld.z * .17), 0.0,
        cos(uKelpTime * .48 + kelpWorld.y * .18 + kelpWorld.x * .15)) * .24 * rootWeight * rootWeight;
      transformed += vec3(dot(modelMatrix[0].xyz, drift) / dot(modelMatrix[0].xyz, modelMatrix[0].xyz),
        dot(modelMatrix[1].xyz, drift) / dot(modelMatrix[1].xyz, modelMatrix[1].xyz),
        dot(modelMatrix[2].xyz, drift) / dot(modelMatrix[2].xyz, modelMatrix[2].xyz));
    `);
  };
  material.customProgramCacheKey = () => 'ocean-kelp-v1';
}

// World-space sunlight modulation follows surfaces, including moving fish.
export function underwaterMaterial(material: THREE.MeshStandardMaterial) {
  const previous = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uOceanTime = oceanTime;
    shader.vertexShader = 'varying vec3 vOceanPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `
      #include <worldpos_vertex>
      vOceanPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
    `);
    shader.fragmentShader = `uniform float uOceanTime; varying vec3 vOceanPosition;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec2 water = vOceanPosition.xz * 1.3 + vOceanPosition.y * vec2(0.20, -0.12);
      water += vec2(sin(water.y * .65 + uOceanTime * .35), cos(water.x * .72 - uOceanTime * .28)) * .65;
      float waveA = sin(water.x * 2.3 + water.y * 1.6 + uOceanTime * .5);
      float waveB = sin(water.x * -1.7 + water.y * 2.5 - uOceanTime * .4);
      float lattice = pow(1.0 - abs(waveA * .52 + waveB * .48), 14.0);
      float surfaceLight = exp(-max(0.0, 10.0 - vOceanPosition.y) * .045);
      vec3 worldN = inverseTransformDirection(normal, viewMatrix);
      float facingSun = max(dot(worldN, normalize(vec3(-.35, 1.0, -.25))), 0.0);
      outgoingLight *= vec3(.90, .98, 1.0);
      outgoingLight += diffuseColor.rgb * vec3(.55, .82, .78) * lattice * surfaceLight * facingSun * .48;
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => previousKey + '-underwater-v1';
}
