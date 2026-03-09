const jwt = require('jsonwebtoken');

function verifyToken(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Metoda ni dovoljena' });
    }

    if (!verifyToken(req)) {
        return res.status(401).json({ error: 'Neveljavna ali potečena seja.' });
    }

    const apiKey = process.env.BUNNY_STORAGE_API_KEY;
    const storageZone = 'kavarna-skocjan';
    const cdnBase = 'https://kavarna-skocjan.b-cdn.net';

    if (!apiKey) {
        return res.status(500).json({ error: 'BUNNY_STORAGE_API_KEY ni nastavljen.' });
    }

    const filename = req.query.filename;
    if (!filename) {
        return res.status(400).json({ error: 'Manjka parameter filename.' });
    }

    // Sanitize filename - only allow safe characters
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeFilename || safeFilename.startsWith('.')) {
        return res.status(400).json({ error: 'Neveljavno ime datoteke.' });
    }

    const storagePath = `UPLOAD/${safeFilename}`;

    try {
        // Read raw body as buffer
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);

        if (body.length === 0) {
            return res.status(400).json({ error: 'Prazna datoteka.' });
        }

        if (body.length > 10 * 1024 * 1024) {
            return res.status(413).json({ error: 'Datoteka je prevelika (max 10 MB).' });
        }

        // Upload to Bunny Storage
        const uploadRes = await fetch(
            `https://storage.bunnycdn.com/${storageZone}/${storagePath}`,
            {
                method: 'PUT',
                headers: {
                    'AccessKey': apiKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: body
            }
        );

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            return res.status(502).json({ error: 'Bunny upload ni uspel.', details: errorText });
        }

        const publicUrl = `${cdnBase}/${storagePath}`;
        return res.status(200).json({ url: publicUrl, filename: safeFilename });

    } catch (err) {
        return res.status(500).json({ error: 'Napaka strežnika', details: err.message });
    }
};
