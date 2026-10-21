import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const entries = [
 ['01-东南亚市场进入战略PPT','东南亚市场进入战略','东南亚市场进入战略.html','研究与演示练习；市场判断与预测不代表已发生的商业业绩。'],
 ['02-双十一大促全链路复盘','双十一大促全链路复盘','双十一大促全链路复盘_2026.html','示例数据复盘，用于展示分析框架，不代表个人历史经营业绩。'],
 ['03-YSL口红礼盒竖屏短片','YSL 节日限定礼盒短片','成片/YSL节日限定口红礼盒_一镜到底12s_品牌落版_9x16.mp4','品牌概念样片，不代表品牌委托、官方合作或实际投放。'],
 ['04-新家装修方案','新家装修方案','新家装修方案.html','个人方案练习，预算及设计设定不代表实际施工结算。'],
 ['05-景德镇陶瓷市集海报','景德镇陶瓷市集海报','jingdezhen_ceramics_market_poster_v2.jpg','活动视觉概念练习，不代表真实活动主办或官方合作。'],
 ['06-自建API中转站渠道调研','自建 API 中转站渠道调研','api-relay-upstream-research.html','历史调研材料；价格、渠道和可用性可能变化，不构成服务承诺。'],
];
for (const [dir,title,file,note] of entries) {
 const media = file.endsWith('.mp4') ? `<video controls playsinline preload="metadata" src="${escape(file)}"></video>` : file.endsWith('.jpg') ? `<img src="${escape(file)}" alt="${escape(title)}">` : `<iframe title="${escape(title)} 成品预览" loading="lazy" src="${escape(file)}"></iframe>`;
 const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · HenryFone</title><style>body{margin:0;background:#f7f8f5;color:#17231f;font:16px/1.7 system-ui,'Microsoft YaHei',sans-serif}main{width:min(1050px,calc(100% - 32px));margin:32px auto}a{color:#16624f}h1{font-size:clamp(26px,5vw,42px)}.note{padding:16px;background:#e8f2ed}iframe{width:100%;height:78vh;border:1px solid #dde5df;margin-top:20px}img,video{display:block;width:100%;max-height:80vh;object-fit:contain;margin-top:20px;background:#e8ece8}</style></head><body><main><a href="../../index.html">← 返回作品集</a><h1>${escape(title)}</h1><p class="note">${escape(note)}</p><a href="${escape(file)}">单独打开成品 ↗</a>${media}</main></body></html>`;
 await fs.writeFile(path.join(root,'原始成果',dir,'index.html'),html);
}
const yuntu=path.join(root,'projects/case-2026-016/demo/index.html');
await fs.writeFile(yuntu,'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=public/index.html"><title>云图智联品牌站</title></head><body><p><a href="public/index.html">打开云图智联品牌站演示</a></p></body></html>');
const detail=path.join(root,'projects/case-2026-016/index.html');
await fs.writeFile(detail,(await fs.readFile(detail,'utf8')).replaceAll('./demo/index.html','./demo/public/index.html'));
for(const slug of ['case-2026-016','case-2026-051','case-2026-052']) {
 const p=path.join(root,'projects',slug,'README.md');
 const url=slug.endsWith('016')?'./demo/public/index.html':'./demo/preview-video.mp4';
 await fs.writeFile(p,(await fs.readFile(p,'utf8')).replaceAll('./demo/index.html',url));
}
for(const [slug,title] of [['case-2026-051','形变-贴纸科普 HUD 拼贴玻璃拟态动画'],['case-2026-052','手绘、等轴 2.5D 与真实 3D 风格动画']]) {
 const preview=path.join(root,'projects',slug,'demo/index.html');
 await fs.writeFile(preview,`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{margin:0;background:#111;color:#fff;font:16px/1.6 system-ui,sans-serif}main{width:min(1000px,calc(100% - 32px));margin:32px auto}video{width:100%;max-height:80vh;background:#000}</style></head><body><main><h1>${escape(title)}</h1><video controls playsinline preload="metadata" src="./preview-video.mp4"></video></main></body></html>`);
}
const builder=path.join(root,'tools/build-homepage.mjs');
let source=await fs.readFile(builder,'utf8');
for (const [num,i] of [['1',0],['5',4],['3',2]]) source=source.replaceAll(`href="#p${num}"`,`href="原始成果/${entries[i][0]}/index.html"`);
await fs.writeFile(builder,source);
const fryer=path.join(root,'projects/air-fryer-listing-images/index.html');
let page=await fs.readFile(fryer,'utf8');page=page.replaceAll('./demo/%E5%8D%95%E5%9B%BE','./demo/index.html');await fs.writeFile(fryer,page);
const nova=path.join(root,'projects/nova-brand-key-visual/index.html');
page=await fs.readFile(nova,'utf8');page=page.replaceAll('./demo/assets','./demo/kv.html');await fs.writeFile(nova,page);
const manifestPath=path.join(root,'projects/manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const fryerEntry=manifest.find(p=>p.slug==='air-fryer-listing-images');
fryerEntry.demo='./demo/index.html';fryerEntry.cover='./demo/空气炸锅套图_总览.png';
fryerEntry.assets=['01_主图_白底.png','02_卖点_6合1多功能.png','03_卖点_紧凑机身尺寸.png','04_卖点_4QT家庭容量.png','05_生活场景图.png','06_促销主视觉.png','07_大促横幅_横版.png'].map(name=>[name,'./demo/单图/'+encodeURIComponent(name)]);
manifest.find(p=>p.slug==='nova-brand-key-visual').assets=manifest.find(p=>p.slug==='nova-brand-key-visual').assets.filter(([,url])=>url!=='./demo/assets');
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
for(const slug of ['case-2026-020','case-2026-023']) { const f=path.join(root,'projects',slug,'demo/index.html');const source=await fs.readFile(f,'utf8');await fs.writeFile(f,source.replace(/<script[^>]*inject\.js[^>]*><\/script>/gi,'')); }
console.log('Six selected-case pages and three preview entries finalized.');
