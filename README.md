# Healthcare AI\nNext.js app for AI-driven healthcare solutions, with TypeScript and planned Redis/GraphQL integrations.

## Deploying to Vercel

1. Push your code to GitHub.
2. Go to [https://vercel.com/import](https://vercel.com/import) and import your repository.
3. In the Vercel dashboard, go to Project Settings > Environment Variables and add:
   - `OPENAI_API_KEY=sk-...`
   - (Optional) `ASSEMBLYAI_API_KEY=...`
4. Click “Deploy”.
5. Your app will be live at `https://your-project-name.vercel.app`.

**Note:** No sensitive data is stored. All processing is in-memory and uses browser and OpenAI APIs.
