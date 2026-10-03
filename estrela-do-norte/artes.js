const fallbackArt = Array.from({ length: 6 }, (_, index) => ({
  id: `art-${index + 1}`,
  alt: `Arte exclusiva ${index + 1}`
}));

const grid = document.getElementById("artGrid");
const viewer = document.getElementById("artViewer");
const viewerImage = document.getElementById("artImage");
const viewerDownload = document.getElementById("artDownload");

function render(arts) {
  grid.innerHTML = "";
  const usable = arts?.length ? arts : fallbackArt;

  usable.forEach((art, index) => {
    const card = document.createElement("article");
    card.className = "art-card";

    if (art.src) {
      const img = document.createElement("img");
      img.src = art.src;
      img.alt = art.alt || `Arte ${index + 1}`;
      img.loading = "lazy";
      card.appendChild(img);
      card.addEventListener("click", () => {
        viewerImage.src = art.src;
        viewerImage.alt = art.alt || "Arte Estrela do Norte";
        viewerDownload.href = art.downloadUrl || art.src;
        viewer.classList.add("is-open");
        viewer.setAttribute("aria-hidden", "false");
      });
    } else {
      card.innerHTML = `<div class="placeholder"><strong>ARTE ${String(index + 1).padStart(2, "0")}</strong><span>EM PREPARO</span></div>`;
    }

    grid.appendChild(card);
  });
}

async function init() {
  try {
    const response = await fetch("./api/catalog", { headers: { accept: "application/json" } });
    const catalog = response.ok ? await response.json() : null;
    render(catalog?.artPhotos || []);
  } catch (_) {
    render([]);
  }
}

function closeViewer() {
  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  viewerImage.removeAttribute("src");
}

document.getElementById("artClose").addEventListener("click", closeViewer);
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) closeViewer();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeViewer();
});

init();
