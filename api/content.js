const jwt = require('jsonwebtoken');

const ALLOWED_SECTIONS = ['gallery', 'events', 'about', 'hours', 'contact', 'menus'];

function verifyToken(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

async function githubApi(path, options = {}) {
    const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${path}`, {
        ...options,
        headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    return { status: res.status, data: await res.json() };
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!verifyToken(req)) {
        return res.status(401).json({ error: 'Neveljavna ali potečena seja. Prijavite se znova.' });
    }

    const section = req.query.section;
    if (!section || !ALLOWED_SECTIONS.includes(section)) {
        return res.status(400).json({ error: 'Neveljavna sekcija. Dovoljene: ' + ALLOWED_SECTIONS.join(', ') });
    }

    const filePath = `content/${section}.json`;

    if (req.method === 'GET') {
        try {
            const { status, data } = await githubApi(filePath);
            if (status !== 200) {
                return res.status(status).json({ error: 'Napaka pri branju iz GitHub', details: data.message });
            }
            const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
            return res.status(200).json({ data: content, sha: data.sha });
        } catch (err) {
            return res.status(500).json({ error: 'Napaka strežnika', details: err.message });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { data: newData, sha } = req.body || {};
            if (!newData || !sha) {
                return res.status(400).json({ error: 'Manjkajo podatki (data) ali SHA' });
            }
            const encoded = Buffer.from(JSON.stringify(newData, null, 2), 'utf-8').toString('base64');
            const { status, data } = await githubApi(filePath, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `Posodobitev ${section} prek admin panela`,
                    content: encoded,
                    sha: sha
                })
            });

            if (status === 200) {
                return res.status(200).json({ success: true, sha: data.content.sha });
            }
            if (status === 409) {
                return res.status(409).json({ error: 'Vsebina je bila medtem spremenjena. Prosim osvežite stran.' });
            }
            return res.status(status).json({ error: 'Napaka pri pisanju na GitHub', details: data.message });
        } catch (err) {
            return res.status(500).json({ error: 'Napaka strežnika', details: err.message });
        }
    }

    return res.status(405).json({ error: 'Metoda ni dovoljena' });
};
