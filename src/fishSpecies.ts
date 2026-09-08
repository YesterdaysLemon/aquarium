export type SpeciesId =
  | 'clownfish'
  | 'blueTang'
  | 'yellowTang'
  | 'goldfish'
  | 'koi'
  | 'puffer'
  | 'shark'
  | 'chromis'
  | 'anthias'
  | 'bannerfish';

export type FishSpecies = {
  id: SpeciesId;
  displayName: string;
  icon: string;
  schooling: boolean;
  predator: boolean;
  followEligible: boolean;
  color: string;
};

export const fishSpecies = [
  { id: 'chromis', displayName: 'Green Chromis', icon: '/assets/living-fish/chromis.png', schooling: true, predator: false, followEligible: true, color: '#71dace' },
  { id: 'anthias', displayName: 'Anthias', icon: '/assets/living-fish/anthias.png', schooling: true, predator: false, followEligible: true, color: '#f887ad' },
  { id: 'bannerfish', displayName: 'Bannerfish', icon: '/assets/living-fish/bannerfish.png', schooling: true, predator: false, followEligible: true, color: '#f5de89' },
  {
    id: 'clownfish',
    displayName: 'Clownfish',
    icon: '/assets/living-fish/clownfish.png',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#ff7b25',
  },
  {
    id: 'blueTang',
    displayName: 'Blue Tang',
    icon: '/assets/living-fish/blueTang.png',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#2366ff',
  },
  {
    id: 'yellowTang',
    displayName: 'Yellow Tang',
    icon: '/assets/living-fish/yellowTang.png',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#ffd22d',
  },
  {
    id: 'goldfish',
    displayName: 'Goldfish',
    icon: '/assets/living-fish/goldfish.png',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#f2942e',
  },
  {
    id: 'koi',
    displayName: 'Koi',
    icon: '/assets/living-fish/koi.png',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#f2efe0',
  },
  {
    id: 'puffer',
    displayName: 'Puffer',
    icon: '/assets/living-fish/puffer.png',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#d1bc67',
  },
  {
    id: 'shark',
    displayName: 'Shark',
    icon: '/assets/living-fish/shark.png',
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
