import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'projects/manifest.json'),'utf8'));
const errors=[]; const warnings=[];let references=0,scripts=0;
async function check(from,url){
 if(!url || /^(?:https?:|data:|mailto:|tel:|javascript:|#|blob:)/i.test(url))return;
 if(/[${}]/.test(url))return;
 if(url.startsWith('/api/')){warnings.push({file:path.relative(root,from),url,type:'backend endpoint not available in static demo'});return;}
 let target;try{target=decodeURIComponent(url.split(/[?#]/)[0]).replaceAll('&amp;','&');}catch{return;}
 if(!target)return;references++;
 const resolved=target.startsWith('/')?path.join(root,target):path.resolve(path.dirname(from),target);
 try{const stat=await fs.stat(resolved);if(stat.isDirectory())await fs.access(path.join(resolved,'index.html'));}catch{errors.push({file:path.relative(root,from),url});}
}
async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){if(item.name==='.git'||item.name==='tools')continue;const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}if(!/\.(html|css)$/i.test(file))continue;const source=await fs.readFile(file,'utf8');for(const match of source.matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi))await check(file,match[1]);if(file.endsWith('.html')){for(const match of source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){if(!match[1].trim()||/type=["']application\/ld\+json["']/i.test(match[0]))continue;try{new vm.Script(match[1]);scripts++;}catch(e){errors.push({file:path.relative(root,file),syntax:e.message});}}}}}
await walk(root);
const report={manifest:manifest.length,uniqueTitles:new Set(manifest.map(p=>p.title)).size,references,scripts,errors,warnings};
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
