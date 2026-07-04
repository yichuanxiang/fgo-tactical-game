/*
 * Qianfufu noble-video generator.
 *
 * API key is read from QIANFUFU_API_KEY. Do not hard-code it here.
 *
 * Dry run:
 *   node videoGen.js --dry-run --public-base-url https://your-domain/game
 *
 * Submit, poll and download:
 *   set QIANFUFU_API_KEY=...
 *   node videoGen.js --submit --poll --download --public-base-url https://your-domain/game
 */
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const API_BASE = 'https://qianfufu.top/v1';
const CREATE_PATH = '/video/create';
const QUERY_PATH = '/video/query';
const DEFAULT_MODEL = 'MiniMax-Hailuo-2.3';
const DEFAULT_TASK_FILE = path.join(__dirname, 'assets', 'nobles', 'qianfufu_tasks.json');
const DEFAULT_OUTPUT_DIR = path.join(__dirname, 'assets', 'nobles');
const DEFAULT_MIRROR_DIR = path.join(__dirname, 'www', 'assets', 'nobles');

const CHARACTERS = {
    saber_artoria: {
        displayName: 'Saber Artoria',
        nobleName: 'Excalibur',
        referencePath: 'assets/characters/saber_artoria-removebg-preview.png',
        prompt: [
            'Anime game ultimate attack video, 6 seconds.',
            'Use the reference image as the exact character identity and costume base.',
            'Saber Artoria lifts a holy golden sword, a massive Excalibur beam tears across a dark battlefield,',
            'blue armor rim light, gold particles, cinematic camera push-in, dramatic wind, high contrast, clean 2D anime finish.',
            'Keep the face and outfit consistent with the reference image. No subtitles, no UI, no watermark.'
        ].join(' ')
    },
    archer_emiya: {
        displayName: 'Archer Emiya',
        nobleName: 'Unlimited Blade Works',
        referencePath: 'assets/characters/archer_emiya-removebg-preview.png',
        prompt: [
            'Anime game ultimate attack video, 6 seconds.',
            'Use the reference image as the exact character identity and costume base.',
            'Archer Emiya stands in a red wasteland reality marble, endless swords rise from cracked ground,',
            'giant bronze gears rotate in a burning sky, blades streak forward in a storm, ember particles, cinematic pan.',
            'Keep the face and outfit consistent with the reference image. No subtitles, no UI, no watermark.'
        ].join(' ')
    },
    caster_helewei: {
        displayName: 'Caster Helewei',
        nobleName: 'Porcelain Rose Burst',
        referencePath: 'assets/characters/helewei.png',
        prompt: [
            'Anime game ultimate attack video, 6 seconds.',
            'Use the reference image as the exact character identity and costume base.',
            'A graceful caster releases a porcelain-and-rose spell, white porcelain shards bloom into pink crimson magic,',
            'rose sword sigils circle the target, petals and glass-like fragments whirl through soft light, elegant but dangerous.',
            'Keep the face and outfit consistent with the reference image. No subtitles, no UI, no watermark.'
        ].join(' ')
    },
    berserker_lancelot: {
        displayName: 'Berserker Lancelot',
        nobleName: 'Arondight Overload',
        referencePath: 'assets/characters/lancelot.png',
        prompt: [
            'Anime game ultimate attack video, 6 seconds.',
            'Use the reference image as the exact character identity and armor base.',
            'A black knight berserker breaks glowing chains, purple lightning and crimson energy overload the sword,',
            'smoke spirals around heavy armor, violent camera shake, dark metal sparks, final explosive slash.',
            'Keep the silhouette and armor consistent with the reference image. No subtitles, no UI, no watermark.'
        ].join(' ')
    },
    lancer_hanxin: {
        displayName: 'Lancer Hanxin',
        nobleName: 'Unrivaled General',
        referencePath: 'assets/characters/hanxin.png',
        prompt: [
            'Anime game ultimate attack video, 6 seconds.',
            'Use the reference image as the exact character identity and costume base.',
            'A legendary strategist-general commands a purple battlefield formation, spectral banners and troops emerge from mist,',
            'a glowing chessboard trap grid spreads under enemies, golden command aura, decisive spear gesture, epic war-drama framing.',
            'Keep the face and outfit consistent with the reference image. No subtitles, no UI, no watermark.'
        ].join(' ')
    }
};

