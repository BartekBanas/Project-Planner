# Project Planner frontend

The frontend uses React and TypeScript. It calls the C# API from the browser for both calculations.

See [Run locally](../../README.md#run-locally) for the API and frontend setup.

## Commands

Run these commands from `Frontend/cpm-project`.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the dependencies from the lockfile. |
| `npm start` | Start the development server on port `3000`. |
| `npm run typecheck` | Check TypeScript types without emitting files. |
| `npm run build` | Write the production frontend to `build`. |

## API requests

Both endpoints accept `POST` requests at `https://localhost:44363`.

| Workspace | Endpoint |
| --- | --- |
| Transport | `/api/TP` |
| Critical path | `/api/CPM` |
