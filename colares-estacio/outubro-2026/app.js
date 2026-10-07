(() => {
  const data = window.COLARES_ESTACIO_DELIVERY;
  const list = document.getElementById("contentList");
  const reviewCount = document.getElementById("reviewCount");
  const approvedCount = document.getElementById("approvedCount");
  const changesCount = document.getElementById("changesCount");
  const toast = document.getElementById("toast");
  const state = new Map();

  const esc = (value="") => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const driveView = id => `https://drive.google.com/file/d/${id}/view`;
  const drivePreview = id => `https://drive.google.com/file/d/${id}/preview`;
  const driveThumb = (id, size=1600) => `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
  const folderView = id => `https://drive.google.com/drive/folders/${id}`;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function renderCounts() {
    const values = [...state.values()];
    const approved = values.filter(v => v.status === "approved").length;
    const changes = values.filter(v => v.status === "changes").length;
    reviewCount.textContent = `${approved + changes}/${data.items.length}`;
    approvedCount.textContent = approved;
    changesCount.textContent = changes;
  }

  function renderState(itemId) {
    const card = document.getElementById(`content-${itemId}`);
    if (!card) return;
    const box = card.querySelector(".state");
    const review = state.get(itemId);
    if (!review) {
      box.className = "state";
      box.textContent = "";
      return;
    }
    if (review.status === "approved") {
      box.className = "state approved is-visible";
      box.textContent = "✓ Conteúdo aprovado.";
    } else {
      box.className = "state changes is-visible";
      box.textContent = review.comment ? `Ajuste solicitado: ${review.comment}` : "Ajuste solicitado.";
      const text = card.querySelector("textarea");
      if (text && review.comment) text.value = review.comment;
    }
  }

  function reelPreview(item) {
    return `
      <div class="preview preview-reel">
        <button class="video-poster" type="button" data-load-video aria-label="Reproduzir ${esc(item.title)}">
          <img loading="lazy" decoding="async" fetchpriority="low" src="${driveThumb(item.driveId, 720)}" alt="">
          <span class="video-play" aria-hidden="true">▶</span>
          <span class="video-load-label">Carregar vídeo</span>
        </button>
      </div>`;
  }

  function carouselPreview(item) {
    const thumbs = item.slides.map((slide, index) => `
      <button class="thumb ${index === 0 ? "is-active" : ""}" type="button" data-slide-index="${index}" aria-label="Abrir ${esc(slide.label)}">
        <img loading="lazy" decoding="async" fetchpriority="low" src="${driveThumb(slide.id, 240)}" alt="${esc(slide.label)}">
        <span>${String(index + 1).padStart(2,"0")}</span>
      </button>`).join("");

    return `
      <div class="preview preview-carousel">
        <div class="carousel-shell" data-carousel>
          <div class="carousel-stage">
            <img class="carousel-main" loading="lazy" decoding="async" fetchpriority="low" src="${driveThumb(item.slides[0].id, 900)}" alt="${esc(item.title)} — Slide 1">
            <button class="carousel-arrow prev" type="button" data-prev aria-label="Slide anterior">‹</button>
            <button class="carousel-arrow next" type="button" data-next aria-label="Próximo slide">›</button>
            <div class="carousel-counter"><strong data-current>01</strong><span>/ ${String(item.slides.length).padStart(2,"0")}</span></div>
          </div>
          <div class="thumbs">${thumbs}</div>
          <div class="carousel-links">
            <a href="${driveView(item.slides[0].id)}" data-open-slide target="_blank" rel="noopener">Abrir slide no Drive ↗</a>
            <a href="${folderView(item.folderId)}" target="_blank" rel="noopener">Abrir pasta completa ↗</a>
          </div>
        </div>
      </div>`;
  }

  function captionBlock(item) {
    if (!item.caption) return "";
    return `
      <div class="caption-block">
        <div class="section-head"><h3>Legenda</h3><button class="copy-btn" type="button" data-copy>Copiar legenda</button></div>
        <div class="caption-text">${esc(item.caption)}</div>
      </div>`;
  }

  function card(item) {
    const mediaLink = item.type === "reel"
      ? `<a class="drive-link" href="${driveView(item.driveId)}" target="_blank" rel="noopener">Abrir vídeo no Drive ↗</a>`
      : `<div class="media-note">Use as setas ou miniaturas para revisar os ${item.slides.length} slides.</div>`;

    return `
      <article class="content-card ${item.type === "carousel" ? "is-carousel" : "is-reel"}" id="content-${item.id}">
        ${item.type === "carousel" ? carouselPreview(item) : reelPreview(item)}
        <div class="content-body">
          <div class="meta"><span class="index">${item.id}</span><span class="format">${esc(item.format)}</span></div>
          <h2>${esc(item.title)}</h2>
          ${mediaLink}
          ${captionBlock(item)}

          <div class="review-box">
            <div class="review-label">Sua revisão</div>
            <div class="review-actions">
              <button class="btn btn-approve" type="button" data-approve>Aprovar conteúdo</button>
              <button class="btn btn-change" type="button" data-change>Pedir ajuste</button>
            </div>
            <div class="adjustment">
              <textarea placeholder="Escreva aqui o que precisa ser ajustado."></textarea>
              <div class="adjustment-footer"><button class="btn btn-change" type="button" data-send-change>Enviar ajuste</button></div>
            </div>
            <div class="state"></div>
          </div>
        </div>
      </article>`;
  }

  async function submit(item, status, comment="") {
    const card = document.getElementById(`content-${item.id}`);
    const buttons = card.querySelectorAll(".review-box button");
    buttons.forEach(btn => btn.disabled = true);
    try {
      const res = await fetch(data.endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          deliveryKey:data.deliveryKey,
          itemId:item.id,
          status,
          comment,
          reviewerName:data.client
        })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ok) throw new Error(payload.error || "submit_failed");
      state.set(item.id, {status, comment});
      renderState(item.id);
      renderCounts();
      card.querySelector(".adjustment").classList.remove("is-open");
      showToast(status === "approved" ? "Conteúdo aprovado ✓" : "Ajuste enviado ✓");
    } catch {
      showToast("Não foi possível enviar. Tente novamente.");
    } finally {
      buttons.forEach(btn => btn.disabled = false);
    }
  }

  function bindReel(item, card) {
    if (item.type !== "reel") return;
    const poster = card.querySelector("[data-load-video]");
    if (!poster) return;
    poster.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.className = "video-frame";
      iframe.src = drivePreview(item.driveId);
      iframe.title = `Preview do conteúdo ${item.title}`;
      iframe.allow = "autoplay; fullscreen";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      poster.replaceWith(iframe);
    }, {once:true});
  }

  function bindCarousel(item, card) {
    if (item.type !== "carousel") return;
    const root = card.querySelector("[data-carousel]");
    const main = root.querySelector(".carousel-main");
    const current = root.querySelector("[data-current]");
    const openSlide = root.querySelector("[data-open-slide]");
    const thumbs = [...root.querySelectorAll("[data-slide-index]")];
    let active = 0;

    function show(index) {
      active = (index + item.slides.length) % item.slides.length;
      const slide = item.slides[active];
      main.src = driveThumb(slide.id, 1000);
      main.alt = `${item.title} — ${slide.label}`;
      current.textContent = String(active + 1).padStart(2,"0");
      openSlide.href = driveView(slide.id);
      thumbs.forEach((thumb, i) => thumb.classList.toggle("is-active", i === active));
    }

    root.querySelector("[data-prev]").addEventListener("click", () => show(active - 1));
    root.querySelector("[data-next]").addEventListener("click", () => show(active + 1));
    thumbs.forEach(thumb => thumb.addEventListener("click", () => show(Number(thumb.dataset.slideIndex))));
    main.addEventListener("click", () => window.open(driveView(item.slides[active].id), "_blank", "noopener"));
  }

  function bind(item) {
    const card = document.getElementById(`content-${item.id}`);
    bindReel(item, card);
    bindCarousel(item, card);

    const copy = card.querySelector("[data-copy]");
    if (copy) copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(item.caption); showToast("Legenda copiada."); }
      catch { showToast("Não foi possível copiar."); }
    });

    card.querySelector("[data-approve]").addEventListener("click", () => submit(item, "approved"));
    card.querySelector("[data-change]").addEventListener("click", () => {
      card.querySelector(".adjustment").classList.toggle("is-open");
      card.querySelector("textarea").focus();
    });
    card.querySelector("[data-send-change]").addEventListener("click", () => {
      const comment = card.querySelector("textarea").value.trim();
      if (!comment) { showToast("Escreva o ajuste antes de enviar."); return; }
      submit(item, "changes", comment);
    });
  }

  async function loadReviews() {
    try {
      const url = `${data.endpoint}?deliveryKey=${encodeURIComponent(data.deliveryKey)}`;
      const res = await fetch(url, {method:"GET"});
      const payload = await res.json();
      if (!res.ok || !payload.ok) return;
      (payload.reviews || []).forEach(r => state.set(r.item_id, {status:r.status, comment:r.comment || ""}));
      data.items.forEach(item => renderState(item.id));
      renderCounts();
    } catch {}
  }

  list.innerHTML = data.items.map(card).join("");
  data.items.forEach(bind);
  renderCounts();
  if ("requestIdleCallback" in window) requestIdleCallback(loadReviews, {timeout:1200});
  else setTimeout(loadReviews, 250);
})();