export type SpeciesId =
  | 'emberFish'
  | 'lagoonTang'
  | 'sunfinTang'
  | 'reefGrouper'
  | 'moonJelly'
  | 'seaTurtle'
  | 'reefShark';

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
  {
    id: 'emberFish',
    displayName: 'Ember Fish',
    icon: '/assets/creature-icons/ember-fish.svg',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#ff9d7a',
  },
  {
    id: 'lagoonTang',
    displayName: 'Lagoon Tang',
    icon: '/assets/creature-icons/lagoon-tang.svg',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#4fb8a8',
  },
  {
    id: 'sunfinTang',
    displayName: 'Sunfin Tang',
    icon: '/assets/creature-icons/sunfin-tang.svg',
    schooling: true,
    predator: false,
    followEligible: true,
    color: '#ffd98c',
  },
  {
    id: 'reefGrouper',
    displayName: 'Reef Grouper',
    icon: '/assets/creature-icons/reef-grouper.svg',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#c079b0',
  },
  {
    id: 'moonJelly',
    displayName: 'Moon Jelly',
    icon: '/assets/creature-icons/moon-jelly.svg',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#e0aecd',
  },
  {
    id: 'seaTurtle',
    displayName: 'Sea Turtle',
    icon: '/assets/creature-icons/sea-turtle.svg',
    schooling: false,
    predator: false,
    followEligible: true,
    color: '#7c8f7a',
  },
  {
    id: 'reefShark',
    displayName: 'Reef Shark',
    icon: '/assets/creature-icons/reef-shark.svg',
    schooling: false,
    predator: true,
    followEligible: true,
    color: '#9aa3a6',
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
