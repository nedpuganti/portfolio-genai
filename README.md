# Portfolio GenAI

A lightweight AI-powered portfolio assistant with smart context-aware responses.

## Setup

```bash
# Install dependencies
npm install

# Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Start the server
npm start
```

## Usage

```bash
# Ask about skills
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What programming skills do you have?"}'

# Ask about projects  
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me about your projects"}'
```

## Features

✅ **Smart AI** - Automatically finds relevant information  
✅ **Lightweight** - Minimal dependencies and clean code  
✅ **Secure** - Only chat endpoint exposed  

## Development

Update portfolio data in `src/mocks/` files:
- `personal-data.mock.js` - Contact info, bio
- `skills-data.mock.js` - Technical skills  
- `experience-data.mock.js` - Work history
- `projects-data.mock.js` - Portfolio projects
