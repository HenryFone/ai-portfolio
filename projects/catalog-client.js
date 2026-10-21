const grid = document.querySelector('#grid');
const search = document.querySelector('#search');
const filters = document.querySelector('#filters');
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let projects = [];
let category = '全部';
function render() {
  const query = search.value.trim().toLowerCase();
  const visible = projects.filter(p => (category === '全部' || p.kind.split(' / ')[0] === category) && (!query || (p.title+' '+p.kind).toLowerCase().includes(query)));
  document.querySelector('#result').textContent = `显示 ${visible.length} / ${projects.length} 件`;
  grid.innerHTML = visible.map((p,index) => {
    const image = p.cover || p.assets?.find(([,url]) => /\.(png|jpe?g|webp|svg)$/i.test(url))?.[1] || (/\.(png|jpe?g|webp)$/i.test(p.demo||'') ? p.demo : '');
    const page = p.slug+'/index.html';
    const previewSource = p.demo || p.assets?.[0]?.[1];
    const preview = previewSource ? p.slug+'/'+previewSource.replace(/^\.\//,'') : page;
    return `<article class="card"><a class="media" href="${escapeHtml(page)}" aria-label="查看 ${escapeHtml(p.title)}">${image?`<img loading="lazy" src="${escapeHtml(p.slug+'/'+image.replace(/^\.\//,''))}" alt="">`:`<span class="initial">${String(index+1).padStart(2,'0')}</span>`}<span class="tag">${escapeHtml(p.kind.split(' / ')[0])}</span></a><div class="body"><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.kind)} · 公开展示版</p><div class="links"><a href="${escapeHtml(page)}">项目说明 ↗</a><a href="${escapeHtml(preview)}">成品预览 ↗</a></div></div></article>`;
  }).join('') || '<div class="empty">没有符合条件的项目，请尝试其他关键词。</div>';
}
fetch('manifest.json').then(response => { if(!response.ok) throw Error('读取失败'); return response.json(); }).then(data => {
  projects = data;
  document.querySelector('#total').textContent = data.length+6;
  filters.innerHTML = ['全部',...new Set(data.map(p=>p.kind.split(' / ')[0]))].map(kind=>`<button type="button" class="filter" data-kind="${escapeHtml(kind)}" aria-pressed="${kind===category}">${escapeHtml(kind)}</button>`).join('');
  render();
}).catch(()=>{document.querySelector('#result').textContent='项目列表无法读取，请刷新重试。';});
filters.addEventListener('click',event=>{const button=event.target.closest('[data-kind]');if(!button)return;category=button.dataset.kind;filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
search.addEventListener('input',render);
