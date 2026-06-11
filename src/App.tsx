import { Anchor, Box, Camera, ChevronLeft, ChevronRight, Gauge, Pause, Play, RotateCcw, Waves } from 'lucide-react';
import { AquariumScene } from './components/AquariumScene';
import { useEffect, useMemo, useState } from 'react';

export type Quality = 'low' | 'high';
export type CameraMode = 'overview' | 'follow';

export function App() {
  const [quality, setQuality] = useState<Quality>('high');
  const [paused, setPaused] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [followFishIndex, setFollowFishIndex] = useState(0);
  const route = useMemo(() => window.location.pathname.replace(/\/+$/, '') || '/', []);

  useEffect(() => {
    if (cameraMode !== 'follow' || paused) return undefined;

    const timer = window.setInterval(() => {
      setFollowFishIndex((value) => value + 1);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [cameraMode, paused]);

  function switchFollowFish(direction: -1 | 1) {
    setCameraMode('follow');
    setFollowFishIndex((value) => value + direction);
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
            aria-label="Previous followed fish"
            title="Previous fish"
            onClick={() => switchFollowFish(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={cameraMode === 'follow' ? 'Use overview camera' : 'Follow fish'}
            title={cameraMode === 'follow' ? 'Overview camera' : 'Follow fish'}
            onClick={() => setCameraMode((value) => (value === 'overview' ? 'follow' : 'overview'))}
          >
            <Camera aria-hidden="true" />
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
