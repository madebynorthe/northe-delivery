(() => {
  "use strict";

  const scripts = [...(window.LAVAREDA_DECEMBER || []), ...(window.LAVAREDA_JANUARY || [])];
  if (!scripts.length) return;

  const modelData = {
    palestrinha: {
      name: "Palestrinha",
      detail: "O advogado explica o assunto em etapas, ao lado de slides. Cada quadro apresenta uma nova informação.",
      direction: "Falar diretamente para a câmera, apontando para o slide quando necessário. Vamos utilizar os desenhos de quadro branco previstos no roteiro.",
      drive: "https://drive.google.com/file/d/1nGe7W7t0sLoLbNI863F6PCoPkN3phIQP/view?usp=drivesdk",
      embed: "https://drive.google.com/file/d/1nGe7W7t0sLoLbNI863F6PCoPkN3phIQP/preview"
    },
    contraste: {
      name: "Contraste",
      detail: "Um único apresentador compara duas situações, identificadas na tela por textos, imagens ou elementos gráficos.",
      direction: "A fala apresenta cada situação e a edição destaca as diferenças. Não é necessário gravar com duas pessoas.",
      drive: "https://drive.google.com/file/d/14E7HH_PdHTSvKS8hNZ1YgKhziyk4W45a/view?usp=drivesdk",
      embed: "https://drive.google.com/file/d/14E7HH_PdHTSvKS8hNZ1YgKhziyk4W45a/preview"
    },
    pergunta: {
      name: "Pergunta e resposta",
      detail: "Uma pergunta aparece em destaque. O advogado responde de forma objetiva para a câmera.",
      direction: "Falar como se estivesse respondendo uma dúvida de alguém. A pergunta pode aparecer em texto ou vir de uma pessoa fora do quadro.",
      drive: "https://drive.google.com/file/d/1Ij0vU4Sy4L99Qyd2CnM95nI-Nz9yW0X4/view?usp=drivesdk",
      embed: "https://drive.google.com/file/d/1Ij0vU4Sy4L99Qyd2CnM95nI-Nz9yW0X4/preview"
    },
    conversa: {
      name: "Conversa",
      detail: "Duas pessoas no mesmo ambiente. Uma pergunta, a outra responde e a conversa avança naturalmente.",
      direction: "Gravar os dois participantes no mesmo cenário, com réplicas curtas e cortes que acompanhem o diálogo.",
      drive: "https://drive.google.com/file/d/1TRBWfhcIxivAtDUeVUPScpq1TMpmdJmS/view?usp=drivesdk",
      embed: "https://drive.google.com/file/d/1TRBWfhcIxivAtDUeVUPScpq1TMpmdJmS/preview"
    }
  };

  const lawyers = ["Victoria", "Felipe", "Letícia", "Herberth", "Elisa Santos", "Keyvson Pimentel", "Leonardo Quaresma"];
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[m]);

  const storageKey = "northe-lavareda-dez26-jan27-review-v1";
  let review;
  try { review = JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; } catch (_) { review = {}; }
  let month = "dezembro";
  let selectedLawyer = "todos";
  let activeId = "";
  let toastTimeout;
  let readingSize = 27;

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(review)); }
    catch (_) { announce("Seu navegador não conseguiu salvar. Copie o resumo antes de sair."); }
  }
  function announce(message) {
    const toast = $("#toast"); toast.textContent = message; toast.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2900);
  }
  async function copy(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(value); announce("Copiado!"); return; } catch (_) {}
    }
    const t = document.createElement("textarea"); t.value = value;
    document.body.appendChild(t); t.select();
    try {
      const ok = document.execCommand("copy");
      announce(ok ? "Copiado!" : "Não foi possível copiar automaticamente.");
    } catch (_) { announce("Não foi possível copiar automaticamente."); }
    t.remove();
  }

  const findScript = (id) => scripts.find((script) => script.id === id);
  const current = () => findScript(activeId);
  const stored = (script) => review[script.id] || {};
  const statusText = (status) => status === "approved" ? "Aprovado" : status === "adjust" ? "Ajuste solicitado" : "Pendente";
  const scriptText = (script) => {
    if (script.slides) return script.slides.map((s) => s.talk).join("\n\n");
    if (script.turns) return script.turns.map((line) => line[0] + ": " + line[1]).join("\n\n");
    return script.text || "";
  };
  const inMonth = () => scripts.filter((s) => s.month === month).sort((a, b) => a.number - b.number);

  function renderReferences() {
    const keys = ["palestrinha", "contraste", "pergunta", "conversa"];
    const quantities = Object.fromEntries(keys.map((key) => [key, scripts.filter((s) => s.model === key).length]));
    $("#video-library").innerHTML = keys.map((key) => {
      const ref = modelData[key];
      return '<article class="format-video">' +
        '<div class="video-frame"><iframe loading="lazy" title="Vídeo de referência: ' + escapeHTML(ref.name) +
        '" src="' + ref.embed + '" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe></div>' +
        '<div class="format-description"><div class="format-title-row"><h3>' + escapeHTML(ref.name) +
        '</h3><span>' + quantities[key] + ' vídeos</span></div><p>' + escapeHTML(ref.detail) + '</p>' +
        '<a target="_blank" rel="noopener noreferrer" href="' + ref.drive + '">Ver no Google Drive ↗</a></div></article>';
    }).join("");
  }

  function selectMonth(value, scroll = false) {
    month = value;
    $$("[data-month]").forEach((tab) => {
      const active = tab.dataset.month === value;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    $("#month-summary").textContent = value === "dezembro"
      ? "Dezembro · 10 roteiros jurídicos. Natal e Ano-Novo são peças institucionais à parte."
      : "Janeiro · 12 roteiros jurídicos.";
    renderLawyers();
    if (scroll) $("#roteiros").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderLawyers() {
    const currentMonth = inMonth();
    const names = ["todos", ...lawyers];
    $("#lawyer-filter").innerHTML = names.map((name) => {
      const count = name === "todos" ? currentMonth.length : currentMonth.filter((s) => s.lawyer === name).length;
      const label = name === "todos" ? "Todos" : name === "Keyvson Pimentel" ? "Keyvson" : name;
      return '<button type="button" data-lawyer="' + escapeHTML(name) + '" class="lawyer-chip ' +
        (name === selectedLawyer ? "active" : "") + '" aria-pressed="' + (name === selectedLawyer) +
        '">' + escapeHTML(label) + ' <small>' + count + '</small></button>';
    }).join("");

    const visibleNames = selectedLawyer === "todos" ? lawyers : [selectedLawyer];
    const html = visibleNames.map((name) => {
      const list = currentMonth.filter((script) => script.lawyer === name);
      if (!list.length) return "";
      const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
      const area = list.map((s) => s.area).filter(Boolean)[0] || "Advocacia";
      return '<section class="lawyer-group" aria-label="Roteiros de ' + escapeHTML(name) + '">' +
        '<div class="lawyer-heading"><div class="avatar">' + escapeHTML(initials) + '</div>' +
        '<div class="lawyer-info"><h3>' + escapeHTML(name) + '</h3><span>' + escapeHTML(area) + '</span></div>' +
        '<span class="group-count">' + list.length + ' ' + (list.length === 1 ? "roteiro" : "roteiros") + '</span></div>' +
        '<div class="script-list">' + list.map(scriptCard).join("") + '</div></section>';
    }).join("");
    $("#lawyer-groups").innerHTML = html;
    $("#no-results").hidden = !!html.trim();
    updateProgress();
  }

  function scriptCard(script) {
    const result = stored(script).status;
    const format = modelData[script.model];
    return '<button type="button" class="script-row" data-script="' + escapeHTML(script.id) +
      '" aria-label="Abrir roteiro ' + script.number + ': ' + escapeHTML(script.title) + '">' +
      '<span class="script-index">' + String(script.number).padStart(2, "0") + '</span>' +
      '<span class="script-main"><strong>' + escapeHTML(script.title) + '</strong>' +
      '<small>' + escapeHTML(format.name) + ' <span class="middot">·</span> ' + escapeHTML(script.duration) + '</small></span>' +
      '<span class="script-status ' + (result || "") + '">' + statusText(result) + '</span>' +
      '<span class="script-arrow">↗</span></button>';
  }

  function updateProgress() {
    const n = scripts.filter((s) => !!stored(s).status).length;
    $("#review-total").textContent = n + "/" + scripts.length;
    $("#review-progress").style.width = (n * 100 / scripts.length) + "%";
  }

  function speechHTML(script) {
    if (script.slides) {
      return script.slides.map((slide, index) =>
        '<div class="speech-slide"><small>QUADRO ' + String(index + 1).padStart(2, "0") +
        ' — ' + escapeHTML(slide.title) + '</small><p>' + escapeHTML(slide.talk) + '</p></div>').join("");
    }
    if (script.turns) {
      return script.turns.map((turn) =>
        '<div class="speech-turn ' + (turn[0] === "Interlocutor" ? "speech-question" : "") + '">' +
        '<span>' + escapeHTML(turn[0]) + '</span><p>' + escapeHTML(turn[1]) + '</p></div>').join("");
    }
    return (script.text || "").split(/\n\s*\n/).map((part) => '<p>' + escapeHTML(part) + '</p>').join("");
  }

  function scenesHTML(script) {
    if (script.slides) {
      $("#scene-title").textContent = "Slides do Palestrinha";
      return '<p class="scene-explain">Quadro branco e desenhos de piloto: cada slide aparece na edição quando o advogado chega àquele ponto da fala.</p>' +
        script.slides.map((slide, i) =>
          '<details class="scene-item" ' + (i === 0 ? "open" : "") + '><summary><span>SLIDE ' + String(i + 1).padStart(2,"0") +
          '</span><strong>' + escapeHTML(slide.title) + '</strong><span class="scene-open">⌄</span></summary>' +
          '<div class="scene-body"><div class="whiteboard-sample"><span class="whiteboard-label">QUADRO BRANCO</span>' +
          '<strong>' + escapeHTML(slide.board || slide.title) + '</strong><span class="marker-line"></span>' +
          '<p>✎ ' + escapeHTML(slide.draw) + '</p></div>' +
          '<div class="scene-directions"><small>DESENHO</small><p>' + escapeHTML(slide.draw) + '</p>' +
          '<small>APRESENTAÇÃO / EDIÇÃO</small><p>' + escapeHTML(slide.gesture) + '</p></div></div></details>'
        ).join("");
    }
    $("#scene-title").textContent = "Como será gravado";
    return '<div class="scene-steps">' + (script.shots || []).map((shot, i) =>
      '<div class="scene-step"><span>' + String(i + 1).padStart(2,"0") + '</span><div><strong>' +
      escapeHTML(shot[0]) + '</strong><p>' + escapeHTML(shot[1]) + '</p></div></div>'
    ).join("") + '</div>';
  }

  function updateReviewUI() {
    const script = current(); if (!script) return;
    const state = stored(script);
    $("#review-note").value = state.note || "";
    $("#review-current").textContent = statusText(state.status);
    $("#review-current").className = "review-state " + (state.status || "");
    $("#approve").classList.toggle("selected", state.status === "approved");
    $("#adjust").classList.toggle("selected", state.status === "adjust");
  }

  function openScript(id) {
    const script = findScript(id); if (!script) return;
    const dialog = $("#script-dialog");
    if (script.month !== month) selectMonth(script.month);
    activeId = id;
    const ref = modelData[script.model];
    $("#dialog-number").textContent = String(script.number).padStart(2, "0");
    $("#dialog-lawyer").textContent = script.lawyer;
    $("#dialog-month").textContent = script.month === "dezembro" ? "DEZEMBRO 2026" : "JANEIRO 2027";
    $("#dialog-title").textContent = script.title;
    $("#dialog-format").textContent = ref.name;
    $("#dialog-duration").textContent = script.duration;
    $("#model-name").textContent = ref.name;
    $("#model-explanation").textContent = ref.detail;
    $("#model-instruction").textContent = ref.direction;
    $("#model-goal").textContent = script.goal;
    $("#reference-iframe").src = ref.embed;
    $("#reference-link").href = ref.drive;
    $("#script-text").innerHTML = speechHTML(script);
    $("#scene-list").innerHTML = scenesHTML(script);
    updateReviewUI();
    const list = inMonth();
    const index = list.findIndex((s) => s.id === id);
    $("#previous-script").disabled = index === 0;
    $("#next-script").disabled = index === list.length - 1;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  function closeScript() {
    const dialog = $("#script-dialog");
    if (dialog.open) dialog.close();
  }

  function moveScript(direction) {
    const list = inMonth();
    const index = list.findIndex((s) => s.id === activeId);
    const next = list[index + direction];
    if (next) openScript(next.id);
  }

  function setReview(status) {
    if (!current()) return;
    review[activeId] = { ...stored(current()), status, note: $("#review-note").value };
    save(); updateReviewUI(); updateProgress(); renderLawyers();
    announce(status === "approved" ? "Roteiro marcado como aprovado." : "Ajuste solicitado. Não esqueça de enviar o resumo.");
  }

  function exportReview() {
    const lines = ["LAVAREDA × NORTHE | REVISÃO DOS ROTEIROS", "Dezembro 2026 + Janeiro 2027", ""];
    for (const m of ["dezembro", "janeiro"]) {
      lines.push(m === "dezembro" ? "DEZEMBRO 2026" : "JANEIRO 2027");
      scripts.filter((s) => s.month === m).sort((a,b) => a.number - b.number).forEach((script) => {
        const st = stored(script);
        lines.push(String(script.number).padStart(2,"0") + " · " + script.lawyer + " · " + script.title);
        lines.push("Formato: " + modelData[script.model].name + " | " + statusText(st.status));
        if (st.note) lines.push("Observações: " + st.note);
        lines.push("");
      });
      lines.push("");
    }
    copy(lines.join("\n"));
  }

  function init() {
    renderReferences();
    renderLawyers();
    $$("[data-month]").forEach((tab) => tab.addEventListener("click", () => selectMonth(tab.dataset.month)));
    $("#lawyer-filter").addEventListener("click", (event) => {
      const target = event.target.closest("[data-lawyer]");
      if (!target) return;
      selectedLawyer = target.dataset.lawyer;
      renderLawyers();
    });
    $("#lawyer-groups").addEventListener("click", (event) => {
      const target = event.target.closest("[data-script]");
      if (target) openScript(target.dataset.script);
    });
    $("#close-dialog").addEventListener("click", closeScript);
    $("#script-dialog").addEventListener("close", () => {
      $("#reference-iframe").removeAttribute("src"); // stops video playback
      activeId = "";
    });
    $("#copy-script").addEventListener("click", () => current() && copy(scriptText(current())));
    $("#approve").addEventListener("click", () => setReview("approved"));
    $("#adjust").addEventListener("click", () => setReview("adjust"));
    $("#review-note").addEventListener("input", (event) => {
      if (!current()) return;
      review[activeId] = { ...stored(current()), note: event.target.value };
      save();
    });
    $("#copy-review").addEventListener("click", exportReview);
    $("#previous-script").addEventListener("click", () => moveScript(-1));
    $("#next-script").addEventListener("click", () => moveScript(1));
    $("#reading-mode").addEventListener("click", () => {
      if (!current()) return;
      $("#reading-lawyer").textContent = current().lawyer;
      $("#reading-text").textContent = scriptText(current());
      $("#reading-text").style.fontSize = readingSize + "px";
      $("#reading-dialog").showModal();
    });
    $("#close-reading").addEventListener("click", () => $("#reading-dialog").close());
    $("#font-less").addEventListener("click", () => {
      readingSize = Math.max(17, readingSize - 3);
      $("#reading-text").style.fontSize = readingSize + "px";
    });
    $("#font-more").addEventListener("click", () => {
      readingSize = Math.min(58, readingSize + 3);
      $("#reading-text").style.fontSize = readingSize + "px";
    });
  }
  init();
})();