function parseArgs(argv) {
    const opts = {
        apiBase: API_BASE,
        model: DEFAULT_MODEL,
        provider: 'auto',
        imageField: '',
        duration: 6,
        resolution: '',
        publicBaseUrl: '',
        imageUrls: {},
        embedLocalImages: false,
        uploadReferences: false,
        uploadService: 'uguu',
        extra: {},
        characters: [],
        submit: false,
        dryRun: true,
        poll: false,
        download: false,
        intervalSec: 15,
        maxWaitSec: 900,
        taskFile: DEFAULT_TASK_FILE,
        outputDir: DEFAULT_OUTPUT_DIR,
        mirrorDir: DEFAULT_MIRROR_DIR
    };

    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        const next = () => argv[++i];
        switch (arg) {
            case '--help':
            case '-h':
                opts.help = true;
                break;
            case '--submit':
                opts.submit = true;
                opts.dryRun = false;
                break;
            case '--dry-run':
                opts.dryRun = true;
                opts.submit = false;
                break;
            case '--poll':
                opts.poll = true;
                opts.dryRun = false;
                break;
            case '--download':
                opts.download = true;
                opts.poll = true;
                opts.dryRun = false;
                break;
            case '--character':
            case '--char':
                opts.characters.push(...String(next() || '').split(',').map(s => s.trim()).filter(Boolean));
                break;
            case '--model':
                opts.model = next();
                break;
            case '--provider':
                opts.provider = next();
                break;
            case '--api-base':
                opts.apiBase = trimSlash(next());
                break;
            case '--public-base-url':
                opts.publicBaseUrl = trimSlash(next());
                break;
            case '--image-url': {
                const pair = next() || '';
                const eq = pair.indexOf('=');
                if (eq === -1) throw new Error('--image-url expects char_id=https://...');
                opts.imageUrls[pair.slice(0, eq)] = pair.slice(eq + 1);
                break;
            }
            case '--embed-local-images':
                opts.embedLocalImages = true;
                break;
            case '--upload-references':
                opts.uploadReferences = true;
                break;
            case '--upload-service':
                opts.uploadService = next();
                break;
            case '--image-field':
                opts.imageField = next();
                break;
            case '--duration':
                opts.duration = Number(next());
                break;
            case '--resolution':
                opts.resolution = next();
                break;
            case '--extra-json':
                opts.extra = JSON.parse(next() || '{}');
                break;
            case '--interval':
                opts.intervalSec = Number(next());
                break;
            case '--max-wait':
                opts.maxWaitSec = Number(next());
                break;
            case '--task-file':
                opts.taskFile = path.resolve(next());
                break;
            case '--output-dir':
                opts.outputDir = path.resolve(next());
                break;
            case '--mirror-dir':
                opts.mirrorDir = path.resolve(next());
                break;
            case '--no-mirror-www':
                opts.mirrorDir = '';
                break;
            default:
                if (arg.startsWith('-')) throw new Error('Unknown option: ' + arg);
                opts.characters.push(...arg.split(',').map(s => s.trim()).filter(Boolean));
                break;
        }
    }

    if (!opts.characters.length) opts.characters = Object.keys(CHARACTERS);
    return opts;
}

