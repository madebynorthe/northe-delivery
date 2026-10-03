const ratios = ["portrait", "landscape", "tall", "square", "portrait", "landscape"];
const makePhotos = (owner, amount = 9) => Array.from({ length: amount }, (_, index) => ({
  id: `${owner}-${index + 1}`,
  alt: `${owner} — foto ${index + 1}`,
  ratio: ratios[index % ratios.length]
}));

const driveThumb = (id, width = 1600) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;

const driveDownload = (id) =>
  `https://drive.google.com/uc?export=download&id=${id}`;

const p = (id, alt, ratio = "portrait", width = 1600) => ({
  id,
  alt,
  ratio,
  src: driveThumb(id, width),
  downloadUrl: driveDownload(id)
});

const fallback = {
  heroUrl: driveThumb("1c7RooMq7IFIQBjMvWVZcBu9QGc6zhBCC", 2400),
  athletes: [
    {
      id: "23",
      name: "CAMISA 23",
      number: "23",
      role: "ATLETA",
      portrait: driveThumb("1FwyDH2htX-TAGQ4oeUIG-zA1hKHiO8DF", 1200),
      photos: [
        p("1bUkV86uK6VoL9C8ZcNXnSCN2AuUPkG2p", "Camisa 23 · retrato com bola"),
        p("17PRvkJ2JuvSvktUg_x7OumApbKFXUfh5", "Camisa 23 · energia"),
        p("18HHvdBah6qZJGI9_8cOKSiBU6NRpOI6u", "Camisa 23 · pose com bola"),
        p("1FwyDH2htX-TAGQ4oeUIG-zA1hKHiO8DF", "Camisa 23 · retrato de corpo")
      ]
    },
    {
      id: "07",
      name: "CAMISA 7",
      number: "7",
      role: "ATLETA",
      portrait: driveThumb("1BjUOxukTNrpe3H5ZlPZk11EXJyOQm18T", 1200),
      photos: [
        p("1BjUOxukTNrpe3H5ZlPZk11EXJyOQm18T", "Camisa 7 · retrato"),
        p("1rCJTmgfp7BBtObeBh_3WO43vWe04vaVs", "Camisa 7 · retrato sorrindo")
      ]
    },
    {
      id: "09",
      name: "CAMISA 9",
      number: "9",
      role: "ATLETA",
      portrait: driveThumb("1zlH2ctPDCiLPPTYifOzV9fIBy0F9d3hN", 1200),
      photos: [
        p("1zlH2ctPDCiLPPTYifOzV9fIBy0F9d3hN", "Camisa 9 · retrato"),
        p("1sYZx4XXV7Cys1n3B_gDunJ1hq9fdvcH3", "Camisa 9 · bola em primeiro plano")
      ]
    },
    {
      id: "29",
      name: "CAMISA 29",
      number: "29",
      role: "ATLETA",
      portrait: driveThumb("1i0g8IDU_jMKV42mDR9vPxl_7xczoZxvG", 1200),
      photos: [p("1i0g8IDU_jMKV42mDR9vPxl_7xczoZxvG", "Camisa 29 · retrato")]
    },
    {
      id: "11",
      name: "CAMISA 11",
      number: "11",
      role: "ATLETA",
      portrait: driveThumb("1drElGvAd8nv1gh-jMVFUUfxoqf6xTlO3", 1200),
      photos: [p("1drElGvAd8nv1gh-jMVFUUfxoqf6xTlO3", "Camisa 11 · costas e bola")]
    }
  ],
  variedPhotos: [
    p("18HHvdBah6qZJGI9_8cOKSiBU6NRpOI6u", "Preview · Camisa 23"),
    p("1rCJTmgfp7BBtObeBh_3WO43vWe04vaVs", "Preview · Camisa 7"),
    p("1sYZx4XXV7Cys1n3B_gDunJ1hq9fdvcH3", "Preview · Camisa 9"),
    p("1i0g8IDU_jMKV42mDR9vPxl_7xczoZxvG", "Preview · Camisa 29"),
    p("1drElGvAd8nv1gh-jMVFUUfxoqf6xTlO3", "Preview · Camisa 11")
  ],
  teamPhotos: [
    p("1c7RooMq7IFIQBjMvWVZcBu9QGc6zhBCC", "Estrela do Norte · foto do time", "landscape", 2200)
  ],
  artPhotos: makePhotos("Arte exclusiva", 8)
};

let catalog = fallback;
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalGallery = document.getElementById("modalGallery");
const photoViewer = document.getElementById("photoViewer");
const viewerImage = document.getElementById("viewerImage");
const viewerCaption = document.getElementById("viewerCaption");
const downloadPhoto = document.getElementById("downloadPhoto");

function openPhotoViewer(photo) {
  if (!photo?.src) return;
  viewerImage.src = photo.src;
  viewerImage.alt = photo.alt || "Foto Estrela do Norte";
  viewerCaption.textContent = photo.alt || "Estrela do Norte";
  downloadPhoto.href = photo.downloadUrl || photo.src;
  photoViewer.classList.add("is-open");
  photoViewer.setAttribute("aria-hidden", "false");
}

