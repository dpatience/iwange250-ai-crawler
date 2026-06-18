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
    const isAI = isAICrawler(userAgent);

    // AI crawlers visiting root -> send to /listings
    if (isAI && url.pathname === '/') {
      return Response.redirect(`${url.origin}/listings`, 302);
    }

    // AI crawlers visiting /listings -> serve the structured text
    if (isAI && url.pathname === '/listings') {
      const content = await getListingsContent(env);
      return new Response(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Humans visiting /listings -> redirect back to home
    if (!isAI && url.pathname === '/listings') {
      return Response.redirect(`${url.origin}/`, 302);
    }

    // Everything else passes through to origin normally
    return fetch(request);
  },
};

async function getListingsContent(env) {
  return `# Iwange250 Listings
# Last updated: 2026-06-18

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
}
