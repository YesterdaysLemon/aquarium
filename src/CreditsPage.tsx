import { Anchor } from 'lucide-react';

export function CreditsPage() {
  return (
    <main className="credits-page">
      <a className="back-link" href="/">
        <Anchor aria-hidden="true" />
        Aquarium
      </a>
      <section className="credits-panel">
        <h1>About &amp; credits</h1>
        <p>
          Ocean Slice is an interactive 3D aquarium by <a href="https://alirezaafshan.com/" rel="author">Alireza Afshan</a>.
          Follow ten kinds of fish through sunlit water, watch the reef, or pause and explore with the camera.
        </p>
        <article>
          <h2>Explore the aquarium</h2>
          <p>Meet clownfish, blue tangs, yellow tangs, goldfish, koi, puffers, sharks, green chromis, anthias, and bannerfish. Use the fish picker to follow an individual, switch to the overview to orbit the reef, and scroll or pinch to zoom.</p>
          <p>This is a playful mixed-species world with artistic swimming behavior.</p>
          <div className="link-row"><a href="/">Enter the aquarium</a><a href="https://alirezaafshan.com/">More projects by Alireza Afshan</a></div>
        </article>
        <article>
          <h2>Living reef fish</h2>
          <p>Original fish models with species markings, fin rays, and swimming deformation, authored for Ocean Slice. The original reef and its attribution are preserved.</p>
        </article>
        <article>
          <h2>Original fish pack</h2>
          <p>
            The earlier fish models by Quaternius are retained in the project archive. Licensed under CC0 1.0 Universal / Public
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
