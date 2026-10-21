const grid = document.querySelector('#grid');
const filters = document.querySelector('#filters');
const search = document.querySelector('#search');
const favoriteToggle = document.querySelector('#favonly');
let selectedKind = '全部';
let favoritesOnly = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function readFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem('portfolio-favorites') || '[]')); }
  catch { return new Set(); }
}
let favorites = readFavorites();

function renderFilters() {
  const kinds = ['全部', ...new Set(data.map((project) => project.kind))];
  filters.innerHTML = kinds.map((kind) => '<button class="filter" type="button" data-kind="' + escapeHtml(kind) + '" aria-pressed="' + (kind === selectedKind) + '">' + escapeHtml(kind) + '</button>').join('');
}

function renderProjects() {
  const query = search.value.trim().toLocaleLowerCase();
  const visible = data.filter((project) => {
    const matchesKind = selectedKind === '全部' || project.kind === selectedKind;
    const matchesFavorite = !favoritesOnly || favorites.has(project.title);
    const matchesQuery = !query || (project.title + ' ' + project.kind + ' ' + project.desc).toLocaleLowerCase().includes(query);
    return matchesKind && matchesFavorite && matchesQuery;
  });
  document.querySelector('#count').textContent = '显示 ' + visible.length + ' / ' + data.length + ' 件';
  grid.innerHTML = visible.length ? visible.map((project, index) => '<article class="card"><a class="media" href="' + escapeHtml(project.slug) + '" aria-label="打开 ' + escapeHtml(project.title) + '">' +
    (project.image ? '<img loading="lazy" src="' + escapeHtml(project.image) + '" alt="">' : '<span class="num">' + String(index + 1).padStart(2, '0') + '</span>') +
    '<span class="tag">' + escapeHtml(project.kind) + '</span></a><div class="body"><h3>' + escapeHtml(project.title) + '</h3><p>' + escapeHtml(project.desc) + '</p><div class="foot"><button class="save" type="button" data-title="' + escapeHtml(project.title) + '" aria-label="收藏 ' + escapeHtml(project.title) + '">' +
    (favorites.has(project.title) ? '★ 已收藏' : '☆ 收藏') + '</button><a href="' + escapeHtml(project.slug) + '">查看项目 ↗</a></div></div></article>').join('') : '<div class="empty">没有找到匹配项目。试试其他关键词或类别。</div>';
  grid.querySelectorAll('.media img').forEach((image) => image.addEventListener('error', () => image.replaceWith(Object.assign(document.createElement('span'), { className: 'num', textContent: 'HF' })), { once: true }));
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-kind]');
  if (!button) return;
  selectedKind = button.dataset.kind;
  filters.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  renderProjects();
});
search.addEventListener('input', renderProjects);
favoriteToggle.addEventListener('click', () => {
  favoritesOnly = !favoritesOnly;
  favoriteToggle.setAttribute('aria-pressed', String(favoritesOnly));
  renderProjects();
});
grid.addEventListener('click', (event) => {
  const button = event.target.closest('.save');
  if (!button) return;
  favorites.has(button.dataset.title) ? favorites.delete(button.dataset.title) : favorites.add(button.dataset.title);
  localStorage.setItem('portfolio-favorites', JSON.stringify([...favorites]));
  renderProjects();
});
renderFilters();
renderProjects();
