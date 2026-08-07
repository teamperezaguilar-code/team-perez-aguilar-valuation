// Deploy this as a Vercel serverless function at /api/valuation
// Environment variable (set in Vercel dashboard, never in code):
//   ATTOM_API_KEY  — your ATTOM Cloud trial (or production) API key

export default async function handler(req, res) {
  // Only accept POST requests from the landing page
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;

  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({ error: 'A valid address is required' });
  }

  // ATTOM's AVM endpoint wants the street address and the city/state/zip
  // as two separate parameters. The landing page collects one combined
  // field, so split on the first comma:
  //   "1234 Ventura Blvd, Sherman Oaks, CA" ->
  //   address1 = "1234 Ventura Blvd"
  //   address2 = "Sherman Oaks, CA"
  const trimmed = address.trim();
  const firstComma = trimmed.indexOf(',');
  const address1 = firstComma === -1 ? trimmed : trimmed.slice(0, firstComma).trim();
  const address2 = firstComma === -1 ? '' : trimmed.slice(firstComma + 1).trim();

  try {
    const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail');
    url.searchParams.set('address1', address1);
    url.searchParams.set('address2', address2);

    const attomResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apikey': process.env.ATTOM_API_KEY
      }
    });

    if (!attomResponse.ok) {
      throw new Error(`ATTOM returned ${attomResponse.status}`);
    }

    const data = await attomResponse.json();

    // ATTOM's response nests the value inside property[0].avm.amount
    const propertyRecord = data.property && data.property[0];
    const avmAmount = propertyRecord && propertyRecord.avm && propertyRecord.avm.amount;

    if (!avmAmount || avmAmount.value == null) {
      return res.status(404).json({ error: 'No estimate available for this address' });
    }

    return res.status(200).json({
      low: avmAmount.low,
      high: avmAmount.high,
      value: avmAmount.value,
      disclaimer: 'Automated valuation model estimate provided by ATTOM Data Solutions. Not an appraisal. Actual market value can only be determined through an in-person evaluation.'
    });

  } catch (err) {
    console.error('Valuation lookup failed:', err);
    return res.status(502).json({ error: 'Unable to retrieve estimate right now' });
  }
}
