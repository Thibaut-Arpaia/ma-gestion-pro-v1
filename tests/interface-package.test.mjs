import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');

test('Interface V2.0 : visuel validé et ressources locales présentes',async()=>{
 const html=await readFile(path.join(root,'index.html'),'utf8');
 const css=await readFile(path.join(root,'style.css'),'utf8');
 assert.match(html,/V2\.0 web · nouveau visuel/);
 assert.match(css,/dashboard-visual-v2\.png/);
 assert.match(css,/--pink:#ff639d/);
 assert.match(css,/--mint:#55efda/);
 await access(path.join(root,'assets','dashboard-visual-v2.png'));
 await access(path.join(root,'assets','crowd-applause-and-cheering-237756-5s.mp3'));
});

test('Interface V2.0 : les sept onglets restent dans l’ordre validé',async()=>{
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
