import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const outDir = path.join(workspaceRoot, 'public', 'project-logos');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. apexmind-ai
const apexSource = path.join(workspaceRoot, 'Soul-DevPortal-Projects/apexmind-ai/public/apexmind-logo.png');
if (fs.existsSync(apexSource)) {
  fs.copyFileSync(apexSource, path.join(outDir, 'apexmind-ai.png'));
}

// 2. sonikoma
const soniSource = path.join(workspaceRoot, 'Soul-DevPortal-Projects/sonikoma/browser-extension/icons/icon-128.png');
if (fs.existsSync(soniSource)) {
  fs.copyFileSync(soniSource, path.join(outDir, 'sonikoma.png'));
}

// 3. postcraft-ai
const postSource = path.join(workspaceRoot, 'Soul-DevPortal-Projects/postcraft-ai/public/logo.svg');
if (fs.existsSync(postSource)) {
  fs.copyFileSync(postSource, path.join(outDir, 'postcraft-ai.svg'));
}

// 4. free-api-hub
const freeSource = path.join(workspaceRoot, 'Soul-DevPortal-Projects/free-api-hub/frontend/public/logo.png');
if (fs.existsSync(freeSource)) {
  fs.copyFileSync(freeSource, path.join(outDir, 'free-api-hub.png'));
}

// 5. outpass-system
const outpassSource = path.join(workspaceRoot, 'Soul-DevPortal-Projects/outpass-system/frontend/public/pwa-192x192.png');
if (fs.existsSync(outpassSource)) {
  fs.copyFileSync(outpassSource, path.join(outDir, 'outpass-system.png'));
}

// 6. college-management-system (Modern academic campus SVG)
const collegeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none">
  <rect width="100" height="100" rx="22" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-width="2" stroke-opacity="0.5"/>
  <path d="M50 24L18 40L50 56L82 40L50 24Z" fill="#10b981" fill-opacity="0.3" stroke="#34d399" stroke-width="3" stroke-linejoin="round"/>
  <path d="M28 47V67C28 67 36 76 50 76C64 76 72 67 72 67V47" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M82 42V64" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round"/>
  <circle cx="82" cy="67" r="3" fill="#6ee7b7"/>
</svg>`;
fs.writeFileSync(path.join(outDir, 'college-management-system.svg'), collegeSvg, 'utf8');

// 7. globalpulse-ai (AI World Pulse Radar SVG)
const pulseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none">
  <rect width="100" height="100" rx="22" fill="#06b6d4" fill-opacity="0.18" stroke="#06b6d4" stroke-width="2" stroke-opacity="0.5"/>
  <circle cx="50" cy="50" r="28" stroke="#22d3ee" stroke-width="2" stroke-opacity="0.6" stroke-dasharray="4 3"/>
  <circle cx="50" cy="50" r="16" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="50" cy="50" r="6" fill="#38bdf8"/>
  <path d="M20 50H36L42 34L50 66L58 42L64 50H80" stroke="#00f2fe" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
fs.writeFileSync(path.join(outDir, 'globalpulse-ai.svg'), pulseSvg, 'utf8');

// 8. spatial-dimensions (3D Isometric Hypercube Portal SVG)
const spatialSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none">
  <rect width="100" height="100" rx="22" fill="#8b5cf6" fill-opacity="0.18" stroke="#8b5cf6" stroke-width="2" stroke-opacity="0.5"/>
  <path d="M50 20L78 36V68L50 84L22 68V36L50 20Z" stroke="#a78bfa" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M50 52L78 36M50 52V84M50 52L22 36" stroke="#c4b5fd" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="50" cy="52" r="5" fill="#ec4899"/>
  <path d="M38 42L50 49L62 42" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(outDir, 'spatial-dimensions.svg'), spatialSvg, 'utf8');

console.log('Project logos ready:');
console.log(fs.readdirSync(outDir));
