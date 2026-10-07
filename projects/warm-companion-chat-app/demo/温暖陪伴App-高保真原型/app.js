/* ============================================================
   app.js — 状态、渲染与交互
   仅依赖 mock.js(数据) 与 api.js(流式回复桩)；无任何真实后端。
   ============================================================ */
(function () {
  "use strict";
  var DB = window.DB;
  var ChatAPI = window.ChatAPI;

  /* ---------- 内联 Lucide 图标（单一图标库，离线可用） ---------- */
  var IC = {
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "send": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    "panel-right": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5A7 7 0 0 0 9 2a7 7 0 0 0-1.7 13.7c.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M9 22h6"/>',
    "coffee": '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
    "briefcase": '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    "cloud-sun": '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    "moon-star": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/>'
  };

  /* ---------- 迷你富文本 / 代码高亮 ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(t) {
    return t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
  }
  function highlight(src) {
    return esc(src)
      .replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="st">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="st">$1</span>')
      .replace(/(\d+)/g, '<span class="nu">$1</span>')
      .replace(/\b(function|const|let|var|for|return|if|else|while|await|new|console|true|false|null|undefined)\b/g, '<span class="kw">$1</span>');
  }
  function renderCode(src) {
    var firstNL = src.indexOf("\n");
    var firstLine = (firstNL >= 0 ? src.slice(0, firstNL) : src).trim();
    var body = firstNL >= 0 ? src.slice(firstNL + 1) : "";
    var lang = /^[A-Za-z]{2,}$/.test(firstLine) ? firstLine : "";
    if (lang === "") body = src;
    return '<div class="code-block"><div class="code-bar">' +
      '<span class="dots"><i style="background:#F98D78"></i><i style="background:#F9C74F"></i><i style="background:#8BD0A9"></i></span>' +
      '<span>' + esc(lang || "code") + "</span></div><pre>" + highlight(body) + "</pre></div>";
  }
  function renderText(s) {
    var escS = esc(s);
    var lines = escS.split("\n");
    var html = "", para = [];
    var flush = function () {
      if (para.length) { html += "<p>" + inline(para.join("<br>")) + "</p>"; para = []; }
    };
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^\s*$/.test(ln)) { flush(); continue; }
      if (/^&gt;/.test(ln)) {
        flush();
        html += "<blockquote>" + inline(ln.replace(/^&gt;\s*/, "")) + "</blockquote>";
        continue;
      }
      para.push(ln);
    }
    flush();
    return html;
  }
  function renderRich(text) {
    var out = "", last = 0, m, re = /```([\s\S]*?)```/g;
    while ((m = re.exec(text))) {
      if (m.index > last) out += renderText(text.slice(last, m.index));
      out += renderCode(m[1]);
      last = m.index + m[0].length;
    }
    if (last < text.length) out += renderText(text.slice(last));
    return out;
  }

  /* ---------- DOM 与状态 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var elMessages = $("messages"), elSessionList = $("sessionList"), elTopicList = $("topicList");
  var elChips = $("quickChips"), elComposer = $("composer"), elInput = $("composerInput"), elSend = $("sendBtn");
  var state = { currentId: null, msgs: [], typing: false, requestId: 0, typingTimer: null };

  /* 注入图标（包成完整 svg，统一描边样式） */
  function setIcon(el, name) {
    if (el && IC[name]) {
      el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[name] + "</svg>";
    }
  }
  document.querySelectorAll("[data-icon]").forEach(function (n) {
    setIcon(n, n.getAttribute("data-icon"));
  });

  function timeNow() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }

  /* ---------- 会话历史列表 ---------- */
  function renderSessions() {
    var ids = Object.keys(DB.conversations);
    $("historyCount").textContent = "共 " + ids.length + " 段陪伴会话";
    elSessionList.innerHTML = "";
    ids.forEach(function (id) {
      var c = DB.conversations[id];
      var hist = DB.histories[id] || [];
      var last = hist.length ? hist[hist.length - 1] : c.messages[0];
      var li = document.createElement("li");
      li.className = "session-item" + (state.currentId === id ? " active" : "");
      li.setAttribute("data-id", id);
      var dely = 'aria-hidden="true"';
      li.innerHTML =
        '<span class="session-avatar"' + dely + '></span>' +
        '<span class="session-main">' +
          '<span class="session-title"><strong>' + esc(c.title) + "</strong><span class='session-time'>" + esc(c.time) + "</span></span>" +
          '<span class="session-preview">' + esc(last.from === "u" ? "我：" : "") + esc(abbrev(last.text)) + "</span>" +
          (c.badge ? '<span class="session-badge">' + esc(c.badge) + "</span>" : "") +
        "</span>";
      li.addEventListener("click", function () { openSession(id); });
      elSessionList.appendChild(li);
    });
  }
  function abbrev(t) {
    var s = String(t || "").replace(/[`*#>]/g, "").replace(/```[\s\S]*?```/g, "代码…");
    return s.length > 16 ? s.slice(0, 16) + "…" : s;
  }

  /* ---------- 右侧话题模板 ---------- */
  function renderTopics() {
    elTopicList.innerHTML = "";
    DB.topics.forEach(function (t) {
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="topic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px">' +
        (IC[t.icon] || IC.sparkles) + "</svg></span>" +
        '<span class="topic-body"><strong>' + esc(t.label) + "</strong>" +
        '<span class="topic-tip">' + esc(t.tip) + "</span>" +
        (t.badge ? '<span class="topic-badge">' + esc(t.badge) + "</span>" : "") + "</span>";
      li.className = "topic-item";
      li.setAttribute("data-opener", t.opener);
      li.addEventListener("click", function () { sendByTemplate(t); });
      elTopicList.appendChild(li);
    });
  }

  /* ---------- 快速话题胶囊 ---------- */
  function renderChips() {
    elChips.innerHTML = "";
    DB.topics.slice(0, 4).forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        (IC[t.icon] || IC.sparkles) + "</svg></span>" + esc(t.label);
      b.addEventListener("click", function () { sendByTemplate(t); });
      elChips.appendChild(b);
    });
  }

  /* ---------- 消息渲染 ---------- */
  function bubbleHTML(from, text, showAvatar) {
    return '<div class="msg ' + (from === "a" ? "a" : "me") + '">' +
      (from === "a" ? '<span class="msg-avatar" aria-hidden="true"></span>' : "") +
      '<div class="bubble"><div class="rich">' + renderRich(text) + "</div>" +
      '<span class="meta">' + (from === "a" ? "阿澈 · " + timeNow() + " · 已送达" : "我 · " + timeNow()) + "</span></div></div>";
  }
  function addStaticMsg(from, text) {
    var wrap = document.createElement("div");
    wrap.innerHTML = bubbleHTML(from, text);
    elMessages.appendChild(wrap.firstChild);
    scrollToBottom();
  }
  function scrollToBottom() { elMessages.scrollTop = elMessages.scrollHeight; }

  function showLoading() {
    var wrap = document.createElement("div");
    wrap.className = "msg a";
    wrap.innerHTML = '<span class="msg-avatar" aria-hidden="true"></span>' +
      '<div class="bubble loading-bubble"><i></i><i></i><i></i></div>';
    wrap.id = "loadingRow";
    elMessages.appendChild(wrap);
    scrollToBottom();
  }
  function removeLoading() {
    var row = $("loadingRow");
    if (row) row.remove();
  }

  /* 逐字打字机 + 渐入 */
  function typewrite(from, text, onDone) {
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="msg ' + (from === "a" ? "a" : "me") + '">' +
      (from === "a" ? '<span class="msg-avatar" aria-hidden="true"></span>' : "") +
      '<div class="bubble"><div class="rich"></div><span class="meta"></span></div></div>';
    var row = wrap.firstChild;
    elMessages.appendChild(row);
    scrollToBottom();
    var rich = row.querySelector(".rich");
    var meta = row.querySelector(".meta");

    var parts = ChatAPI.slice(text, 2), buf = "", i = 0;
    var timer = setInterval(function () {
      if (i < parts.length) {
        buf += parts[i++];
        rich.innerHTML = renderRich(buf) + '<span class="typing-caret"></span>';
        scrollToBottom();
      } else {
        clearInterval(timer);
        if (state.typingTimer === timer) state.typingTimer = null;
        rich.innerHTML = renderRich(text);
        meta.textContent = (from === "a" ? "阿澈 · " : "我 · ") + timeNow() + (from === "a" ? " · 已送达" : "");
        if (onDone) onDone();
      }
    }, 26);
    state.typingTimer = timer;
    return timer;
  }

  function finishReply() {
    state.typing = false;
    state.typingTimer = null;
    elSend.disabled = !elInput.value.trim();
    elSend.classList.remove("sending");
    renderSessions();
  }

  function cancelPendingReply() {
    state.requestId += 1;
    if (state.typingTimer) {
      clearInterval(state.typingTimer);
      state.typingTimer = null;
    }
    removeLoading();
    state.typing = false;
    elSend.disabled = !elInput.value.trim();
    elSend.classList.remove("sending");
  }

  /* ---------- 数据记录 ---------- */
  function pushMsg(id, from, text) {
    var c = DB.conversations[id], hist = DB.histories[id] || (DB.histories[id] = []);
    if (hist.length && hist[0].from === "u") { /* new session kept */ }
    hist.push({ from: from, text: text });
    if (c) { c.last = text; c.time = timeNow(); c.preview = from === "u" ? "我：" + abbrev(text) : abbrev(text); c.badge = null; }
  }

  /* ---------- 回复主流程 ---------- */
  function sendByTemplate(t) {
    maybeSend(t.opener);
  }
  function maybeSend(text) {
    text = String(text || "").trim();
    if (!text || state.typing) return;
    sendMessage(text);
  }
  function sendMessage(text) {
    var id = state.currentId;
    var requestId = ++state.requestId;
    state.typing = true;
    elSend.disabled = true;
    elSend.classList.add("sending");
    elInput.value = "";
    autosizeInput();
    addStaticMsg("u", text);
    pushMsg(id, "u", text);
    showLoading();

    ChatAPI.ask((DB.histories[id] || []), text).then(function (res) {
      if (requestId !== state.requestId) {
        pushMsg(id, "a", res.reply);
        return;
      }
      removeLoading();
      pushMsg(id, "a", res.reply);
      typewrite("a", res.reply, function () {
        if (requestId !== state.requestId) return;
        finishReply();
      });
    }).catch(function () {
      if (requestId !== state.requestId) return;
      removeLoading();
      var message = "抱歉，刚刚没有收到回复。你可以再试一次。";
      pushMsg(id, "a", message);
      addStaticMsg("a", message);
      finishReply();
    });
  }

  /* ---------- 会话切换 / 开启新对话 ---------- */
  function openSession(id) {
    cancelPendingReply();
    state.currentId = id;
    var hist = DB.histories[id] || [];
    var c = DB.conversations[id];
    $("chatName").textContent = state.currentId === "__new__" ? "阿澈" : (c ? c.title : DB.character.name);
    elMessages.innerHTML = "";
    hist.forEach(function (m) { addStaticMsg(m.from, m.text); });
    renderSessions();
    elInput.focus();
  }
  function startNewChat() {
    cancelPendingReply();
    state.currentId = "__new__";
    DB.histories["__new__"] = [];
    elMessages.innerHTML = "";
    typewrite("a", "嗨，我来了~ 我是阿澈，今天想从哪里开始呢？可以是任何小事、小烦恼，或者就随便打个招呼，我都在这儿好好听。", function () {
      elSend.disabled = !elInput.value.trim();
    });
    renderSessions();
    elInput.focus();
  }

  /* ---------- 输入框自适应 ---------- */
  function autosizeInput() {
    elInput.style.height = "auto";
    elInput.style.height = Math.min(elInput.scrollHeight, 110) + "px";
  }
  function updateSendState() {
    elSend.disabled = state.typing || !elInput.value.trim();
  }

  /* ---------- 右栏折叠 ---------- */
  $("toggleTopics").addEventListener("click", function () {
    document.body.classList.toggle("topics-collapsed");
  });

  /* ---------- 事件绑定 ---------- */
  elInput.addEventListener("input", function () { autosizeInput(); updateSendState(); });
  elInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); maybeSend(elInput.value); }
  });
  elComposer.addEventListener("submit", function (e) { e.preventDefault(); maybeSend(elInput.value); });
  $("newChatBtn").addEventListener("click", startNewChat);
  $("plusBtn").addEventListener("click", function () { elInput.focus(); });

  /* ---------- 初始化 ---------- */
  renderSessions();
  renderTopics();
  renderChips();
  openSession("mood");
})();