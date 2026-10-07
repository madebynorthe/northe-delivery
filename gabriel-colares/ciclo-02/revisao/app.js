(() => {
  const data = window.GABRIEL_DELIVERY;
  const revisionIds = new Set(["05","11","12"]);
  const roundStartedAt = new Date("2026-10-07T00:00:00.000Z").getTime();
  const items = data.items.filter(item => revisionIds.has(item.id));
  const list = document.getElementById("contentList");
  const reviewCount = document.getElementById("reviewCount");
  const approvedCount = document.getElementById("approvedCount");
  const changesCount = document.getElementById("changesCount");
  const completion = document.getElementById("completion");
  const toast = document.getElementById("toast");
  const state = new Map();

  const esc = (value="") => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
  function renderCounts(){
    const values=[...state.values()];
    const approved=values.filter(v=>v.status==="approved").length;
    const changes=values.filter(v=>v.status==="changes").length;
    reviewCount.textContent=`${approved+changes}/${items.length}`;
    approvedCount.textContent=approved;
    changesCount.textContent=changes;
    completion.classList.toggle("is-visible", approved+changes===items.length);
  }
  function renderState(itemId){
    const card=document.getElementById(`content-${itemId}`);
    if(!card)return;
    const box=card.querySelector(".state");
    const review=state.get(itemId);
    if(!review){box.className="state";box.textContent="";return}
    if(review.status==="approved"){box.className="state approved is-visible";box.textContent="✓ Nova versão aprovada."}
    else{box.className="state changes is-visible";box.textContent=review.comment?`Novo ajuste solicitado: ${review.comment}`:"Novo ajuste solicitado."}
  }
  function card(item){
    const driveView=`https://drive.google.com/file/d/${item.driveId}/view`;
    const drivePreview=`https://drive.google.com/file/d/${item.driveId}/preview`;
    return `
      <article class="content-card" id="content-${item.id}">
        <div class="preview"><iframe class="video-frame" loading="lazy" src="${drivePreview}" title="Preview do conteúdo ${esc(item.title)}" allow="autoplay; fullscreen" allowfullscreen></iframe></div>
        <div class="content-body">
          <div class="meta"><span class="index">${item.id}</span><span class="format">${esc(item.format)}</span></div>
          <h2>${esc(item.title)}</h2>
          <a class="drive-link" href="${driveView}" target="_blank" rel="noopener">Abrir vídeo no Drive ↗</a>

          <div class="revision-note">
            <span>Ajuste solicitado anteriormente</span>
            <p>${esc(item.previousFeedback || "Conteúdo atualizado para nova revisão.")}</p>
          </div>

          <div class="caption-block">
            <div class="section-head"><h3>Legenda</h3><button class="copy-btn" type="button" data-copy>Copiar legenda</button></div>
            <div class="caption-text">${esc(item.caption)}</div>
          </div>

          <div class="review-box">
            <div class="review-label">Nova revisão</div>
            <div class="review-actions">
              <button class="btn btn-approve" type="button" data-approve>Aprovar nova versão</button>
              <button class="btn btn-change" type="button" data-change>Pedir novo ajuste</button>
            </div>
            <div class="adjustment">
              <textarea placeholder="Escreva aqui o que ainda precisa ser ajustado."></textarea>
              <div class="adjustment-footer"><button class="btn btn-change" type="button" data-send-change>Enviar ajuste</button></div>
            </div>
            <div class="state"></div>
          </div>
        </div>
      </article>`;
  }
  async function submit(item,status,comment=""){
    const card=document.getElementById(`content-${item.id}`);
    const buttons=card.querySelectorAll("button");buttons.forEach(btn=>btn.disabled=true);
    try{
      const res=await fetch(data.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deliveryKey:data.deliveryKey,itemId:item.id,status,comment,reviewerName:data.client})});
      const payload=await res.json().catch(()=>({}));
      if(!res.ok||!payload.ok)throw new Error();
      state.set(item.id,{status,comment});
      renderState(item.id);renderCounts();
      card.querySelector(".adjustment").classList.remove("is-open");
      showToast(status==="approved"?"Nova versão aprovada ✓":"Novo ajuste enviado ✓");
    }catch{showToast("Não foi possível enviar. Tente novamente.")}
    finally{buttons.forEach(btn=>btn.disabled=false)}
  }
  function bind(item){
    const card=document.getElementById(`content-${item.id}`);
    card.querySelector("[data-copy]").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(item.caption);showToast("Legenda copiada.")}catch{showToast("Não foi possível copiar.")}});
    card.querySelector("[data-approve]").addEventListener("click",()=>submit(item,"approved"));
    card.querySelector("[data-change]").addEventListener("click",()=>{card.querySelector(".adjustment").classList.toggle("is-open");card.querySelector("textarea").focus()});
    card.querySelector("[data-send-change]").addEventListener("click",()=>{const comment=card.querySelector("textarea").value.trim();if(!comment){showToast("Escreva o ajuste antes de enviar.");return}submit(item,"changes",comment)});
  }
  async function loadReviews(){
    try{
      const res=await fetch(`${data.endpoint}?deliveryKey=${encodeURIComponent(data.deliveryKey)}`);
      const payload=await res.json();
      if(!res.ok||!payload.ok)return;
      (payload.reviews||[]).forEach(r=>{
        if(!revisionIds.has(r.item_id))return;
        const updated=new Date(r.updated_at).getTime();
        if(Number.isFinite(updated)&&updated>=roundStartedAt)state.set(r.item_id,{status:r.status,comment:r.comment||""});
      });
      items.forEach(item=>renderState(item.id));renderCounts();
    }catch{}
  }
  list.innerHTML=items.map(card).join("");
  items.forEach(bind);
  renderCounts();loadReviews();
})();