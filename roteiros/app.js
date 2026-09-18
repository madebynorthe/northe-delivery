(() => {
  const data = window.NORTHE_SCRIPT_DATA;
  const nav = document.querySelector('#nav');
  if (!data || !nav || !Array.isArray(data.scripts)) return;

  let active = null;
  const storageKey = data.storageKey || `northe-script-review:${data.id}`;
  const state = JSON.parse(localStorage.getItem(storageKey) || '{}');

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);

  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const scriptById = (id) => data.scripts.find((script) => script.id === id);

  function getState(id) {
    return state[id] || state[Number(id)] || {};
  }

  function statusText(status) {
    if (status === 'ok') return 'APROVADO';
    if (status === 'chg') return 'PEDIR AJUSTE';
    return 'AGUARDANDO REVISÃO';
  }

  function statusColor(status) {
    if (status === 'ok') return '#35533d';
    if (status === 'chg') return '#8b3e33';
    return '#77756f';
  }

  function progress() {
    const reviewed = data.scripts.filter((script) => getState(script.id).status).length;
    document.querySelector('#pl').textContent = `${reviewed}/${data.scripts.length}`;
    document.querySelector('#pf').style.width = `${(reviewed / data.scripts.length) * 100}%`;
  }

  function panelMarkup(script) {
    const st = getState(script.id);
    const index = data.scripts.findIndex((item) => item.id === script.id);
    const next = data.scripts[index + 1];
    const hooks = Array.isArray(script.hooks) ? script.hooks : [];
    const reviewLabel = data.reviewLabel || (hooks.length ? 'Roteiro + 3 hooks' : 'Roteiro final');

    return `
      <section class="panel" id="panel" data-panel-for="${script.id}">
        <div class="toprow">
          <div>
            <div class="badges">
              <span class="badge">Reel ${script.id}</span>
              <span class="badge">${escapeHtml(script.date)}</span>
              <span class="badge">${escapeHtml(script.role)}</span>
            </div>
            <h2>${escapeHtml(script.title)}</h2>
          </div>
          <b style="font-size:12px;color:${statusColor(st.status)}">${statusText(st.status)}</b>
        </div>

        <div class="meta">
          <div><small>Ideia central</small>${escapeHtml(script.idea)}</div>
          <div><small>Formato</small>${escapeHtml(script.format)}</div>
          <div><small>Revisão</small>${escapeHtml(reviewLabel)}</div>
        </div>

        <div style="margin-top:24px">
          <div class="ey" style="color:#77756f">ROTEIRO PRINCIPAL</div>
          <div class="script" style="margin-top:10px">${escapeHtml(script.text)}</div>
        </div>

        ${hooks.length ? `
        <div style="margin-top:24px">
          <div class="ey" style="color:#77756f">${hooks.length} HOOK${hooks.length === 1 ? '' : 'S'} ALTERNATIVO${hooks.length === 1 ? '' : 'S'}</div>
          <div class="hooks" style="margin-top:10px">
            ${hooks.map((hook, i) => `<div class="hook"><b>${i + 1}.</b> ${escapeHtml(hook)}</div>`).join('')}
          </div>
        </div>` : ''}

        <div style="border-top:1px solid #dedad1;margin-top:24px;padding-top:20px">
          <div class="ey" style="color:#77756f">SUA DECISÃO</div>
          <div class="decision" style="margin-top:10px">
            <button class="ok ${st.status === 'ok' ? 'sel' : ''}" data-a="ok">✓ Aprovar roteiro</button>
            <button class="chg ${st.status === 'chg' ? 'sel' : ''}" data-a="chg">✎ Pedir ajuste</button>
          </div>
          <textarea placeholder="Ex.: ajustar uma frase, simplificar um termo, trocar um hook…">${escapeHtml(st.note || '')}</textarea>
        </div>

        ${next ? `<div class="nextbar"><button type="button" data-next="${next.id}">Próximo roteiro →</button></div>` : ''}
      </section>
    `;
  }

  function renderButtons() {
    nav.innerHTML = data.scripts.map((script) => `
      <button type="button" class="${active === script.id ? 'active' : ''}" data-id="${script.id}">
        <div class="n">${script.id}</div>
        <div class="t">${escapeHtml(script.title)}</div>
        <div class="d">${escapeHtml(script.date)}</div>
      </button>
    `).join('');

    nav.querySelectorAll('button[data-id]').forEach((button) => {
      button.onclick = () => openScript(button.dataset.id);
    });
  }

  function insertionPointFor(id) {
    const buttons = [...nav.querySelectorAll('button[data-id]')];
    const current = buttons.find((button) => button.dataset.id === id);
    if (!current) return null;

    if (window.matchMedia('(max-width:760px)').matches) return current;

    const index = buttons.indexOf(current);
    const endOfRowIndex = Math.min(buttons.length - 1, Math.floor(index / 3) * 3 + 2);
    return buttons[endOfRowIndex];
  }

  function mountPanel(id, shouldScroll = true) {
    const script = scriptById(id);
    const point = insertionPointFor(id);
    if (!script || !point) return;

    point.insertAdjacentHTML('afterend', panelMarkup(script));
    bindPanel(script);

    if (shouldScroll) {
      requestAnimationFrame(() => {
        nav.querySelector('#panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function openScript(id, shouldScroll = true) {
    if (active === id) {
      active = null;
      renderButtons();
      return;
    }

    active = id;
    renderButtons();
    mountPanel(id, shouldScroll);
  }

  function refreshOpenPanel(id) {
    active = id;
    renderButtons();
    mountPanel(id, false);
  }

  function bindPanel(script) {
    const panel = nav.querySelector('#panel');
    if (!panel) return;

    const textarea = panel.querySelector('textarea');

    panel.querySelectorAll('[data-a]').forEach((button) => {
      button.onclick = () => {
        state[script.id] = {
          ...getState(script.id),
          status: button.dataset.a,
          note: textarea.value
        };
        delete state[Number(script.id)];
        save();
        progress();
        refreshOpenPanel(script.id);
      };
    });

    textarea.oninput = (event) => {
      state[script.id] = { ...getState(script.id), note: event.target.value };
      delete state[Number(script.id)];
      save();
    };

    panel.querySelector('[data-next]')?.addEventListener('click', (event) => {
      openScript(event.currentTarget.dataset.next);
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!active) return;
      renderButtons();
      mountPanel(active, false);
    }, 120);
  });

  renderButtons();
  progress();
})();