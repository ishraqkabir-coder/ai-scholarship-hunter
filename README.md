# AI Scholarship Hunter 🎓

Real-time AI-powered scholarship finder — built for the Frostbyte Hackathon

## Live Demo
[aischolarshiphunter.netlify.app](https://aischolarshiphunter.netlify.app)

## Features
-  Real-time scholarship search via Perplexity Sonar AI
-  Personalized match scoring based on your profile
-  Deep Research — requirements, documents, past recipients, YouTube guides
-  Dark / Light mode
-  PDF export of Deep Research results
-  Privacy-first — no database, no login, data stays in your browser

## Tech Stack
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
- **AI:** tavily + together Ai (Llama 3.3 70B) (real-time web search)
- **Backend:** Netlify Serverless Functions (API key protection)
- **Hosting:** Netlify

## Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Create .env file with your API key
echo "OR_API_KEY=your_openrouter_key_here" > .env
echo "OR_MODEL=perplexity/sonar" >> .env

# Run locally
netlify dev
```

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect repo on [netlify.com](https://netlify.com)
3. Set environment variables in Netlify dashboard:
   - `OR_API_KEY` = your OpenRouter API key
   - `OR_MODEL` = `perplexity/sonar`
4. Deploy!

## Built By
**Muhammad Ishraq Kabir** — 17-year-old Full-Stack Developer from Bangladesh  
Built solo for the Frostbyte Hackathon
