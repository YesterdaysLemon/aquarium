<!-- al-stack:project:start -->
## Al-stack project

Project: aquarium. Profile: web. Status: experimental.

A living Three.js aquarium with a compact X Player Card view.

`al-stack.toml` records this project's setup and dependencies. Work from the checkout selected for the task; other branches/worktrees are optional history. Use `al-stack register .` once when starting work here. Local registration does not change the project's lifecycle.

Project commands:
- dev: `npm run dev -- --host 127.0.0.1`
- build: `npm run build`
- test: `npm test`

Declared tools (verify availability in the intended agent):
- node (cli): `node`.
- npm (cli): `npm`.
- docker (cli): `docker`.

Edit project guidance outside this managed section. Use `al-stack configure` for its fields and `al-stack check .` for setup checks. Run the actual project checks for behavioral validation.
<!-- al-stack:project:end -->

## Aquarium

Ocean Slice is a React/TypeScript/Three.js aquarium, published at `https://fish.alirezaafshan.com/`. Use Node 22 or newer. `npm run dev -- --host 127.0.0.1` starts local development; `npm run build` typechecks, builds both HTML entries, and prerenders `/credits`; `npm test` checks fish assets and deterministic swimming.

The homepage is the full aquarium. `/embed` is the compact Player Card view of the same simulation. Keep the card metadata in server-readable HTML, the 480-square preview image real, and the `/credits` metadata independent. Preserve reduced-motion behavior and the embed's visibility pause. Changes to framing must be checked against the deployed HTTP headers, not only HTML or Vite.

Use the host `frontend-quality` and `playwright` skills for visual and interaction work. Browser acceptance includes the embed at 480-square and 320-square, an actual iframe, fish selection, pause/resume, camera/tour controls, opening the full aquarium, and the ordinary homepage/credits flow. Build and fish checks must pass; validate changes to `nginx.conf` with `nginx -t` and HTTP route/header checks. CI uses `nginx:1.27-alpine`.

Use the host `vps-operations` and `credentials-access` skills for authorized deployment and authentication. The existing main-branch workflow calls Deploy Manager. A local preview, a successful build, a deployment, and verified playback inside X are distinct evidence states. Publication follows the current task's authorization.
