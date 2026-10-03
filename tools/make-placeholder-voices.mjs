// Makes stand-in narration with a built-in Windows voice (Microsoft Zira) for every
// line that has no recording yet, so the game has a real voice everywhere.
// Each file is marked "placeholder": the checklist still lists it as "to record",
// and recording it for real (prepare-narration.mjs) replaces it.
// Letter sounds (snd.*) are skipped: a computer voice can't say a pure sound,
// so those must be recorded by a person (PLAN.md section 13).
// Usage: node tools/make-placeholder-voices.mjs            (only lines with no audio)
//        node tools/make-placeholder-voices.mjs --redo     (also remake existing placeholders)
//        node tools/make-placeholder-voices.mjs <id> ...   (remake just these, e.g. after
//                                                          changing their text)
// Windows only (uses System.Speech). Needs ffmpeg, like prepare-narration.mjs.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VOICE = 'Microsoft Zira Desktop';
const RATE = -1; // a little slower than normal, for young listeners

const args = process.argv.slice(2);
const redo = args.includes('--redo');
const named = args.filter((a) => !a.startsWith('--'));
const root = fileURLToPath(new URL('..', import.meta.url));
const lines = JSON.parse(readFileSync(join(root, 'src/data/narration.json'), 'utf8'));
// A line is ours to (re)make if it has no audio yet or only a stand-in. Lines
// recorded by a person are never touched.
const replaceable = (line) => !line.recorded || line.placeholder;
const PERSON_ONLY = /^snd\./;
const todo = Object.entries(lines)
  .filter(([id]) => !PERSON_ONLY.test(id))
  .filter(([id, line]) => {
    if (named.length) return named.includes(id) && replaceable(line);
    return !line.recorded || (redo && line.placeholder);
  })
  .map(([id, line]) => ({ id, text: line.text }));
const unknown = named.filter((id) => !lines[id]);
if (unknown.length) {
  console.error(`Not in narration.json: ${unknown.join(', ')}`);
  process.exit(1);
}

if (!todo.length) {
  console.log('Every line already has audio.');
  process.exit(0);
}

const work = join(tmpdir(), 'reading-lab-placeholder-voices');
mkdirSync(work, { recursive: true });
const list = todo.map(({ id, text }) => ({ text, out: join(work, `${id}.wav`) }));
writeFileSync(join(work, 'lines.json'), JSON.stringify(list));

// One PowerShell run speaks every line into its own WAV file.
const script = `
Add-Type -AssemblyName System.Speech
$lines = Get-Content -Raw -Encoding UTF8 '${join(work, 'lines.json')}' | ConvertFrom-Json
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.SelectVoice('${VOICE}')
$voice.Rate = ${RATE}
foreach ($line in $lines) {
  $voice.SetOutputToWaveFile($line.out)
  $voice.Speak($line.text)
}
$voice.SetOutputToNull()
$voice.Dispose()
`;
writeFileSync(join(work, 'speak.ps1'), script);
execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(work, 'speak.ps1')], { stdio: 'inherit' });

for (const { id } of todo) {
  execFileSync(process.execPath, [join(root, 'tools/prepare-narration.mjs'), join(work, `${id}.wav`), id, '--placeholder'], { stdio: 'inherit', cwd: root });
}
console.log(`Made ${todo.length} placeholder lines with ${VOICE}.`);