function closePhotoViewer() {
  photoViewer.classList.remove("is-open");
  photoViewer.setAttribute("aria-hidden", "true");
  viewerImage.removeAttribute("src");
}

function photoTile(photo, index) {
  const article = document.createElement("article");
  article.className = `photo-tile ratio-${photo.ratio || "portrait"}${photo.src ? " has-image" : ""}`;

  if (photo.src) {
    const button = document.createElement("button");
    button.className = "photo-open";
    button.type = "button";
    button.setAttribute("aria-label", `Abrir ${photo.alt || "foto"}`);

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt || "Foto Estrela do Norte";
    img.loading = "lazy";
    img.decoding = "async";

    button.appendChild(img);
    button.addEventListener("click", () => openPhotoViewer(photo));
    article.appendChild(button);
  }

  article.insertAdjacentHTML(
    "beforeend",
    `<div class="photo-index">${String(index + 1).padStart(2, "0")}</div><div class="photo-caption">${photo.alt || "Estrela do Norte"}</div>`
  );
  return article;
}

function renderPreview(targetId, photos) {
  const target = document.getElementById(targetId);
  target.innerHTML = "";
  photos.slice(0, 3).forEach((photo, index) => target.appendChild(photoTile(photo, index)));
}

function renderAthletes() {
  const grid = document.getElementById("athleteGrid");
  grid.innerHTML = "";
  catalog.athletes.forEach((athlete, index) => {
    const button = document.createElement("button");
    button.className = "athlete-card observe-card";
    button.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;

    const image = athlete.portrait
      ? `<img src="${athlete.portrait}" alt="${athlete.name}" loading="lazy">`
      : "";

    button.innerHTML = `
      <div class="athlete-portrait">
        ${image}
        <span class="portrait-number">${athlete.number || String(index + 1).padStart(2, "0")}</span>
        <div class="portrait-shade"></div>
      </div>
      <div class="athlete-meta">
        <div><span>SELEÇÃO INDIVIDUAL</span><h3>${athlete.name}</h3></div>
        <div class="view-arrow">↗</div>
      </div>
      <div class="athlete-cta">VER MINHAS FOTOS</div>
    `;

    button.addEventListener("click", () =>
      openGallery(athlete.name, "ENTREGA INDIVIDUAL · NORTHE", athlete.photos)
    );
    grid.appendChild(button);
  });
  observeCards();
}

function openGallery(title, eyebrow, photos) {
  modalTitle.textContent = title;
  modalEyebrow.textContent = eyebrow;
  modalGallery.innerHTML = "";
  (photos || []).forEach((photo, index) => modalGallery.appendChild(photoTile(photo, index)));
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("closeModal").focus();
}

function closeGallery() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function wireButtons() {
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.open;
      if (type === "varied") openGallery("Variadas", "ENTREGA COLETIVA · NORTHE", catalog.variedPhotos);
      if (type === "team") openGallery("O time inteiro", "ESTRELA DO NORTE · NORTHE", catalog.teamPhotos);
    });
  });

  document.getElementById("closeModal").addEventListener("click", closeGallery);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeGallery();
  });

  document.getElementById("viewerClose").addEventListener("click", closePhotoViewer);
  photoViewer.addEventListener("click", (event) => {
    if (event.target === photoViewer) closePhotoViewer();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (photoViewer.classList.contains("is-open")) closePhotoViewer();
    else if (modal.classList.contains("is-open")) closeGallery();
  });
}

function observeCards() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
    { threshold: 0.08 }
  );
  document.querySelectorAll(".observe-card").forEach((element) => observer.observe(element));
}

function setupObservers() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".observe").forEach((element) => observer.observe(element));
}

function setupParallax() {
  const heroBg = document.getElementById("heroBg");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;

  const update = () => {
    const y = Math.min(window.scrollY * 0.1, 54);
    heroBg.style.transform = `translate3d(0, ${y}px, 0)`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

async function loadCatalog() {
  try {
    const response = await fetch("./api/catalog", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const live = await response.json();
    if (live?.athletes?.length) catalog = live;
  } catch (_) {
    catalog = fallback;
  }
}

async function init() {
  await loadCatalog();

  if (catalog.heroUrl) {
    const hero = document.getElementById("heroPhoto");
    hero.style.backgroundImage = `url("${catalog.heroUrl}")`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center 43%";
  }

  if (catalog.teamPhotos?.[0]?.src) {
    const teamFrame = document.getElementById("teamFrame");
    teamFrame.style.backgroundImage = `linear-gradient(180deg, rgba(7,30,70,.02), rgba(3,8,17,.28)), url("${catalog.teamPhotos[0].src}")`;
    teamFrame.style.backgroundSize = "cover";
    teamFrame.style.backgroundPosition = "center";
  }

  renderAthletes();
  renderPreview("variedPreview", catalog.variedPhotos);
  wireButtons();
  setupObservers();
  setupParallax();

  requestAnimationFrame(() => document.body.classList.add("is-ready"));
}

init();
