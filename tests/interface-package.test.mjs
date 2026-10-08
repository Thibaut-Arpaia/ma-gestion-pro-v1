import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');

test('Interface V3 : visuel validé et ressources locales présentes',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(html,/V4 web · fond personnalisable · copie complète/);
 assert.match(html,/class="muted version-note"/);
 assert.doesNotMatch(html,/class="dashboard-title"/);
 assert.doesNotMatch(html,/class="scope"/);
 assert.match(css,/dashboard-background-v3\.png/);
 assert.match(css,/dashboard-visual-v2\.png/);
 assert.match(css,/V3 — direction validee/);
 await access(path.join(root,'assets','dashboard-visual-v2.png'));
 await access(path.join(root,'assets','dashboard-background-v3.png'));
 await access(path.join(root,'assets','crowd-applause-and-cheering-237756-5s.mp3'));
});

test('V4 : le fond d’écran est personnalisable sans modifier l’interface',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 const storage=await readFile(path.join(root,'storage.mjs'),'utf8');
 assert.match(html,/Fond d’écran/);
 assert.match(html,/id="background-file" type="file" accept="image\/jpeg,image\/png,image\/webp"/);
 assert.match(html,/id="reset-background">Revenir au fond V3/);
 assert.match(app,/function selectedBackground\(\)/);
 assert.match(app,/Format accepté : JPG, PNG ou WEBP/);
 assert.match(app,/Fond d’écran trop volumineux : 3 Mo maximum/);
 assert.match(app,/call\('saveBackground'/);
 assert.match(app,/call\('resetBackground'/);
 assert.match(app,/--dashboard-bg/);
 assert.match(app,/URL\.createObjectURL\(new Blob\(\[bytes\],\{type:bg\.type\}\)\)/);
 assert.match(html,/img-src 'self' data: blob:/);
 assert.match(storage,/writeBackgroundAsset/);
 assert.match(storage,/backgroundFolder='fonds'/);
 assert.match(storage,/hydrateBackground/);
 assert.match(css,/var\(--dashboard-bg,url\('\.\/assets\/dashboard-background-v3\.png'\)\) center top\/cover fixed no-repeat/);
});

test('Réglages : une copie complète JSON peut être téléchargée',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const storage=await readFile(path.join(root,'storage.mjs'),'utf8');
 assert.match(html,/id="export-data">Télécharger une copie complète/);
 assert.match(html,/Le téléchargement complet crée un JSON de secours immédiat/);
 assert.match(app,/async function exportData\(\)/);
 assert.match(app,/call\('exportData'\)/);
 assert.match(app,/new Blob\(\[data\.json\],\{type:'application\/json'\}\)/);
 assert.match(storage,/if\(action==='exportData'\)/);
 assert.match(storage,/JSON\.stringify\(await hydrateBackground\(data\),null,2\)/);
});