function printHelp() {
    console.log([
        'Usage:',
        '  node videoGen.js --dry-run --public-base-url https://your-domain/game',
        '  node videoGen.js --submit --poll --download --public-base-url https://your-domain/game',
        '',
        'Options:',
        '  --character saber_artoria,archer_emiya   Limit characters',
        '  --public-base-url URL                    Base URL used for reference images',
        '  --image-url char_id=URL                  Override one reference image URL',
        '  --embed-local-images                     Use data URLs from local avatar files',
        '  --upload-references                      Upload local avatar files before submit',
        '  --upload-service uguu                    Default: uguu',
        '  --model NAME                             Default: ' + DEFAULT_MODEL,
        '  --provider auto|minimax|openai-video|doubao|seedance2|tencentvod|veo  Default: auto',
        '  --image-field NAME                       Default: auto by provider',
        '  --duration N                             Default: 6',
        '  --resolution VALUE                       Optional provider value, for example 768P',
        '  --extra-json JSON                        Extra fields merged into create payload',
        '  --poll --download                        Query task status and save mp4 files',
        '  --mirror-dir PATH                        Also copy downloads here; default: www/assets/nobles',
        '  --no-mirror-www                         Disable the default www mirror copy',
        '',
        'Output videos are saved as assets/nobles/<char_id>.mp4.'
    ].join('\n'));
}

function trimSlash(value) {
    return String(value || '').replace(/\/+$/, '');
}

function toPublicUrl(base, relPath) {
    const clean = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
    return trimSlash(base) + '/' + clean.split('/').map(encodeURIComponent).join('/');
}

function mimeForFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.webp') return 'image/webp';
    return 'image/png';
}

function localImageDataUrl(relPath) {
    const filePath = path.join(__dirname, relPath);
    const data = fs.readFileSync(filePath);
    return 'data:' + mimeForFile(filePath) + ';base64,' + data.toString('base64');
}

function tencentVodConfig(model) {
    const configs = {
        'aigc-video-kling-3.0': {
            modelName: 'Kling',
            modelVersion: '3.0',
            resolution: '720P',
            duration: 5,
            aspectRatio: '16:9',
            supportsImage: true
        },
        'aigc-video-kling-2.6': {
            modelName: 'Kling',
            modelVersion: '2.6',
            resolution: '720P',
            duration: 5,
            aspectRatio: '16:9',
            supportsImage: true
        },
        'aigc-video-hailuo-02': {
            modelName: 'Hailuo',
            modelVersion: '02',
            resolution: '768P',
            duration: 6,
            supportsImage: true
        },
        'aigc-video-sora-2.0': {
            modelName: 'OS',
            modelVersion: '2.0',
            resolution: '720P',
            duration: 4,
            aspectRatio: '16:9',
            supportsImage: false
        }
    };
    return configs[model] || null;
}

function providerFor(opts) {
    const explicit = String(opts.provider || 'auto').toLowerCase();
    if (explicit !== 'auto') return explicit;
    if (/^(minimax-|MiniMax-|S2V-)/.test(opts.model)) return 'minimax';
    if (/^aigc-video-/i.test(opts.model)) return 'tencentvod';
    if (/^doubao-seedance-2-/i.test(opts.model)) return 'seedance2';
    if (/^doubao-seedance-/i.test(opts.model)) return 'doubao';
    if (/^(sora-2|kling-v3|wan-2\.6)$/i.test(opts.model)) return 'openai-video';
    return 'veo';
}

function imageFieldFor(opts) {
    if (opts.imageField) return opts.imageField;
    if (providerFor(opts) === 'minimax') return 'first_frame_image';
    if (providerFor(opts) === 'openai-video') return 'image_url';
    if (providerFor(opts) === 'doubao' || providerFor(opts) === 'seedance2') return 'image_url';
    if (providerFor(opts) === 'tencentvod') return 'file_infos';
    return providerFor(opts) === 'minimax' ? 'first_frame_image' : 'image_url';
}

function apiOrigin(opts) {
    return new URL(opts.apiBase).origin;
}

function createUrlFor(opts) {
    if (providerFor(opts) === 'minimax') return apiOrigin(opts) + '/minimax/v1/video_generation';
    if (providerFor(opts) === 'openai-video') return opts.apiBase + '/videos';
    if (providerFor(opts) === 'doubao') return apiOrigin(opts) + '/volc/v1/contents/generations/tasks';
    if (providerFor(opts) === 'seedance2') return apiOrigin(opts) + '/api/v3/contents/generations/tasks';
    if (providerFor(opts) === 'tencentvod') return apiOrigin(opts) + '/tencent-vod/v1/aigc-video';
    return opts.apiBase + CREATE_PATH;
}

