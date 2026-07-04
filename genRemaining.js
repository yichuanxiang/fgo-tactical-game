/*
 * Backward-compatible wrapper for the two older missing-video targets.
 * Uses QIANFUFU_API_KEY from the environment; no key is stored in this file.
 */
const { main } = require('./videoGen');

main([
    process.argv[0],
    __filename,
    '--submit',
    '--poll',
    '--download',
    '--character',
    'caster_helewei,lancer_hanxin',
    ...process.argv.slice(2)
]).catch(err => {
    console.error('Error: ' + err.message);
    process.exit(1);
});
