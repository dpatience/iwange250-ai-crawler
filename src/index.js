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
  'YouBot',
  'Googlebot',
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

    // Serve robots.txt — tells crawlers that /listings is allowed
    if (url.pathname === '/robots.txt') {
      return new Response(getRobotsTxt(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

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

    // AI crawlers requesting a specific listing detail
    if (isAI && url.pathname.startsWith('/listings/')) {
      const listingId = url.pathname.replace('/listings/', '').replace(/\/$/, '');
      const content = await getListingDetail(env, listingId);
      if (content) {
        return new Response(content, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }
      return new Response('Listing not found.', { status: 404 });
    }

    // Humans visiting /listings -> redirect back to home
    if (!isAI && url.pathname === '/listings') {
      return Response.redirect(`${url.origin}/`, 302);
    }

    // Everything else passes through to origin normally
    return fetch(request);
  },
};

function getRobotsTxt() {
  return `User-agent: *
Allow: /listings
Allow: /robots.txt
Disallow: /api/
Disallow: /admin/

# AI crawlers are welcome to index property listings
User-agent: GPTBot
Allow: /listings

User-agent: ClaudeBot
Allow: /listings

User-agent: PerplexityBot
Allow: /listings

User-agent: Google-Extended
Allow: /listings

Sitemap: https://iwange250.app/sitemap.xml
`;
}

async function getListingsContent(env) {
  // If you have a KV namespace or API, fetch from it here.
  // Example with KV:
  //   const data = await env.LISTINGS_KV.get('all_listings');
  //   if (data) return formatListings(JSON.parse(data));
  //
  // Example fetching from your own API:
  //   const resp = await fetch('https://api.iwange250.app/listings');
  //   const listings = await resp.json();
  //   return formatListings(listings);

  // Hardcoded fallback — replace this with a real data source
  const listings = getStaticListings();
  return formatListings(listings);
}

async function getListingDetail(env, id) {
  const listings = getStaticListings();
  const listing = listings.find(l => l.id === id);
  if (!listing) return null;

  return `# ${listing.title}
# Iwange250 — Property Detail
# URL: https://iwange250.app/property/${listing.id}

## Overview
- ID: ${listing.id}
- Title: ${listing.title}
- Location: ${listing.location}
- Price: ${listing.price}
- Type: ${listing.type}
- Available: ${listing.available ? 'Yes' : 'No'}
${listing.bedrooms ? `- Bedrooms: ${listing.bedrooms}` : ''}
${listing.bathrooms ? `- Bathrooms: ${listing.bathrooms}` : ''}
${listing.size ? `- Size: ${listing.size}` : ''}

## Description
${listing.description}

## Contact
To inquire about this listing, visit: https://iwange250.app/property/${listing.id}
`;
}

function formatListings(listings) {
  const now = new Date().toISOString().split('T')[0];
  const available = listings.filter(l => l.available);

  let text = `# Iwange250 — Real Estate Listings (Rwanda)
# Website: https://iwange250.app
# Last updated: ${now}
# Total available listings: ${available.length}
#
# Iwange250 is a property platform listing residential and commercial
# real estate for rent and sale across Rwanda, primarily in Kigali.

`;

  for (const listing of listings) {
    text += `---\n`;
    text += `### ${listing.title}\n`;
    text += `- ID: ${listing.id}\n`;
    text += `- Location: ${listing.location}\n`;
    text += `- Price: ${listing.price}\n`;
    text += `- Type: ${listing.type}\n`;
    text += `- Available: ${listing.available ? 'Yes' : 'No'}\n`;
    if (listing.bedrooms) text += `- Bedrooms: ${listing.bedrooms}\n`;
    if (listing.bathrooms) text += `- Bathrooms: ${listing.bathrooms}\n`;
    if (listing.size) text += `- Size: ${listing.size}\n`;
    text += `- Description: ${listing.description}\n`;
    text += `- Detail URL: https://iwange250.app/property/${listing.id}\n`;
    text += `\n`;
  }

  text += `---\n# End of listings\n# For the most current data, visit https://iwange250.app\n`;
  return text;
}

// Replace this with a real DB/KV/API fetch in production
function getStaticListings() {
  return [
    {
      id: '41b8ef80-e4da-439f-b8ec-58c9a3ad51e4',
      title: 'Modern 2-Bedroom Apartment in Kigali',
      location: 'Ruhango, Rwanda',
      price: 'RWF 120,000/month',
      type: 'Residential Rental',
      bedrooms: 2,
      bathrooms: 2,
      size: null,
      description: 'Fully furnished modern apartment with city views, secure parking, and 24/7 security.',
      available: true,
    },
    {
      id: 'fc31a025-bfdc-4027-9f1a-a9043f2569b8',
      title: 'Commercial Office Space - Kigali CBD',
      location: 'Kigali CBD, Rwanda',
      price: 'RWF 50,000/month',
      type: 'Commercial Rental',
      bedrooms: 3,
      bathrooms: 2,
      size: '200 sqm',
      description: 'PVery beautiful house for the whole family in Ruhango you can rent it during a month or more than a month . So you’re very welcome',
      available: true,
    },
  ];
}