import { CreditsPage } from './CreditsPage';
import { Camera, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Shuffle, ZoomIn, ZoomOut } from 'lucide-react';
import { AquariumScene } from './components/AquariumScene';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { fishSpecies, fishSpeciesById, followableFishSpecies, normalizeSpeciesIndex, type SpeciesId } from './fishSpecies';

export type Quality = 'low' | 'high';
export type CameraMode = 'overview' | 'follow';

export function App() {
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [quality, setQuality] = useState<Quality>(() => window.matchMedia('(max-width: 680px)').matches ? 'low' : 'high');
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const changeZoom = useCallback((factor: number) => setZoom(value => Math.min(3, Math.max(.55, value * factor))), []);
  const [followFishIndex, setFollowFishIndex] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId>('blueTang');
  const [autoFollow, setAutoFollow] = useState(true);
  const [autoTourStep, setAutoTourStep] = useState(0);
  const route = useMemo(() => window.location.pathname.replace(/\/+$/, '') || '/', []);
  const selectedSpeciesInfo = fishSpeciesById[selectedSpecies];

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 680px)');
    const updateQuality = () => setQuality(mobile.matches ? 'low' : 'high');
    mobile.addEventListener('change', updateQuality);
    return () => mobile.removeEventListener('change', updateQuality);
  }, []);

  useEffect(() => {
    document.querySelector('.fish-choice.is-selected')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [selectedSpecies]);

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
        showHitboxes={false}
        cameraMode={cameraMode}
        cameraResetKey={cameraResetKey}
        followFishIndex={followFishIndex}
        selectedSpecies={selectedSpecies}
        zoom={zoom}
        onZoomChange={changeZoom}
      />
      <section className="hud" aria-label="Aquarium controls">
        <div className="brand">
          <img src="/favicon.svg?v=2" alt="" width="26" height="26" />
          <h1>Ocean Slice</h1>
        </div>
        <div className="controls">
          <button type="button" className="icon-button" aria-label="Zoom out" title="Zoom out (−)" disabled={zoom <= .55}
            onClick={() => changeZoom(1 / 1.2)}><ZoomOut aria-hidden="true" /></button>
          <output className="zoom-level" aria-label="Camera zoom">{Math.round(zoom * 100)}%</output>
          <button type="button" className="icon-button" aria-label="Zoom in" title="Zoom in (+)" disabled={zoom >= 3}
            onClick={() => changeZoom(1.2)}><ZoomIn aria-hidden="true" /></button>
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
            onClick={() => { setZoom(1); setCameraMode('overview'); setCameraResetKey((value) => value + 1); }}
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
              aria-pressed={species.id === selectedSpecies}
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
      <p className="camera-hint">Scroll or pinch to zoom{cameraMode === 'overview' ? ' · Drag to orbit' : ''}</p>
    </main>
  );
}
