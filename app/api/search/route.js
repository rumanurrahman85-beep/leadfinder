import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { niche, location } = await request.json();
    if (!niche || !location) {
      return Response.json({ error: 'Niche and Location are required' }, { status: 400 });
    }

    const cleanNiche = niche.trim().toLowerCase();
    const cleanLocation = location.trim().toLowerCase();

    // 1. Caching Check: Look for results from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cachedLeads, error: cacheError } = await supabase
      .from('leads')
      .select('*')
      .eq('niche', cleanNiche)
      .eq('location', cleanLocation)
      .gte('created_at', oneDayAgo);

    if (!cacheError && cachedLeads && cachedLeads.length > 0) {
      return Response.json({ source: 'cache', data: cachedLeads });
    }

    // 2. Fetch fresh data via SerpApi
    const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(`${cleanNiche} ${cleanLocation}`)}&api_key=${process.env.SERPAPI_KEY}`;
    const serpResponse = await fetch(serpUrl);
    const serpData = await serpResponse.json();

    const initialResults = serpData.local_results || [];
    // Limit to top 5 to safely adhere to server execution windows
    const targetLeads = initialResults.slice(0, 5);

    const processedLeads = [];

    // 3. Process records and scrape contact emails
    for (const lead of targetLeads) {
      let email = null;
      const website = lead.website || '';

      if (website) {
        try {
          // Use an isolated fetch with a 1.5s timeout for stability
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          const pageResponse = await fetch(website, { signal: controller.signal });
          const htmlText = await pageResponse.text();
          clearTimeout(timeoutId);

          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const foundEmails = htmlText.match(emailRegex);
          if (foundEmails) {
            // Deduplicate matching results and exclude common image assets
            const validEmails = foundEmails.filter(e => !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(e));
            if (validEmails.length > 0) email = validEmails[0];
          }
        } catch (scrapeError) {
          console.log(`Skipping background parsing for ${website}:`, scrapeError.message);
        }
      }

      const newLead = {
        company_name: lead.title || 'N/A',
        website: website || 'N/A',
        phone: lead.phone || 'N/A',
        address: lead.address || 'N/A',
        email: email || 'N/A',
        niche: cleanNiche,
        location: cleanLocation
      };

      // Upsert directly into Supabase database
      if (website && website !== 'N/A') {
        await supabase.from('leads').upsert(newLead, { onConflict: 'website' });
      }

      processedLeads.push(newLead);
    }

    return Response.json({ source: 'api', data: processedLeads });
  } catch (globalError) {
    return Response.json({ error: globalError.message }, { status: 500 });
  }
}
