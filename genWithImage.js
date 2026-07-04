/* Submit video with base64 image */
const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = 'sk-4b5e8fc3babbbe20d7a96225c75a86e112ab2ad5122724be';
const CHARS = {
    saber_artoria: { img: 'assets/characters/saber_artoria-removebg-preview.png', prompt: 'Anime 10s attack: The character in the reference image starts in battle stance with golden sword, wind swirling. She charges forward, sword blazing with golden light. She swings the sword overhead in a powerful arc releasing a massive golden divine beam that erupts forward. Victory pose as gold particles rain. Keep EXACT character appearance from reference.' },
    archer_emiya: { img: 'assets/characters/archer_emiya-removebg-preview.png', prompt: 'Anime 10s attack: The character in the reference image projects twin swords from blue energy, dashes forward leaving afterimages, leaps and throws swords that spiral. Hundreds of swords materialize from blue portals behind him raining down like a storm. Lands with new swords forming. Keep EXACT character appearance from reference.' },
    berserker_lancelot: { img: 'assets/characters/lancelot.png', prompt: 'Anime 10s attack: The character in the reference image stands in black smoke, red visor glowing. Dark chains shatter, he lunges drawing crimson sword blazing with red-purple energy. Devastating overhead slash creates shockwave. Massive dark red explosion erupts. Stands amid destruction, smoke clearing. Keep EXACT character appearance from reference.' },
    caster_helewei: { img: 'assets/characters/helewei.png', prompt: 'Anime 10s attack: The character in the reference image raises a glowing white porcelain vessel. Cherry blossom petals swirl around as she chants. The vessel cracks with pink energy then shatters beautifully, releasing magical torrent. A giant glowing rose emblem forms beneath her as petals become razor-sharp projectiles. Elegant ending pose. Keep EXACT character appearance from reference.' },
    lancer_hanxin: { img: 'assets/characters/hanxin.png', prompt: 'Anime 10s attack: The character in the reference image stands atop a hill, purple cape flowing, surveying battlefield. Raises spear and purple banners materialize from mist. Thrusts spear forward commanding spectral soldiers to charge. Purple lightning strikes ground forming chessboard trap grid. Massive purple energy sweeps battlefield. Victorious stance amid settling dust. Keep EXACT character appearance from reference.' }
};

function submit(charId) {
    const ch = CHARS[charId];
    const imgBuf = fs.readFileSync(ch.img);
    const b64 = imgBuf.toString('base64');
    console.log(`[${charId}] image: ${ch.img} (${imgBuf.length} bytes, b64: ${b64.length})`);

    const body = JSON.stringify({
        model: 'grok-video-3',
        duration: 10,
        first_frame_image: `data:image/png;base64,${b64}`,
        prompt: ch.prompt
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.lk888.ai', path: '/v1/media/generate', method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 120000
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                console.log(`[${charId}] RAW(${res.statusCode}):`, d.slice(0, 300));
                try {
                    const j = JSON.parse(d);
                    const tid = j.data?.task_id || j.task_id || '?';
                    resolve({ charId, taskId: tid });
                } catch(e) {
                    console.log(`[${charId}] parse error:`, d.slice(0, 200));
                    resolve(null);
                }
            });
        });
        req.on('error', e => { console.log(`[${charId}] error:`, e.message); resolve(null); });
        req.write(body);
        req.end();
    });
}

async function main() {
    const chars = Object.keys(CHARS);
    const results = [];
    for (const cid of chars) {
        const r = await submit(cid);
        if (r) results.push(r);
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log('\nTask IDs:');
    results.forEach(r => console.log(`  ${r.charId}: ${r.taskId}`));
}

main().catch(e => console.error(e));
