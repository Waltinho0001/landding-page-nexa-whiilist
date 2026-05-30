# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5ca39ed2-979d-4f0c-8468-0ae49d6b7037

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in the required values:
   `RESEND_API_KEY`, `CORPORATE_EMAIL` and `DOMAIN` (use `http://localhost:5173` locally)
3. Start the local API server (optional, to test email sending):
   `node api/server-local.js`
4. Run the app:
   `npm run dev`

5. Open the browser at `http://localhost:5173`

> If you are deploying to Vercel, set the same environment variables in your Vercel project settings.
