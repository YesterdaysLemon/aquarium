import { Anchor, Camera, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Shuffle, Sprout, Waves } from 'lucide-react';
import { AquariumScene } from './components/AquariumScene';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { fishSpecies, fishSpeciesById, followableFishSpecies, normalizeSpeciesIndex, type SpeciesId } from './fishSpecies';

export type Quality = 'low' | 'high';
export type CameraMode = 'overview' | 'follow';

export function App() {
  const [paused, setPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [followFishIndex, setFollowFishIndex] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId>('lagoonTang');
  const [autoFollow, setAutoFollow] = useState(true);
  const [autoTourStep, setAutoTourStep] = useState(0);
  const [reefHealth, setReefHealth] = useState(0.88);
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
        quality="high"
        paused={paused}
        showHitboxes={false}
        cameraMode={cameraMode}
        cameraResetKey={cameraResetKey}
        followFishIndex={followFishIndex}
        selectedSpecies={selectedSpecies}
        reefHealth={reefHealth}
      />
      <section className="hud" aria-label="Aquarium controls">
        <div className="brand">
          <Waves aria-hidden="true" />
          <span>Coral Bloom</span>
        </div>
        <div className="controls">
          <label className="health-control">
            <Sprout aria-hidden="true" />
            <span>Reef {Math.round(reefHealth * 100)}%</span>
            <input
              aria-label="Reef health"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={reefHealth}
              onChange={(event) => setReefHealth(Number(event.target.value))}
            />
          </label>
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
            aria-label="Reset camera"
            title="Reset camera"
            onClick={() => setCameraResetKey((value) => value + 1)}
          >
            <RotateCcw aria-hidden="true" />
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
        Reef notes
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
        <h1>Reef Notes</h1>
        <p>
          Coral Bloom combines openly served Polyfork reef props with original
          procedural creatures, terrain, movement, and underwater shaders made
          directly for this aquarium.
        </p>
        <article>
          <h2>Polyfork Coral Reef</h2>
          <p>
            Thirteen free props from the Coral Reef kit are loaded from
            Polyfork&apos;s public CDN. The scene uses the kit&apos;s shared scale and
            palette while keeping paid meshes and preview files out of this repository.
          </p>
          <div className="link-row">
            <a href="https://polyfork.dev/kit/coral-reef-a7128a">Kit</a>
            <a href="https://polyfork.dev/licensing">License</a>
          </div>
        </article>
        <article>
          <h2>Original scene system</h2>
          <p>
            Every swimming creature, the reef arch, rock formations, branching
            coral, sponge gardens, caustic projection, water surface, and global
            reef-health response are code-native geometry and shaders in this app.
          </p>
          <div className="link-row">
            <a href="https://github.com/YesterdaysLemon/aquarium">Source</a>
          </div>
        </article>
      </section>
    </main>
  );
}
