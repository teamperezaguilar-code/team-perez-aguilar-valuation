export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;

  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({ error: 'A valid address is required' });
  }

  try {
    const url = new URL('https://api.rentcast.io/v1/avm/value');
    url.searchParams.set('address', address.trim());

    const rentcastResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': process.env.RENTCAST_API_KEY
      }
    });

    if (!rentcastResponse.ok) {
      throw new Error(`RentCast returned ${rentcastResponse.status}`);
    }

    const data = await rentcastResponse.json();

    if (data.price == null) {
      return res.status(404).json({ error: 'No estimate available for this address' });
    }

    return res.status(200).json({
      low: data.priceRangeLow,
      high: data.priceRangeHigh,
      value: data.price,
      disclaimer: 'Automated valuation model estimate provided by RentCast. Not an appraisal. Actual market value can only be determined through an in-person evaluation.'
    });

  } catch (err) {
    console.error('Valuation lookup failed:', err);
    return res.status(502).json({ error: 'Unable to retrieve estimate right now' });
  }
}    if (data.price == null) {
      return res.status(404).json({ error: 'No estimate available for this address' });
    }

    return res.status(200).json({
      low: data.priceRangeLow,
      high: data.priceRangeHigh,
      value: data.price,
      disclaimer: 'Automated valuation model estimate provided by RentCast. Not an appraisal. Actual market value can only be determined through an in-person evaluation.'
    });

  } catch (err) {
    console.error('Valuation lookup failed:', err);
    return res.status(502).json({ error: 'Unable to retrieve estimate right now' });
  }
}
