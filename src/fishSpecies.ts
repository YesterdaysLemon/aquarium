export type SpeciesId =
  | 'clownfish'
  | 'blueTang'
  | 'yellowTang'
  | 'goldfish'
  | 'koi'
  | 'puffer'
  | 'shark';

export type FishSpecies = {
  id: SpeciesId;
  displayName: string;
  model: string;
  icon: string;
  schooling: boolean;
  predator: boolean;
  followEligible: boolean;
  color: string;
};

export const fishSpecies = [
  {
    id: 'clownfish',
    displayName: 'Clownfish',
    model: '/assets/fish/Clownfish.glb',
    icon: '/assets/fish-icons/clownfish.svg',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#ff7b25',
  },
  {
    id: 'blueTang',
    displayName: 'Blue Tang',
    model: '/assets/fish/BlueTang.glb',
    icon: '/assets/fish-icons/blue-tang.svg',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#2366ff',
  },
  {
    id: 'yellowTang',
    displayName: 'Yellow Tang',
    model: '/assets/fish/YellowTang.glb',
    icon: '/assets/fish-icons/yellow-tang.svg',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#ffd22d',
  },
  {
    id: 'goldfish',
    displayName: 'Goldfish',
    model: '/assets/fish/Goldfish.glb',
    icon: '/assets/fish-icons/goldfish.svg',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#f2942e',
  },
  {
    id: 'koi',
    displayName: 'Koi',
    model: '/assets/fish/Koi.glb',
    icon: '/assets/fish-icons/koi.svg',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#f2efe0',
  },
  {
    id: 'puffer',
    displayName: 'Puffer',
    model: '/assets/fish/Puffer.glb',
    icon: '/assets/fish-icons/puffer.svg',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#d1bc67',
  },
  {
    id: 'shark',
    displayName: 'Shark',
    model: '/assets/fish/Shark.glb',
    icon: '/assets/fish-icons/shark.svg',
    schooling: false,
    predator: true,
    followEligible: true,
    color: '#607680',
  },
] as const satisfies readonly FishSpecies[];

export const fishSpeciesById = fishSpecies.reduce(
  (speciesById, species) => ({
    ...speciesById,
    [species.id]: species,
  }),
  {} as Record<SpeciesId, FishSpecies>,
);

export const followableFishSpecies = fishSpecies.filter((species) => species.followEligible);

export function normalizeSpeciesIndex(index: number) {
  return ((index % followableFishSpecies.length) + followableFishSpecies.length) % followableFishSpecies.length;
}