test('Documentation V4 : les nouveautés et le ZIP complet restent cadrés',async()=>{
 const readme=await readFile(path.join(root,'README.md'),'utf8');
 const v4=await readFile(path.join(root,'V4.md'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(readme,/Ma Gestion Pro — V4 web pour GitHub Pages/);
 assert.match(readme,/Personnalisation du fond d’écran/);
 assert.match(readme,/Téléchargement d’une copie complète JSON/);
 assert.match(readme,/ZIP complet GitHub/);
 assert.match(v4,/Formats acceptés : JPG, PNG et WEBP/);
 assert.match(v4,/Téléchargement d’une copie complète JSON de secours/);
 assert.match(v4,/Aucun changement des calculs/);
 assert.match(css,/\.settings-layout>\.panel::before/);
 assert.match(css,/#export-data/);
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

test('Interface V3 : les libellés du menu restent dans le cadre',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(html,/<button data-view="settings">Réglages & sauvegardes<\/button>/);
 assert.match(css,/\.logo\{[\s\S]*justify-content:flex-start;[\s\S]*text-align:left;/);
 assert.match(css,/content:'Ma\\A Gestion\\A Pro'/);
 assert.match(css,/nav button\{[\s\S]*white-space:normal;[\s\S]*line-height:1\.15;/);
 assert.match(css,/nav button\[data-view='settings'\]\{min-height:58px\}/);
});

test('Dashboard V3 : les actions rapides ouvrent dépenses et recettes',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(html,/class="dashboard-actions"/);
 assert.match(html,/data-view="expenses">＋ Ajouter une dépense/);
 assert.match(html,/data-view="revenues">＋ Ajouter une recette/);
 assert.match(css,/\.dashboard-actions/);
 assert.match(css,/\.dashboard-actions\{[\s\S]*justify-content:flex-end;[\s\S]*margin-left:auto/);
 assert.match(css,/\.secondary-action/);
});

test('Interface V3 : le fond unique reste fixe et les panneaux lisibles',async()=>{
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(css,/var\(--dashboard-bg,url\('\.\/assets\/dashboard-background-v3\.png'\)\) center top\/cover fixed no-repeat/);
 assert.match(css,/background:linear-gradient\(180deg,#f6fbff00 0,#d8e9f314 60%,#cfe2ee28 100%\)/);
 assert.match(css,/\.hero\{\s*display:none;\s*\}/);
 assert.match(css,/\.topbar\{[\s\S]*overflow:hidden;/);
 assert.match(css,/\.version-note\{[\s\S]*position:fixed;[\s\S]*right:24px;[\s\S]*bottom:16px;/);
 assert.match(css,/\.logo\{[\s\S]*font-family:'Segoe Script','Brush Script MT','Trebuchet MS',cursive;[\s\S]*font-size:30px;/);
 assert.match(css,/\.logo\{[\s\S]*min-height:104px;/);
 assert.match(css,/text-shadow:0 0 8px #ff4fa3,0 0 19px #ff2d88,0 0 34px #ff2d8875/);
 assert.match(css,/content:'Ma\\A Gestion\\A Pro'/);
 assert.match(css,/nav\{width:100%;gap:6px;overflow:hidden\}/);
 assert.match(css,/nav button\{[\s\S]*width:100%;[\s\S]*text-overflow:clip;/);
 assert.match(css,/\.page\{[\s\S]*background:linear-gradient\(145deg,#f6fbffe8,#e7f2fae4\)/);
 assert.match(css,/\.connection-bar\{\s*display:none;\s*\}/);
 assert.match(css,/\.metrics article\{[\s\S]*background:linear-gradient\(145deg,#f8fcffd4,#eaf4fbcf\)/);
 assert.match(css,/\.metrics strong\{[\s\S]*color:var\(--metric-color,#071735\)/);
 assert.match(css,/\.metrics article:nth-child\(2\)\{--metric-color:#e94f80\}/);
 assert.match(css,/\.metrics article:nth-child\(4\)\{--metric-color:#1ea77d\}/);
 assert.match(css,/\.panel\{[\s\S]*background:linear-gradient\(145deg,#f7fcffd8,#e9f4fbd3\)/);
 assert.match(css,/\.bank-table-wrap\{[\s\S]*background:#f5fbfff0/);
});

test('Dashboard V3 : le compteur tickets reste aligné avec les autres indicateurs',async()=>{
 const app=await readFile(path.join(root,'app.js'),'utf8');
 assert.match(app,/receiptIcon\.className='metric-icon'/);
 assert.match(app,/Tickets à retrouver/);
 assert.match(app,/Justificatifs manquants à traiter/);
 assert.match(app,/receiptMetric\.append\(receiptIcon,receiptMetricBody\)/);
});

test('Dashboard : les panneaux principaux restent repliables',async()=>{
 const app=await readFile(path.join(root,'app.js'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(app,/function makeCollapsible\(panel,id,open=false\)/);
 assert.match(app,/body\.hidden=!open/);
 assert.match(app,/button\.setAttribute\('aria-expanded',String\(open\)\)/);
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

test('Livraison : le workflow et la documentation verrouillent le ZIP complet GitHub',async()=>{
 const workflow=await readFile(path.join(root,'.github','workflows','pages.yml'),'utf8');
 const readme=await readFile(path.join(root,'README.md'),'utf8');
 assert.match(workflow,/rm -rf public\s+mkdir public/);
 for(const checked of ['app.js','model.mjs','storage.mjs','receipts.mjs','reconciliation.mjs','reconciliation-ui.mjs','verify-public.mjs']){
  assert.match(workflow,new RegExp(`node --check ${checked.replace('.','\\.')}`));
 }
 assert.match(workflow,/node --test tests\/\*\.test\.mjs/);
 assert.match(workflow,/node verify-public\.mjs public/);
 for(const required of ['.github/workflows/pages.yml','index.html','app.js','style.css','model.mjs','storage.mjs','receipts.mjs','reconciliation.mjs','reconciliation-ui.mjs','assets/','tests/','verify-public.mjs']){
  assert.match(readme,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 }
 assert.match(readme,/ZIP complet GitHub/);
 assert.match(readme,/Ne pas livrer un ZIP contenant seulement `public\/`/);
});
