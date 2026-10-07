/* ============================================================
   api.js — API 桩层
   签名、延迟与返回结构都按真实接口设计；接入真实后端时
   只需替换下方实现，调用方无需改动。
   ============================================================ */
(function (global) {
  var DB = global.DB;

  var delay = function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  };

  /**
   * 按用户发送的文本匹配一条最贴合的流式回复。
   * TODO: 替换为真实模型调用。签名保持 ask: (history, text) => Promise<{ reply: string, latency: number }>
   *       真实接口示例：POST /api/companion/chat  { history:[...], text } -> { reply }
   */
  function askCompanion(history, text) {
    var reply = DB.fallback;
    var rules = DB.replyRules || [];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].match.test(text)) { reply = rules[i].reply; break; }
    }
    var latency = 520 + Math.random() * 420;
    return delay(latency).then(function () {
      return { reply: reply, latency: latency };
    });
  }

  /* 把一段文本拆成可“逐字打字”渲染的短句片段（保留结构起点） */
  function sliceForTyping(text, chunk) {
    if (!chunk || chunk <= 0) chunk = 2;
    var chars = Array.from(text);
    var parts = [];
    for (var i = 0; i < chars.length; i += chunk) {
      parts.push(chars.slice(i, i + chunk).join(""));
    }
    return parts;
  }

  global.ChatAPI = {
    ask: askCompanion,
    slice: sliceForTyping
  };
})(window);