function queryUrlFor(opts, taskId) {
    if (providerFor(opts) === 'minimax') {
        return apiOrigin(opts) + '/minimax/v1/query/video_generation?task_id=' + encodeURIComponent(taskId);
    }
    if (providerFor(opts) === 'openai-video') {
        return opts.apiBase + '/videos/' + encodeURIComponent(taskId);
    }
    if (providerFor(opts) === 'doubao') {
        return apiOrigin(opts) + '/volc/v1/contents/generations/tasks/' + encodeURIComponent(taskId);
    }
    if (providerFor(opts) === 'seedance2') {
        return apiOrigin(opts) + '/api/v3/contents/generations/tasks/' + encodeURIComponent(taskId);
    }
    if (providerFor(opts) === 'tencentvod') {
        return apiOrigin(opts) + '/tencent-vod/v1/query/' + encodeURIComponent(taskId);
    }
    return opts.apiBase + QUERY_PATH + '?id=' + encodeURIComponent(taskId);
}

function getReferenceUrl(charId, data, opts) {
    if (opts.imageUrls[charId]) return opts.imageUrls[charId];
    if (opts.embedLocalImages) return localImageDataUrl(data.referencePath);
    if (opts.publicBaseUrl) return toPublicUrl(opts.publicBaseUrl, data.referencePath);
    return '';
}

function printablePayload(payload, imageField) {
    const copy = { ...payload };
    const value = copy[imageField];
    if (typeof value === 'string' && value.startsWith('data:')) {
        const comma = value.indexOf(',');
        const prefix = comma >= 0 ? value.slice(0, comma + 1) : 'data:';
        copy[imageField] = prefix + '<base64 ' + value.length + ' chars>';
    }
    return copy;
}

function buildPayload(charId, opts) {
    const data = CHARACTERS[charId];
    if (!data) throw new Error('Unknown character: ' + charId);

    const referenceUrl = getReferenceUrl(charId, data, opts);
    const provider = providerFor(opts);
    const imageField = imageFieldFor(opts);
    let payload = {
        model: opts.model,
        prompt: data.prompt,
        duration: opts.duration
    };

    if (provider === 'openai-video') {
        payload = {
            model: opts.model,
            prompt: data.prompt,
            size: opts.resolution || '1280x720',
            seconds: String(opts.duration || 5)
        };
        if (referenceUrl) payload[imageField] = referenceUrl;
    } else if (provider === 'doubao' || provider === 'seedance2') {
        payload = {
            model: opts.model,
            content: [{ type: 'text', text: data.prompt }],
            size: opts.resolution || '1280x720',
            duration: opts.duration || 5
        };
        if (referenceUrl) {
            payload.content.push({
                type: 'image_url',
                image_url: { url: referenceUrl },
                role: 'first_frame'
            });
        }
    } else if (provider === 'minimax') {
        payload.resolution = opts.resolution || '768P';
        payload.prompt_optimizer = true;
        if (referenceUrl) payload[imageField] = referenceUrl;
    } else if (provider === 'tencentvod') {
        const config = tencentVodConfig(opts.model) || {
            modelName: opts.model,
            modelVersion: '',
            resolution: opts.resolution || '720P',
            duration: opts.duration || 5,
            aspectRatio: '16:9',
            supportsImage: true
        };
        payload = {
            model_name: config.modelName,
            model_version: config.modelVersion,
            prompt: data.prompt,
            output_config: {
                resolution: opts.resolution || config.resolution || '720P',
                duration: opts.duration || config.duration || 5
            }
        };
        if (opts.extra.aspect_ratio || config.aspectRatio) {
            payload.output_config.aspect_ratio = opts.extra.aspect_ratio || config.aspectRatio;
        }
        if (referenceUrl && config.supportsImage !== false) {
            payload.file_infos = [{ type: 'url', category: 'Image', url: referenceUrl }];
        }
    } else if (opts.resolution) {
        payload.resolution = opts.resolution;
        if (referenceUrl) payload[imageField] = referenceUrl;
    } else {
        if (referenceUrl) payload[imageField] = referenceUrl;
    }

    Object.assign(payload, opts.extra);

    return { data, referenceUrl, payload };
}

