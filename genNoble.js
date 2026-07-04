/*
 * Backward-compatible wrapper.
 * Uses QIANFUFU_API_KEY from the environment; no key is stored in this file.
 */
const { main } = require('./videoGen');

const charId = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'saber_artoria';
const passthrough = process.argv.slice(2).filter(arg => arg !== charId);

main([
    process.argv[0],
    __filename,
    '--submit',
    '--poll',
    '--download',
    '--character',
    charId,
    ...passthrough
]).catch(err => {
    console.error('Error: ' + err.message);
    process.exit(1);
});
