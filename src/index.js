// Known AI crawler user agents
const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic',
  'ChatGPT-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot',
  'OAI-SearchBot',
  'Bytespider',
  'Amazonbot',
  'FacebookBot',
  'Meta-ExternalAgent',
  'CCBot',
  'Diffbot',
  'cohere-ai',
  'Perplexity-User',
];

function isAICrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return AI_CRAWLERS.some(bot => ua.includes(bot.toLowerCase()));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';

    // If AI crawler and not already on /listings, redirect them
    if (isAICrawler(userAgent) && url.pathname !== '/listings') {
      return Response.redirect(`${url.origin}/listings`, 302);
    }

    // If request is for /listings, serve the AI-readable listings.txt content
    if (url.pathname === '/listings') {
      const listingsContent = await getListingsContent(env);
      return new Response(listingsContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // All other traffic (humans, non-AI crawlers) passes through to origin
    return fetch(request);
  },
};

// You can hardcode, fetch from KV, or fetch from your origin here
async function getListingsContent(env) {
  // Option A: Hardcoded content (simplest)
  return `# Iwange250 Listings
# Last updated: 2026-06-18
# Format: Structured plain text for AI consumption

## Property Listings

### Listing 1
- ID: prop-001
- Title: Modern 2-Bedroom Apartment in Kigali
- Location: Kigali, Rwanda
- Price: $1,200/month
- Type: Residential Rental
- Bedrooms: 2
- Bathrooms: 2
- Description: Fully furnished modern apartment with city views, secure parking, and 24/7 security.
- URL: https://iwange250.app/listings/prop-001
- Available: Yes

### Listing 2
- ID: prop-002
- Title: Commercial Office Space - Kigali CBD
- Location: Kigali CBD, Rwanda
- Price: $2,500/month
- Type: Commercial Rental
- Size: 150 sqm
- Description: Prime location office space with meeting rooms, high-speed internet, and reception area.
- URL: https://iwange250.app/listings/prop-002
- Available: Yes

# End of listings
`;

  // Option B: Fetch from your origin if you already have an endpoint
  // const response = await fetch('https://your-origin.com/api/listings-text');
  // return response.text();

  // Option C: Fetch from Workers KV (recommended for dynamic data)
  // return env.LISTINGS_KV.get('listings.txt') || '# No listings available';
}