function requestJson(method, urlString, apiKey, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const bodyText = body ? JSON.stringify(body) : '';
        const client = url.protocol === 'http:' ? http : https;
        const req = client.request({
            method,
            hostname: url.hostname,
            port: url.port || undefined,
            path: url.pathname + url.search,
            headers: {
                Authorization: 'Bearer ' + apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyText)
            },
            timeout: 120000
        }, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                let parsed = null;
                try { parsed = text ? JSON.parse(text) : null; } catch (_) {}
                resolve({ status: res.statusCode, headers: res.headers, text, json: parsed });
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy(new Error('Request timed out: ' + method + ' ' + urlString));
        });
        if (bodyText) req.write(bodyText);
        req.end();
    });
}

function downloadFile(urlString, outPath, apiKey, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const client = url.protocol === 'http:' ? http : https;
        const req = client.get({
            hostname: url.hostname,
            port: url.port || undefined,
            path: url.pathname + url.search,
            headers: apiKey ? { Authorization: 'Bearer ' + apiKey } : {},
            timeout: 180000
        }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
                res.resume();
                const nextUrl = new URL(res.headers.location, urlString).toString();
                downloadFile(nextUrl, outPath, apiKey, redirectsLeft - 1).then(resolve, reject);
                return;
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
                res.resume();
                reject(new Error('Download failed HTTP ' + res.statusCode + ': ' + urlString));
                return;
            }
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            const file = fs.createWriteStream(outPath);
            res.pipe(file);
            file.on('finish', () => file.close(() => resolve(outPath)));
            file.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Download timed out: ' + urlString)));
    });
}

