import { Camera, ExternalLink, Pause, Play, Shuffle } from 'lucide-react';
import type { CameraMode } from '../App';
import { fishSpecies, type SpeciesId } from '../fishSpecies';

type Props = {
  paused: boolean;
  cameraMode: CameraMode;
  selectedSpecies: SpeciesId;
  autoFollow: boolean;
  onPause: () => void;
  onCamera: () => void;
  onSpecies: (species: SpeciesId) => void;
  onTour: () => void;
};

export function EmbedControls({ paused, cameraMode, selectedSpecies, autoFollow, onPause, onCamera, onSpecies, onTour }: Props) {
  return <>
    <header className="embed-header">
      <h1><img src="/favicon.svg?v=2" alt="" width="24" height="24" />Ocean Slice</h1>
      <a href="/" target="_blank" rel="noopener noreferrer" className="embed-open">
        Open aquarium <ExternalLink aria-hidden="true" size={14} />
      </a>
    </header>
    <section className="embed-toolbar" aria-label="Aquarium controls">
      <label className="embed-species">
        <span>{cameraMode === 'overview' ? 'Choose a fish' : autoFollow ? 'Auto tour' : 'Following'}</span>
        <select aria-label="Follow a fish" value={selectedSpecies} onChange={event => onSpecies(event.target.value as SpeciesId)}>
          {fishSpecies.map(species => <option key={species.id} value={species.id}>{species.displayName}</option>)}
        </select>
      </label>
      <button type="button" className="icon-button" onClick={onPause}
        aria-label={paused ? 'Resume fish movement' : 'Pause fish movement'} title={paused ? 'Resume' : 'Pause'}>
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
      <button type="button" className="icon-button" onClick={onCamera}
        aria-label={cameraMode === 'follow' ? 'Use overview camera' : 'Follow fish'} title={cameraMode === 'follow' ? 'Overview camera' : 'Follow fish'}>
        <Camera aria-hidden="true" />
      </button>
      <button type="button" className={`icon-button${autoFollow && cameraMode === 'follow' ? ' is-active' : ''}`} onClick={onTour}
        aria-label={autoFollow && cameraMode === 'follow' ? 'Disable auto fish tour' : 'Enable auto fish tour'} aria-pressed={autoFollow && cameraMode === 'follow'} title="Auto tour">
        <Shuffle aria-hidden="true" />
      </button>
    </section>
  </>;
}
