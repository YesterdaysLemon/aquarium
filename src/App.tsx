import { Anchor, Box, Camera, ChevronLeft, ChevronRight, Gauge, Pause, Play, RotateCcw, Shuffle, Waves } from 'lucide-react';
import { AquariumScene } from './components/AquariumScene';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { fishSpecies, fishSpeciesById, followableFishSpecies, normalizeSpeciesIndex, type SpeciesId } from './fishSpecies';

export type Quality = 'low' | 'high';
export type CameraMode = 'overview' | 'follow';

export function App() {
  const [quality, setQuality] = useState<Quality>('high');
  const [paused, setPaused] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [followFishIndex, setFollowFishIndex] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId>('blueTang');
  const [autoFollow, setAutoFollow] = useState(true);
  const [autoTourStep, setAutoTourStep] = useState(0);
  const route = useMemo(() => window.location.pathname.replace(/\/+$/, '') || '/', []);
  const selectedSpeciesInfo = fishSpeciesById[selectedSpecies];

  useEffect(() => {
    if (cameraMode !== 'follow' || paused || !autoFollow) return undefined;

    const timer = window.setInterval(() => {
      setAutoTourStep((value) => value + 1);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [autoFollow, cameraMode, paused]);

  useEffect(() => {
    if (cameraMode !== 'follow' || !autoFollow || autoTourStep === 0) return;

    const species = followableFishSpecies[normalizeSpeciesIndex(autoTourStep)];
    setSelectedSpecies(species.id);
    setFollowFishIndex((value) => value + 1);
  }, [autoFollow, autoTourStep, cameraMode]);

  function switchFollowFish(direction: -1 | 1) {
    setCameraMode('follow');
    setAutoFollow(false);
    setFollowFishIndex((value) => value + direction);
  }

  function selectSpecies(speciesId: SpeciesId) {
    setSelectedSpecies(speciesId);
    setFollowFishIndex(0);
    setCameraMode('follow');
    setAutoFollow(false);
  }

  function toggleFollowMode() {
    setCameraMode((value) => (value === 'overview' ? 'follow' : 'overview'));
  }

  if (route === '/credits') {
    return <CreditsPage />;
  }

  return (
    <main className="app-shell">
      <AquariumScene
        quality={quality}
        paused={paused}
        showHitboxes={showHitboxes}
        cameraMode={cameraMode}
        cameraResetKey={cameraResetKey}
        followFishIndex={followFishIndex}
        selectedSpecies={selectedSpecies}
      />
      <section className="hud" aria-label="Aquarium controls">
        <div className="brand">
          <Waves aria-hidden="true" />
          <span>Ocean Slice</span>
        </div>
        <div className="controls">
          <button
            type="button"
            className="icon-button"
            aria-label={paused ? 'Resume fish movement' : 'Pause fish movement'}
            title={paused ? 'Resume' : 'Pause'}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={cameraMode === 'follow' ? 'Use overview camera' : 'Follow fish'}
            title={cameraMode === 'follow' ? 'Overview camera' : 'Follow fish'}
            onClick={toggleFollowMode}
          >
            <Camera aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={showHitboxes ? 'Hide hitboxes' : 'Show hitboxes'}
            title={showHitboxes ? 'Hide hitboxes' : 'Show hitboxes'}
            onClick={() => setShowHitboxes((value) => !value)}
          >
            <Box aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Reset camera"
            title="Reset camera"
            onClick={() => setCameraResetKey((value) => value + 1)}
          >
            <RotateCcw aria-hidden="true" />
          </button>
          <button
            type="button"
            className="quality-button"
            aria-label={`Quality is ${quality}`}
            title="Toggle quality"
            onClick={() => setQuality((value) => (value === 'high' ? 'low' : 'high'))}
          >
            <Gauge aria-hidden="true" />
            <span>{quality}</span>
          </button>
        </div>
      </section>
      <section className="fish-panel" aria-label="Fish selection">
        <div className="selected-fish">
          <img src={selectedSpeciesInfo.icon} alt="" className="selected-fish-icon" />
          <div className="selected-fish-copy">
            <span>{cameraMode === 'follow' ? (autoFollow ? 'Auto tour' : 'Following') : 'Selected'}</span>
            <strong>{selectedSpeciesInfo.displayName}</strong>
            <small>{selectedSpeciesInfo.predator ? 'Predator' : selectedSpeciesInfo.schooling ? 'Schooling' : 'Solitary'}</small>
          </div>
          <div className="selected-fish-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous followed fish"
              title="Previous fish"
              onClick={() => switchFollowFish(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`icon-button ${autoFollow ? 'is-active' : ''}`}
              aria-label={autoFollow ? 'Disable auto fish tour' : 'Enable auto fish tour'}
              title="Auto tour"
              onClick={() => {
                setCameraMode('follow');
                setAutoFollow((value) => !value);
              }}
            >
              <Shuffle aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Next followed fish"
              title="Next fish"
              onClick={() => switchFollowFish(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="fish-picker" aria-label="Choose fish species">
          {fishSpecies.map((species) => (
            <button
              type="button"
              key={species.id}
              className={`fish-choice ${species.id === selectedSpecies ? 'is-selected' : ''}`}
              aria-label={`Follow ${species.displayName}`}
              title={species.displayName}
              onClick={() => selectSpecies(species.id)}
              style={{ '--species-color': species.color } as CSSProperties}
            >
              <img src={species.icon} alt="" />
              <span>{species.displayName}</span>
            </button>
          ))}
        </div>
      </section>
      <a className="credits-link" href="/credits">
        Model credits
      </a>
    </main>
  );
}

function CreditsPage() {
  return (
    <main className="credits-page">
      <a className="back-link" href="/">
        <Anchor aria-hidden="true" />
        Aquarium
      </a>
      <section className="credits-panel">
        <h1>Model Credits</h1>
        <p>
          This aquarium uses optimized web conversions of locally supplied model
          files. Source archives and production web assets are kept separate.
        </p>
        <article>
          <h2>Animated Cute Fish Pack</h2>
          <p>
            Models by Quaternius. Licensed under CC0 1.0 Universal / Public
            Domain Dedication.
          </p>
          <div className="link-row">
            <a href="https://quaternius.com/packs/cutefish.html">Source</a>
            <a href="https://creativecommons.org/publicdomain/zero/1.0/">License</a>
          </div>
        </article>
        <article>
          <h2>Underwater Environment</h2>
          <p>
            Model by Conrad Justin. Licensed under Creative Commons Attribution
            4.0 International.
          </p>
          <div className="link-row">
            <a href="https://sketchfab.com/3d-models/underwater-environment-eb5f5bdc58714e098e3d3ca12c15eb32">
              Source
            </a>
            <a href="https://creativecommons.org/licenses/by/4.0/">License</a>
          </div>
        </article>
      </section>
    </main>
  );
}
