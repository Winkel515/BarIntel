export default async function handler(request, response) {
	const authHeader = request.headers.authorization;
	if (
		process.env.CRON_SECRET &&
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return response.status(401).json({ ok: false, error: 'Unauthorized' });
	}

	const supabaseUrl = process.env.VITE_SUPABASE_URL;
	const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		return response.status(500).json({
			ok: false,
			error: 'Missing Supabase environment variables.',
		});
	}

	const url = new URL('/rest/v1/workouts', supabaseUrl);
	url.searchParams.set('select', 'id');
	url.searchParams.set('limit', '1');

	const supabaseResponse = await fetch(url, {
		headers: {
			apikey: supabaseKey,
			Authorization: `Bearer ${supabaseKey}`,
		},
	});

	if (!supabaseResponse.ok) {
		return response.status(502).json({
			ok: false,
			status: supabaseResponse.status,
			error: await supabaseResponse.text(),
		});
	}

	return response.status(200).json({ ok: true });
}
