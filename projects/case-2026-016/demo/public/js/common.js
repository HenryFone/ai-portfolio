/* ============================================================
   公共脚本：氛围层 / 导航 / 页脚注入 / 登录态 / 滚动动效 / 工具
   ============================================================ */
(function () {
  const PAGE = location.pathname.split('/').pop() || 'index.html'
  const NAV = [
    ['index.html', '首页'],
    ['about.html', '关于我们'],
    ['products.html', '产品服务'],
    ['contact.html', '联系我们']
  ]
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------- 氛围层 + 滚动进度 ---------- */
  const atm = document.createElement('div')
  atm.className = 'atmosphere'
  atm.setAttribute('aria-hidden', 'true')
  document.body.prepend(atm)
  const grain = document.createElement('div')
  grain.className = 'grain'
  grain.setAttribute('aria-hidden', 'true')
  document.body.prepend(grain)
  const prog = document.createElement('div')
  prog.className = 'scroll-progress'
  document.body.prepend(prog)

  /* ---------- 顶部导航 ---------- */
  const header = document.createElement('header')
  header.className = 'site-header'
  header.innerHTML = `
    <div class="wrap nav">
      <a class="brand" href="index.html" aria-label="云图智联首页">
        <span class="logo-mark" aria-hidden="true">云</span>
        <span><b>云图智联</b><small>YUNTU INTELLIGENCE</small></span>
      </a>
      <nav class="nav-links" id="navLinks" aria-label="主导航">
        ${NAV.map(([h, t]) => `<a href="${h}" class="${PAGE === h ? 'active' : ''}" ${PAGE === h ? 'aria-current="page"' : ''}>${t}</a>`).join('')}
      </nav>
      <div class="nav-actions">
        <div id="navActions"></div>
        <button class="nav-burger" id="navBurger" type="button" aria-label="打开菜单" aria-expanded="false"><span></span></button>
      </div>
    </div>`
  document.body.prepend(header)

  const burger = document.getElementById('navBurger')
  const navLinks = document.getElementById('navLinks')
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open')
    burger.classList.toggle('open', open)
    burger.setAttribute('aria-expanded', open)
  })
  navLinks.addEventListener('click', e => {
    if (e.target.tagName === 'A') { navLinks.classList.remove('open'); burger.classList.remove('open') }
  })

  /* ---------- 页脚 ---------- */
  const footer = document.createElement('footer')
  footer.className = 'site-footer'
  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <div class="brandline">
            <span class="logo-mark" style="width:30px;height:30px;font-size:14px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent-deep),var(--accent));color:#fff;font-weight:800">云</span>
            <b style="font-size:16px;letter-spacing:.06em">云图智联</b>
          </div>
          <p class="slogan">让每一条生产线都拥有 AI 的眼睛。</p>
          <p>深圳市南山区科技园南区腾飞大厦 12 层</p>
        </div>
        <div>
          <h4>导航</h4>
          ${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}
          <a href="user.html">个人中心</a>
        </div>
        <div>
          <h4>联系</h4>
          <p>商务合作：400-862-0917</p>
          <p>邮箱：contact@yuntu-tech.example</p>
          <p>工作时间：周一至周五 9:00–18:00</p>
        </div>
        <div>
          <h4>关注</h4>
          <p>微信公众号：云图智联</p>
          <p>视频号：云图智联科技</p>
        </div>
      </div>
      <div class="copyright">© 2026 云图智联科技有限公司　粤ICP备2026000000号-1（示例信息）</div>
    </div>`
  document.body.appendChild(footer)

  /* ---------- 返回顶部 ---------- */
  const back = document.createElement('button')
  back.className = 'back-top'
  back.type = 'button'
  back.setAttribute('aria-label', '返回顶部')
  back.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`
  back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }))
  document.body.appendChild(back)

  /* ---------- 滚动：进度条 / 头部 / 返回顶部 ---------- */
  let ticking = false
  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const y = window.scrollY
      const h = document.documentElement.scrollHeight - window.innerHeight
      prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%'
      header.classList.toggle('scrolled', y > 24)
      back.classList.toggle('show', y > 600)
      ticking = false
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  /* ---------- 滚动入场（IntersectionObserver） ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) } })
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
  function observeReveals() { document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el)) }
  observeReveals()
  window.__observeReveals = observeReveals

  /* ---------- 数字滚动（data-count） ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return
      const el = en.target
      countIO.unobserve(el)
      const target = parseFloat(el.dataset.count)
      const dec = (el.dataset.dec | 0)
      if (reduced) { el.textContent = target.toFixed(dec); return }
      const t0 = Date.now(), dur = 1400
      const timer = setInterval(() => {
        const p = Math.min((Date.now() - t0) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 4)
        el.textContent = (target * eased).toFixed(dec)
        if (p >= 1) { clearInterval(timer); el.textContent = target.toFixed(dec) }
      }, 16)
    })
  }, { threshold: 0.4 })
  window.__observeCounts = () => document.querySelectorAll('[data-count]:not([data-done])').forEach(el => { el.dataset.done = 1; countIO.observe(el) })
  window.__observeCounts()

  /* ---------- 登录态 ---------- */
  async function renderNav() {
    const box = document.getElementById('navActions')
    let user = null
    try { user = (await (await fetch('/api/me')).json()).data.user } catch (e) {}
    if (user) {
      box.innerHTML = `
        <a class="nav-user" href="user.html">
          <span class="avatar">${user.avatar ? `<img src="${user.avatar}" alt="">` : escapeHtml((user.name || 'U').slice(0, 1))}</span>
          <span>${escapeHtml(user.name || user.email)}</span>
        </a>
        <button class="btn ghost" id="btnLogout" type="button" style="padding:8px 18px">退出</button>`
      document.getElementById('btnLogout').onclick = async () => {
        await fetch('/api/logout', { method: 'POST' })
        toast('已退出登录')
        setTimeout(() => location.href = 'index.html', 500)
      }
    } else {
      box.innerHTML = `<a class="btn" href="login.html" style="padding:9px 22px">登录 / 注册</a>`
    }
  }

  /* ---------- 工具 ---------- */
  window.escapeHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  window.toast = function (msg) {
    let t = document.querySelector('.toast')
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t) }
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(t._timer)
    t._timer = setTimeout(() => t.classList.remove('show'), 2600)
  }
  window.api = async function (url, opts = {}) {
    try {
      const res = await fetch(url, {
        method: opts.method || 'GET',
        headers: opts.body ? { 'Content-Type': 'application/json' } : {},
        body: opts.body ? JSON.stringify(opts.body) : undefined
      })
      return await res.json()
    } catch (e) { return { ok: false, error: '网络异常，请稍后重试' } }
  }
  window.needLogin = function () { toast('请先登录'); setTimeout(() => location.href = 'login.html', 600) }
  window.fmtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'

  renderNav()

  /* 登录态变化后重新渲染导航（login 页注册/登录成功时用） */
  window.__rerenderNav = renderNav
})()
