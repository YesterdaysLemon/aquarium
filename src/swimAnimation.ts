import * as THREE from 'three';
import type { SpeciesId } from './fishSpecies';

export const swimUniforms = () => ({ time: { value: 0 }, effort: { value: 1 } });
export const swimRate = (species: SpeciesId, effort: number) => species === 'shark'
  ? 1.7 + effort * 1.25 : species === 'puffer' ? 4.0 + effort * 1.1 : 2.8 + effort * 2.1;

export function animateFishMaterial(material: THREE.Material, uniforms: ReturnType<typeof swimUniforms>, species: SpeciesId) {
  const shark = species === 'shark', puffer = species === 'puffer';
  const hinge = shark ? -.88 : puffer ? -.49 : -.45;
  const start = shark ? .30 : .12;
  const amplitude = shark ? .075 : puffer ? 0 : .045;
  const pectoralX = ({ clownfish: .1275, blueTang: .09, yellowTang: .09, goldfish: .1575,
    koi: .1425, chromis: .09, anthias: .0975, bannerfish: .075, shark: .12, puffer: .275 })[species];
  material.onBeforeCompile = shader => {
    shader.uniforms.uSwimTime = uniforms.time; shader.uniforms.uEffort = uniforms.effort;
    shader.vertexShader = `
      uniform float uSwimTime;
      uniform float uEffort;
      vec3 swimRotate(vec3 p, float a) {
        float c = cos(a), s = sin(a);
        return vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x);
      }
      vec2 spine(float z) {
        float q = max(0.0, ${start.toFixed(3)} - z);
        float gain = ${amplitude.toFixed(3)} * (0.65 + clamp(uEffort, 0.0, 2.0) * .35);
        // Increasing z phase sends the curvature wave from head to tail.
        float phase = uSwimTime + z * 2.2;
        float offset = gain * q * q * sin(phase);
        float slope = gain * (-2.0 * q * sin(phase) + 2.2 * q * q * cos(phase));
        return vec2(offset, atan(slope));
      }
      float tailYaw() {
        return spine(${hinge.toFixed(3)}).y + sin(uSwimTime + ${hinge.toFixed(3)} * 2.2 - .35)
          * ${puffer ? '.065' : '(.10 + min(uEffort, 2.0) * .055)'};
      }
      float paddleYaw(float part) {
        float side = part < 2.5 ? -1.0 : 1.0;
        return side * sin(uSwimTime * ${puffer ? '3.4' : shark ? '1.0' : '1.7'} + side * .35)
          * ${puffer ? '.60' : shark ? '.018' : '.15'};
      }
      vec3 swimPosition(vec3 p) {
        float part = uv.x;
        vec3 result = p;
        if (part > .5 && part < 1.5) {
          // The caudal fin rotates as a single blade about its peduncle.
          vec3 hinge = vec3(spine(${hinge.toFixed(3)}).x, 0.0, ${hinge.toFixed(3)});
          result = hinge + swimRotate(p - vec3(0.0, 0.0, ${hinge.toFixed(3)}), tailYaw());
        } else {
        if (part > 1.5 && part < 3.5) {
          float side = part < 2.5 ? -1.0 : 1.0;
          vec3 pivot = vec3(side * ${pectoralX.toFixed(4)}, ${shark ? '-.045, .14' : puffer ? '-.035, .10' : '-.04, .12'});
          p = pivot + swimRotate(p - pivot, paddleYaw(part));
        }
        ${puffer ? 'if (part > 3.5) p.x += sin(uSwimTime * 3.4 + p.y * 4.0) * .045 * uv.y; result = p;' : `
          vec2 bend = spine(p.z);
          result = vec3(bend.x, 0.0, p.z) + swimRotate(vec3(p.xy, 0.0), bend.y);
        `}
        }
        return result;
      }
      vec3 swimNormal(vec3 n, vec3 p) {
        float part = uv.x;
        if (part > .5 && part < 1.5) return swimRotate(n, tailYaw());
        if (part > 1.5 && part < 3.5) n = swimRotate(n, paddleYaw(part));
        return swimRotate(n, spine(p.z).y);
      }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = swimPosition(position);');
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = swimNormal(objectNormal, position);');
  };
  material.customProgramCacheKey = () => `ocean-articulated-swim-v3-${species}`;
}
