import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapPropertyType(type?: string): 'apartment' | 'house' | 'condo' | 'commercial' {
  const t = (type || '').toLowerCase();
  if (t.includes('condo')) return 'condo';
  if (t.includes('apartment') || t.includes('multi') || t.includes('plex')) return 'apartment';
  if (t.includes('commercial')) return 'commercial';
  return 'house';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('RENTCAST_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing RENTCAST_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { city = 'Austin', state = 'TX', limit = 6, minBeds, maxPrice } = await req.json();

    // Fetch sale listings for the target market
    const saleUrl = new URL('https://api.rentcast.io/v1/listings/sale');
    saleUrl.searchParams.set('city', String(city));
    saleUrl.searchParams.set('state', String(state));
    saleUrl.searchParams.set('status', 'active');
    saleUrl.searchParams.set('sort', 'newest');
    saleUrl.searchParams.set('limit', String(limit));
    if (minBeds) saleUrl.searchParams.set('minBeds', String(minBeds));
    if (maxPrice) saleUrl.searchParams.set('maxPrice', String(maxPrice));

    const saleResp = await fetch(saleUrl.toString(), {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!saleResp.ok) {
      const txt = await saleResp.text();
      console.error('Rentcast sale listings error', saleResp.status, txt);
      return new Response(JSON.stringify({ error: 'Failed to fetch sale listings', details: txt }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const saleListings = await saleResp.json();

    // For each sale listing, try to fetch rent estimate to compute ROI/Cap Rate
    const results = [] as any[];
    for (const l of saleListings || []) {
      const address = l?.formattedAddress || l?.address || l?.shortAddress || '';
      const bedrooms = l?.bedrooms || l?.beds || undefined;
      const bathrooms = l?.bathrooms || l?.baths || undefined;
      const propertyType = l?.propertyType || l?.type || undefined;

      let estimatedRent: number | undefined;
      try {
        // Attempt rent estimate via address; fall back gracefully
        const rentUrl = new URL('https://api.rentcast.io/v1/estimates/rent');
        if (address) rentUrl.searchParams.set('address', address);
        rentUrl.searchParams.set('city', String(l?.city || city));
        rentUrl.searchParams.set('state', String(l?.state || state));
        if (bedrooms) rentUrl.searchParams.set('bedrooms', String(bedrooms));
        if (bathrooms) rentUrl.searchParams.set('bathrooms', String(bathrooms));
        if (propertyType) rentUrl.searchParams.set('propertyType', String(propertyType));

        const rentResp = await fetch(rentUrl.toString(), {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });
        if (rentResp.ok) {
          const rentData = await rentResp.json();
          estimatedRent = Number(rentData?.rent || rentData?.rentEstimate || rentData?.amount || rentData?.estimate);
        } else {
          const errTxt = await rentResp.text();
          console.warn('Rent estimate failed for listing', l?.id, errTxt);
        }
      } catch (e) {
        console.warn('Rent estimate exception', e);
      }

      const listPrice: number = Number(l?.listPrice || l?.price || 0);
      const monthlyRent = estimatedRent && Number.isFinite(estimatedRent) ? estimatedRent : undefined;

      // Basic heuristics
      const capRate = listPrice && monthlyRent ? Number(((monthlyRent * 12) / listPrice) * 100) : undefined;
      // Assume ~40% expense ratio for a quick ROI proxy
      const projectedROI = listPrice && monthlyRent ? Number(((monthlyRent * 12 * 0.6) / listPrice) * 100) : undefined;

      const riskLevel: 'low' | 'medium' | 'high' = capRate
        ? capRate >= 8
          ? 'low'
          : capRate >= 5
            ? 'medium'
            : 'high'
        : 'medium';

      results.push({
        id: String(l?.id || crypto.randomUUID()),
        name: l?.shortAddress || l?.formattedAddress || `${bedrooms || ''}bd ${mapPropertyType(propertyType)}`,
        address: l?.formattedAddress || `${l?.address || ''}, ${l?.city || city}, ${l?.state || state} ${l?.zipCode || ''}`,
        type: mapPropertyType(propertyType),
        price: listPrice || 0,
        estimatedRent: monthlyRent || 0,
        projectedROI: projectedROI ? Number(projectedROI.toFixed(2)) : 0,
        capRate: capRate ? Number(capRate.toFixed(2)) : 0,
        squareFootage: Number(l?.livingArea || l?.squareFeet || 0),
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        yearBuilt: Number(l?.yearBuilt || 0),
        neighborhood: l?.neighborhood || l?.subdivision || l?.city || String(city),
        riskLevel,
        images: Array.isArray(l?.photos) && l.photos.length > 0 ? l.photos.slice(0, 3) : [],
      });
    }

    return new Response(JSON.stringify({ properties: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('rentcast-opportunities error', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
