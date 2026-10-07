import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');

test('Interface V2.2 : visuel validé et ressources locales présentes',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(html,/V2\.2 web · bilan fiscal \+ contrôles/);
 assert.match(css,/dashboard-visual-v2\.png/);
 assert.match(css,/--pink:#ff639d/);
 assert.match(css,/--mint:#55efda/);
 await access(path.join(root,'assets','dashboard-visual-v2.png'));
 await access(path.join(root,'assets','crowd-applause-and-cheering-237756-5s.mp3'));
});

test('Interface V2.2 : les sept onglets restent dans l’ordre validé',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const bank=await readFile(path.join(root,'reconciliation-ui.mjs'),'utf8');
 const nav=html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1]??'';
 const base=[...nav.matchAll(/<button data-view="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(base,['dashboard','expenses','revenues','calculator','settings']);
 assert.match(bank,/dataset\.view='bank'/);
 assert.match(bank,/insertBefore\(nav,document\.querySelector\('nav \[data-view=calculator\]'\)\)/);
 assert.match(app,/dataset\.view='reports'/);
 assert.match(app,/insertBefore\(reportNav,document\.querySelector\('nav \[data-view=settings\]'\)\)/);
 assert.match(app,/view\('dashboard'\)/);
});

test('Dashboard : les panneaux principaux restent repliables',async()=>{
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(app,/makeCollapsible\(\$\('\.chart-panel'\),'dashboard-stats-content'\)/);
 assert.match(app,/makeCollapsible\(\$\('\.dashboard-calculator'\),'dashboard-calculator-content'\)/);
 assert.match(app,/makeCollapsible\(controlsPanel,'controls-content'\)/);
 assert.match(css,/\.panel-toggle\[aria-expanded="false"\]::before/);
 assert.match(css,/\.collapsible-body\[hidden\]/);
 assert.match(css,/\.lower\{[^}]*align-items:start/);
});

test('Bilan : les blocs fiscaux restent lisibles à l’impression',async()=>{
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(app,/Provisions de la période/);
 assert.match(app,/Enveloppes cumulées/);
 assert.match(app,/Estimations de pilotage basées sur les saisies de la période/);
 assert.match(app,/Cumul annuel jusqu’au dernier jour consulté/);
 assert.match(css,/body\.printing-report #period-report \.report-fiscal\{background:white!important;border-color:#999!important\}/);
});

test('Contrôles : le Dashboard signale aussi les pointages en attente',async()=>{
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(app,/import \{bankRows\} from '\.\/reconciliation\.mjs'/);
 assert.match(app,/Doublons potentiels, justificatifs manquants et pointages en attente/);
 assert.match(app,/controlLine\('Pointage'/);
 assert.match(app,/control-badge/);
 assert.match(app,/Ouvrir le rapprochement/);
 assert.match(app,/ni pointage en attente détecté/);
 assert.match(css,/\.control-badge/);
});
