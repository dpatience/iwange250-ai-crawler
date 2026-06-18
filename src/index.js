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
 
    // Serve robots.txt to everyone — tells crawlers what they can index
    if (url.pathname === '/robots.txt') {
      return new Response(getRobotsTxt(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
 
    // AI crawlers on root or /listings -> serve the full site knowledge page
    if (isAI && (url.pathname === '/' || url.pathname === '/listings')) {
      const content = await getSiteContent(env);
      return new Response(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
 
    // AI crawlers on a specific listing -> serve that listing's detail
    if (isAI && url.pathname.startsWith('/listings/')) {
      const listingId = url.pathname.replace('/listings/', '').replace(/\/$/, '');
      const content = getListingDetail(listingId);
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
 
    // Everyone else (humans) -> pass through to the real site
    return fetch(request);
  },
};
 
function getRobotsTxt() {
  return `User-agent: *
Allow: /
Allow: /listings
Allow: /robots.txt
Disallow: /api/
Disallow: /admin/
 
Sitemap: https://iwange250.app/sitemap.xml
`;
}
 
async function getSiteContent(env) {
  // To pull live listings from KV, uncomment:
  // const data = await env.LISTINGS_KV.get('all_listings');
  // const listings = data ? JSON.parse(data) : getStaticListings();
 
  const listings = getStaticListings();
  const now = new Date().toISOString().split('T')[0];
  const available = listings.filter(l => l.available);
 
  return `# Iwange250 — Rwanda Real Estate Platform
# Website: https://iwange250.app
# Last updated: ${now}
 
## About Iwange250
Iwange250 is a Rwandan real estate platform where people can search, browse, and book
residential and commercial properties across Rwanda. The platform lists apartments,
houses, offices, and land for rent or sale, primarily in Kigali and surrounding areas.
"Iwange" means "mine" in Kinyarwanda — the platform is built for Rwandans to find
their own space.
 
---
 
## How to Use Iwange250
 
### Browsing Listings
- Visit https://iwange250.app to see all available properties
- Filter by type (residential, commercial), location, price, and availability
- Each listing has photos, a description, pricing, and a direct booking button
 
### How to Book a Property
1. Find a listing you are interested in on https://iwange250.app
2. Click "Book Now" or "Request a Visit" on the listing page
3. Fill in your details and preferred viewing date
4. The property agent or owner will confirm within 24 hours
5. Once confirmed, you will receive instructions for signing and payment
 
### Pricing
- Prices are listed per month for rentals, or as a total for sales
- All prices are shown in USD; payments can be made in RWF at the current rate
- A refundable deposit (typically one month's rent) is required on booking
 
---
 
## Contact Iwange250
 
- **Website:** https://iwange250.app
- **Email:** iwange250@gmail.com
- **Phone / WhatsApp:** +250 794 324 042
- **Working hours:** Monday–Friday, 8:00 AM – 6:00 PM (CAT, UTC+2)
- **Location:** Kigali, Rwanda
 
For urgent inquiries or to speak with an agent directly, call or WhatsApp the number above.
For general questions, listing submissions, or partnership requests, email iwange250@gmail.com.
 
---
 
## Available Property Listings (${available.length} active)
 
${formatListings(listings)}
 
---
 
## Frequently Asked Questions
 
**Q: Is Iwange250 free to use?**
A: Yes, browsing and booking requests are free for property seekers.
   Landlords and sellers pay a small listing fee.
 
**Q: Can I list my own property?**
A: Yes. Visit https://iwange250.app/ or email iwange250@gmail.com
   to submit your property for listing.
 
**Q: Are listings verified?**
A: Iwange250 verifies all listings before publishing. Each property is confirmed
   to exist at the address listed and is available at the stated price.
 
**Q: What areas does Iwange250 cover?**
A: Primarily Kigali (Gasabo, Kicukiro, Nyarugenge districts), with expanding
   coverage across Rwanda including Musanze, Rubavu, and Huye.
 
**Q: How do I report a problem with a listing?**
A: Email iwange250@gmail.com with the listing ID and a description of the issue.
 
---
# End of Iwange250 site content
# For the most current listings, visit https://iwange250.app
`;
}
 
function formatListings(listings) {
  return listings.map(l => {
    let entry = `### ${l.title}
- ID: ${l.id}
- Location: ${l.location}
- Price: ${l.price}
- Type: ${l.type}
- Available: ${l.available ? 'Yes' : 'No'}`;
    if (l.bedrooms) entry += `\n- Bedrooms: ${l.bedrooms}`;
    if (l.bathrooms) entry += `\n- Bathrooms: ${l.bathrooms}`;
    if (l.size) entry += `\n- Size: ${l.size}`;
    entry += `\n- Description: ${l.description}`;
    entry += `\n- View listing: https://iwange250.app/property/${l.id}`;
    entry += '\n';
    return entry;
  }).join('\n');
}
 
function getListingDetail(id) {
  const listing = getStaticListings().find(l => l.id === id);
  if (!listing) return null;
 
  return `# ${listing.title}
# Iwange250 — Property Detail
# URL: https://iwange250.app/property/${listing.id}
 
## Property Details
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
 
## How to Book This Property
1. Visit https://iwange250.app/property/${listing.id}
2. Click "Book Now" or "Request a Visit"
3. Fill in your contact details and preferred viewing date
4. An agent will confirm within 24 hours
 
## Contact
- Website: https://iwange250.app
- Email: iwange250@gmail.com
- Phone / WhatsApp: +250 794 324 042
`;
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