function uploadReferenceToUguu(filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.readFileSync(filePath);
        const filename = path.basename(filePath).replace(/"/g, '');
        const boundary = '----fatebattle-' + Date.now().toString(16) + Math.random().toString(16).slice(2);
        const head = Buffer.from(
            '--' + boundary + '\r\n' +
            'Content-Disposition: form-data; name="files[]"; filename="' + filename + '"\r\n' +
            'Content-Type: ' + mimeForFile(filePath) + '\r\n\r\n'
        );
        const tail = Buffer.from('\r\n--' + boundary + '--\r\n');
        const body = Buffer.concat([head, file, tail]);

        const req = https.request({
            method: 'POST',
            hostname: 'uguu.se',
            path: '/upload.php',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Content-Length': body.length
            },
            timeout: 120000
        }, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                let parsed = null;
                try { parsed = JSON.parse(text); } catch (_) {}
                const url = parsed?.files?.[0]?.url;
                if (res.statusCode >= 200 && res.statusCode < 300 && url) {
                    resolve(String(url).replace(/\\\//g, '/'));
                } else {
                    reject(new Error('Reference upload failed HTTP ' + res.statusCode + ': ' + text.slice(0, 240)));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Reference upload timed out')));
        req.write(body);
        req.end();
    });
}

async function ensureUploadedReference(charId, data, opts) {
    if (!opts.uploadReferences || opts.imageUrls[charId] || opts.publicBaseUrl || opts.embedLocalImages) return;
    if (opts.uploadService !== 'uguu') throw new Error('Unsupported upload service: ' + opts.uploadService);
    const filePath = path.join(__dirname, data.referencePath);
    console.log('[' + charId + '] uploading reference image: ' + data.referencePath);
    opts.imageUrls[charId] = await uploadReferenceToUguu(filePath);
    console.log('[' + charId + '] reference url: ' + opts.imageUrls[charId]);
}

function extractTaskId(value) {
    if (!value || typeof value !== 'object') return '';
    return value.id || value.task_id || value.taskId ||
        value.Response?.TaskId ||
        value.data?.id || value.data?.task_id || value.data?.taskId ||
        value.generated_assets?.task_id || '';
}

function extractStatus(value) {
    if (!value || typeof value !== 'object') return '';
    if (value.Response?.Error) return 'failed';
    const aigcTask = value.Response?.AigcVideoTask;
    if (aigcTask) {
        if (Number(aigcTask.ErrCode || 0) !== 0) return 'failed';
        if (aigcTask.Status === 'FINISH') return 'success';
        return String(aigcTask.Status || value.Response?.Status || '').toLowerCase();
    }
    return String(value.status || value.state || value.Response?.Status || value.data?.status || value.data?.state || '').toLowerCase();
}

function findVideoUrl(value) {
    const seen = new Set();
    const keys = ['video_url', 'videoUrl', 'VideoUrl', 'download_url', 'downloadUrl', 'file_url', 'fileUrl', 'FileUrl', 'url', 'content_url'];

    function walk(node) {
        if (!node || seen.has(node)) return '';
        if (typeof node === 'string') {
            if (/^https?:\/\/.+\.(mp4|webm|mov)(\?|$)/i.test(node)) return node;
            if (/^https?:\/\/.+\/(content|download)(\?|$)/i.test(node)) return node;
            return '';
        }
        if (typeof node !== 'object') return '';
        seen.add(node);

        for (const key of keys) {
            const found = walk(node[key]);
            if (found) return found;
        }
        for (const child of Object.values(node)) {
            const found = walk(child);
            if (found) return found;
        }
        return '';
    }

    return walk(value);
}

function isDone(status) {
    return ['success', 'succeeded', 'complete', 'completed', 'finish', 'finished'].includes(status);
}

function isFailed(status) {
    return ['error', 'failed', 'fail', 'cancelled', 'canceled'].includes(status);
}

function readTasks(taskFile) {
    if (!fs.existsSync(taskFile)) return {};
    try { return JSON.parse(fs.readFileSync(taskFile, 'utf8')); }
    catch (_) { return {}; }
}

function writeTasks(taskFile, tasks) {
    fs.mkdirSync(path.dirname(taskFile), { recursive: true });
    fs.writeFileSync(taskFile, JSON.stringify(tasks, null, 2) + '\n');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitOne(charId, opts, apiKey, tasks) {
    const charData = CHARACTERS[charId];
    if (charData && !opts.dryRun) await ensureUploadedReference(charId, charData, opts);
    const { data, referenceUrl, payload } = buildPayload(charId, opts);
    const imageField = imageFieldFor(opts);
    const task = tasks[charId] || {};
    task.character = charId;
    task.displayName = data.displayName;
    task.nobleName = data.nobleName;
    task.referencePath = data.referencePath;
    task.referenceUrl = referenceUrl && referenceUrl.startsWith('data:') ? '<embedded local image data URL>' : referenceUrl || null;
    task.model = opts.model;
    task.provider = providerFor(opts);
    task.payload = printablePayload(payload, imageField);
    task.updatedAt = new Date().toISOString();

    if (opts.dryRun) {
        console.log('\n[' + charId + '] dry-run payload:');
        console.log('POST ' + createUrlFor(opts));
        console.log(JSON.stringify(printablePayload(payload, imageField), null, 2));
        tasks[charId] = task;
        return '';
    }

    if (!referenceUrl) {
        throw new Error('Missing public reference image URL for ' + charId + '. Use --public-base-url or --image-url ' + charId + '=https://...');
    }

    console.log('\n[' + charId + '] submitting to ' + createUrlFor(opts) + ' ...');
    const result = await requestJson('POST', createUrlFor(opts), apiKey, payload);
    task.createStatusCode = result.status;
    task.createResponse = result.json || result.text;
    task.updatedAt = new Date().toISOString();

    const taskId = extractTaskId(result.json);
    if (!taskId) {
        tasks[charId] = task;
        writeTasks(opts.taskFile, tasks);
        throw new Error('No task id returned for ' + charId + ': HTTP ' + result.status + ' ' + result.text.slice(0, 240));
    }

    task.id = taskId;
    task.status = extractStatus(result.json) || 'submitted';
    tasks[charId] = task;
    writeTasks(opts.taskFile, tasks);
    console.log('[' + charId + '] task id: ' + taskId);
    return taskId;
}

async function pollOne(charId, opts, apiKey, tasks) {
    const task = tasks[charId];
    if (!task || !task.id) {
        console.log('[' + charId + '] no task id to poll');
        return;
    }

    const started = Date.now();
    const queryUrl = queryUrlFor(opts, task.id);
    while (Date.now() - started <= opts.maxWaitSec * 1000) {
        const result = await requestJson('GET', queryUrl, apiKey);
        task.queryStatusCode = result.status;
        task.queryResponse = result.json || result.text;
        task.updatedAt = new Date().toISOString();

        const status = extractStatus(result.json);
        if (status) task.status = status;
        const videoUrl = findVideoUrl(result.json);
        if (videoUrl) task.videoUrl = videoUrl;
        tasks[charId] = task;
        writeTasks(opts.taskFile, tasks);

        console.log('[' + charId + '] status: ' + (task.status || 'unknown') + ' HTTP ' + result.status);

        if (videoUrl && (isDone(task.status) || task.status === '')) {
            if (opts.download) {
                const outPath = path.join(opts.outputDir, charId + '.mp4');
                await downloadFile(videoUrl, outPath, apiKey);
                task.outputPath = path.relative(__dirname, outPath).replace(/\\/g, '/');
                if (opts.mirrorDir) {
                    const mirrorPath = path.join(opts.mirrorDir, charId + '.mp4');
                    if (path.resolve(mirrorPath) !== path.resolve(outPath)) {
                        fs.mkdirSync(path.dirname(mirrorPath), { recursive: true });
                        fs.copyFileSync(outPath, mirrorPath);
                        task.mirrorPath = path.relative(__dirname, mirrorPath).replace(/\\/g, '/');
                    }
                }
                task.status = task.status || 'downloaded';
                task.updatedAt = new Date().toISOString();
                tasks[charId] = task;
                writeTasks(opts.taskFile, tasks);
                console.log('[' + charId + '] saved: ' + task.outputPath);
                if (task.mirrorPath) console.log('[' + charId + '] mirrored: ' + task.mirrorPath);
            }
            return;
        }

        if (isFailed(task.status)) {
            console.log('[' + charId + '] failed; see ' + path.relative(__dirname, opts.taskFile));
            return;
        }

        await sleep(opts.intervalSec * 1000);
    }

    console.log('[' + charId + '] polling timed out; task id kept in ' + path.relative(__dirname, opts.taskFile));
}

async function main(argv = process.argv) {
    const opts = parseArgs(argv);
    if (opts.help) {
        printHelp();
        return;
    }

    const unknown = opts.characters.filter(id => !CHARACTERS[id]);
    if (unknown.length) throw new Error('Unknown character(s): ' + unknown.join(', '));

    const tasks = readTasks(opts.taskFile);
    const apiKey = process.env.QIANFUFU_API_KEY || '';
    if (!opts.dryRun && !apiKey) {
        throw new Error('Set QIANFUFU_API_KEY before using --submit or --poll.');
    }

    fs.mkdirSync(opts.outputDir, { recursive: true });

    for (const charId of opts.characters) {
        if (opts.submit || opts.dryRun) {
            await submitOne(charId, opts, apiKey, tasks);
        }
        if (opts.poll && !opts.dryRun) {
            await pollOne(charId, opts, apiKey, tasks);
        }
    }

    writeTasks(opts.taskFile, tasks);
}

if (require.main === module) {
    main().catch(err => {
        console.error('Error: ' + err.message);
        process.exit(1);
    });
}

module.exports = { CHARACTERS, buildPayload, main };
