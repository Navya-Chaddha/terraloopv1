# TerraLoop

A neighbourhood marketplace that helps grocers share surplus food with local buyers.

## Stack

- Next.js frontend on port `3000`.
- Express API on port `3001`, backed by MySQL.
- Phone/email and password authentication with JWT sessions.
- Gemini-powered produce photo analysis (requires a `GEMINI_API_KEY`).

## Run locally

Requirements: Node.js and a running MySQL server.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set your MySQL connection details and a
   private `JWT_SECRET`. Add `GEMINI_API_KEY` to enable photo analysis.
3. For a new, empty database, run `npm run db:init`. For an existing TerraLoop
   database, run `npm run db:migrate:images` to add the profile-photo and
   listing-image/location columns without dropping data.
4. Run `npm run dev`. This starts both the Next.js frontend and the Express API.
5. Open `http://localhost:3000`. Camera access requires browser permission and
   works on localhost or HTTPS.

`npm run db:init` recreates the tables and deletes existing data; use it only
when intentionally initializing an empty database. Never run it against a
database you want to keep.

## Shared deployment

Deploy the frontend and API together and configure the MySQL variables,
`JWT_SECRET`, and `GEMINI_API_KEY` in the hosting environment. Set `HOST=0.0.0.0`
when the API must accept connections outside localhost. Do not share database
credentials with users of the app.
