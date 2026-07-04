/*
 * Lists Qianfufu models that look relevant for video generation.
 * Uses QIANFUFU_API_KEY from the environment; no key is stored in this file.
 */
const https = require('https');

function getJson(urlString, apiKey) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const req = https.get({
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: { Authorization: 'Bearer ' + apiKey },
            timeout: 60000
        }, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                try { resolve(JSON.parse(text)); }
                catch (_) { reject(new Error('Non-JSON response: HTTP ' + res.statusCode + ' ' + text.slice(0, 160))); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Request timed out')));
    });
}

function modelName(model) {
    return model.id || model.model || model.name || '';
}

function isVideoModel(model) {
    const text = JSON.stringify(model).toLowerCase();
    return text.includes('video') || text.includes('视频') || text.includes('i2v') || text.includes('t2v');
}

async function main() {
    const apiKey = process.env.QIANFUFU_API_KEY;
    if (!apiKey) throw new Error('Set QIANFUFU_API_KEY first.');

    const data = await getJson('https://qianfufu.top/v1/models', apiKey);
    const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    const videoModels = list.filter(isVideoModel);

    console.log('Video-like models: ' + videoModels.length + ' / ' + list.length);
    for (const model of videoModels) {
        const name = modelName(model);
        const tags = [
            ...(Array.isArray(model.tags) ? model.tags : []),
            ...(Array.isArray(model.endpoint_types) ? model.endpoint_types : []),
            ...(Array.isArray(model.endpoints) ? model.endpoints : [])
        ].filter(Boolean);
        console.log(name + (tags.length ? ' | ' + tags.join(', ') : ''));
    }
}

main().catch(err => {
    console.error('Error: ' + err.message);
    process.exit(1);
});
