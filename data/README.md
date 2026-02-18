# Project data

Seed and static data for GTracker.

## `gamam150.json`

150 Day problems list used to seed the `150DayProblems` table.

- **Format:** JSON with keys: `Coding`, `SystemDesign`, `ObjectOrientedDesign`, `SchemaDesign`, `APIDesign`, `Behavioral`. Each value is an array of `{ name, url, difficulty?, day? }`.
- **Upload to DB:** `npm run upload-150day-problems`
