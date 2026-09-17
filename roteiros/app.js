(() => {
  const data = window.NORTHE_SCRIPT_DATA;
  const root = document.querySelector('#app');

  if (!data || !Array.isArray(data.scripts)) {
    root.innerHTML = '<main class="fatal"><strong>Entrega indisponível.</strong><span>Os dados desta revisão não foram encontrados.</span></main>';
    return;
  }

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);

  const storageKey = `northe:script-review:${data.id}`;
  let review = {};
  let openId = null;
  let noteDrafts = {};

  try {
    review = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
  } catch {
    review = {};
  }

  const save = () => localStorage.setItem(storageKey, JSON.stringify(review));
  const decisionFor = (id) => review[id] || { status: 'pending', note: '' };
  const isReviewed = (id) => ['approved', 'changes'].includes(decisionFor(id).status);

  function statusLabel(status) {
    if (status === 'approved') return 'Aprovado';
    if (status === 'changes') return 'Ajuste solicitado';
    return 'Aguardando revisão';
  }

  function statusIcon(status) {
    if (status === 'approved') return '✓';
    if (status === 'changes') return '↻';
    return '○';
  }

  function bodyHtml(text) {
    return String(text || '')
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');
  }

  function hooksHtml(hooks = []) {
    if (!hooks.length) return '';
    return `
      <section class="script-section hooks-section">
        <div class="section-label"><span>HOOKS ALTERNATIVOS</span><small>${hooks.length} opções de entrada</small></div>
        <div class="hook-list">
          ${hooks.map((hook, index) => `
            <div class="hook-item">
              <span>${String(index + 1).padStart(2, '0')}</span>
              <p>${escapeHtml(hook)}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  function progress() {
    const total = data.scripts.length;
    const reviewed = data.scripts.filter((script) => isReviewed(script.id)).length;
    const approved = data.scripts.filter((script) => decisionFor(script.id).status === 'approved').length;
    const changes = data.scripts.filter((script) => decisionFor(script.id).status === 'changes').length;
    return { total, reviewed, approved, changes, pct: total ? Math.round((reviewed / total) * 100) : 0 };
  }

  function scriptCard(script, index) {
    const decision = decisionFor(script.id);
    const meta = [script.format || 'REEL', script.dateLabel].filter(Boolean).join(' · ');

    return `
      <article class="script-card status-${decision.status}" id="roteiro-${script.id}" data-script-card="${script.id}">
        <button class="script-toggle" type="button" data-open="${script.id}" aria-expanded="false">
          <span class="script-number">${script.id}</span>
          <span class="script-heading">
            <span class="script-meta">${escapeHtml(meta)}</span>
            <strong>${escapeHtml(script.title)}</strong>
          </span>
          <span class="script-status">
            <i>${statusIcon(decision.status)}</i>
            <span>${statusLabel(decision.status)}</span>
          </span>
          <span class="chevron" aria-hidden="true">↓</span>
        </button>

        <div class="script-panel">
          <div class="script-panel-inner">
            <div class="script-content">
              <section class="script-section">
                <div class="section-label"><span>ROTEIRO PRINCIPAL</span><small>Texto falado</small></div>
                <div class="spoken-copy">${bodyHtml(script.text)}</div>
              </section>

              ${hooksHtml(script.hooks)}

              <section class="script-section decision-section">
                <div class="section-label"><span>APROVAÇÃO</span><small>Registre sua decisão neste roteiro</small></div>

                <div class="decision-state ${decision.status !== 'pending' ? 'is-visible' : ''}" data-decision-state="${script.id}">
                  ${decision.status === 'approved' ? '<strong>✓ Roteiro aprovado.</strong><p>Esta decisão ficou salva neste dispositivo.</p>' : ''}
                  ${decision.status === 'changes' ? `<strong>↻ Ajuste solicitado.</strong><p>${escapeHtml(decision.note || 'Solicitação registrada.')}</p>` : ''}
                </div>

                <div class="decision-actions">
                  <button class="action-btn approve ${decision.status === 'approved' ? 'is-selected' : ''}" type="button" data-approve="${script.id}">
                    ✓ Aprovar roteiro
                  </button>
                  <button class="action-btn revise ${decision.status === 'changes' ? 'is-selected' : ''}" type="button" data-revise="${script.id}">
                    Pedir ajuste
                  </button>
                </div>

                <div class="revision-box ${decision.status === 'changes' ? 'is-open' : ''}" data-revision-box="${script.id}">
                  <label for="note-${script.id}">O que precisa mudar?</label>
                  <textarea id="note-${script.id}" data-note="${script.id}" placeholder="Escreva aqui o ajuste deste roteiro.">${escapeHtml(noteDrafts[script.id] ?? decision.note ?? '')}</textarea>
                  <div class="revision-actions">
                    <button type="button" class="text-btn" data-cancel-revise="${script.id}">Cancelar</button>
                    <button type="button" class="action-btn confirm" data-confirm-revise="${script.id}">Registrar ajuste</button>
                  </div>
                </div>
              </section>

              <footer class="script-next">
                ${index < data.scripts.length - 1 ? `
                  <button type="button" data-next="${data.scripts[index + 1].id}">
                    <span>PRÓXIMO ROTEIRO</span>
                    <strong>${data.scripts[index + 1].id} — ${escapeHtml(data.scripts[index + 1].title)}</strong>
                    <i>→</i>
                  </button>
                ` : `
                  <div class="end-marker"><span>FIM DA ENTREGA</span><strong>Revise o resumo abaixo para concluir.</strong></div>
                `}
              </footer>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function reviewSummaryText() {
    const p = progress();
    const lines = [
      `REVISÃO DE ROTEIROS — ${data.client.name.toUpperCase()}`,
      data.cycle,
      '',
      `${p.reviewed}/${p.total} revisados · ${p.approved} aprovados · ${p.changes} com ajuste`,
      ''
    ];

    data.scripts.forEach((script) => {
      const d = decisionFor(script.id);
      const icon = d.status === 'approved' ? '✓' : d.status === 'changes' ? '↻' : '○';
      lines.push(`${icon} ${script.id} — ${script.title}`);
      if (d.status === 'changes' && d.note) lines.push(`Ajuste: ${d.note}`);
    });

    lines.push('', 'NORTHE — MADE IN THE NORTH.');
    return lines.join('\n');
  }

  function render() {
    const p = progress();

    root.innerHTML = `
      <div class="site-shell">
        <header class="topbar">
          <a class="brand" href="#top" aria-label="NORTHE"><strong>NORTHE</strong><span>ENTREGA DE ROTEIROS</span></a>
          <div class="top-progress" aria-label="Progresso da revisão">
            <span><b data-reviewed>${p.reviewed}</b>/${p.total} revisados</span>
            <i><b data-progress-bar style="width:${p.pct}%"></b></i>
          </div>
        </header>

        <main id="top">
          <section class="hero">
            <div class="hero-kicker">APROVAÇÃO DE ROTEIROS · ${escapeHtml(data.cycle)}</div>
            <div class="hero-grid">
              <div>
                <h1>ENTREGA DE<br><em>ROTEIROS.</em></h1>
                <p>${escapeHtml(data.intro)}</p>
              </div>
              <aside class="client-lockup">
                <span>CLIENTE</span>
                <strong>${escapeHtml(data.client.name)}</strong>
                <small>${escapeHtml(data.client.descriptor || '')}</small>
                <div class="hero-stat"><b>${String(p.total).padStart(2, '0')}</b><span>roteiros<br>para revisão</span></div>
              </aside>
            </div>
          </section>

          <nav class="script-index" aria-label="Navegação pelos roteiros">
            <div class="index-copy">
              <span>ROTEIROS</span>
              <small>Clique em um número para abrir no próprio lugar.</small>
            </div>
            <div class="index-numbers">
              ${data.scripts.map((script) => {
                const d = decisionFor(script.id);
                return `<button type="button" class="index-chip status-${d.status}" data-jump="${script.id}" aria-label="Abrir roteiro ${script.id}"><span>${script.id}</span><i>${statusIcon(d.status)}</i></button>`;
              }).join('')}
            </div>
          </nav>

          <section class="scripts-list">
            ${data.scripts.map(scriptCard).join('')}
          </section>

          <section class="completion ${p.reviewed === p.total ? 'is-complete' : ''}" id="resumo">
            <span class="eyebrow">RESUMO DA REVISÃO</span>
            <div class="completion-grid">
              <div>
                <h2>${p.reviewed === p.total ? 'REVISÃO CONCLUÍDA.' : 'QUASE LÁ.'}</h2>
                <p data-completion-copy>${p.reviewed === p.total ? 'Todos os roteiros receberam uma decisão.' : `Ainda faltam ${p.total - p.reviewed} roteiro(s) para revisar.`}</p>
              </div>
              <div class="summary-stats">
                <div><b data-summary-approved>${p.approved}</b><span>Aprovados</span></div>
                <div><b data-summary-changes>${p.changes}</b><span>Com ajuste</span></div>
                <div><b data-summary-left>${p.total - p.reviewed}</b><span>Faltando</span></div>
              </div>
            </div>
            <div class="summary-actions">
              <button type="button" class="action-btn summary-copy" data-copy-summary>Copiar resumo</button>
              <button type="button" class="action-btn summary-share" data-share-summary>Compartilhar revisão →</button>
            </div>
          </section>
        </main>

        <footer class="site-footer"><strong>NORTHE</strong><span>MADE IN THE NORTH.</span></footer>
        <div class="toast" role="status" aria-live="polite"></div>
      </div>
    `;

    bind();
    updateProgressUI();

    const fromHash = location.hash.match(/^#roteiro-(\d{2})$/)?.[1];
    const firstPending = data.scripts.find((script) => !isReviewed(script.id))?.id;
    openScript(fromHash || firstPending || data.scripts[0]?.id, false);
  }

  function toast(message) {
    const el = document.querySelector('.toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1900);
  }

  function openScript(id, shouldScroll = true) {
    const card = document.querySelector(`[data-script-card="${id}"]`);
    if (!card) return;

    const same = openId === id;
    document.querySelectorAll('[data-script-card]').forEach((item) => {
      const expanded = item === card && !same;
      item.classList.toggle('is-open', expanded);
      item.querySelector('.script-toggle')?.setAttribute('aria-expanded', String(expanded));
    });

    if (same) {
      openId = null;
      history.replaceState(null, '', location.pathname + location.search);
      return;
    }

    openId = id;
    history.replaceState(null, '', `#roteiro-${id}`);

    document.querySelectorAll('.index-chip').forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.jump === id);
    });

    if (shouldScroll) {
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }

  function setDecision(id, status, note = '') {
    review[id] = { status, note, updatedAt: new Date().toISOString() };
    save();

    const card = document.querySelector(`[data-script-card="${id}"]`);
    if (card) {
      card.classList.remove('status-pending', 'status-approved', 'status-changes');
      card.classList.add(`status-${status}`);

      const statusNode = card.querySelector('.script-status');
      if (statusNode) statusNode.innerHTML = `<i>${statusIcon(status)}</i><span>${statusLabel(status)}</span>`;

      card.querySelector('[data-approve]')?.classList.toggle('is-selected', status === 'approved');
      card.querySelector('[data-revise]')?.classList.toggle('is-selected', status === 'changes');

      const stateNode = card.querySelector('[data-decision-state]');
      if (stateNode) {
        stateNode.classList.add('is-visible');
        stateNode.innerHTML = status === 'approved'
          ? '<strong>✓ Roteiro aprovado.</strong><p>Esta decisão ficou salva neste dispositivo.</p>'
          : `<strong>↻ Ajuste solicitado.</strong><p>${escapeHtml(note || 'Solicitação registrada.')}</p>`;
      }
    }

    const chip = document.querySelector(`[data-jump="${id}"]`);
    if (chip) {
      chip.classList.remove('status-pending', 'status-approved', 'status-changes');
      chip.classList.add(`status-${status}`);
      const icon = chip.querySelector('i');
      if (icon) icon.textContent = statusIcon(status);
    }

    updateProgressUI();
  }

  function updateProgressUI() {
    const p = progress();
    document.querySelectorAll('[data-reviewed]').forEach((el) => el.textContent = p.reviewed);
    const bar = document.querySelector('[data-progress-bar]');
    if (bar) bar.style.width = `${p.pct}%`;

    const completion = document.querySelector('.completion');
    if (completion) completion.classList.toggle('is-complete', p.reviewed === p.total);

    const title = completion?.querySelector('h2');
    if (title) title.textContent = p.reviewed === p.total ? 'REVISÃO CONCLUÍDA.' : 'QUASE LÁ.';

    const copy = document.querySelector('[data-completion-copy]');
    if (copy) copy.textContent = p.reviewed === p.total
      ? 'Todos os roteiros receberam uma decisão.'
      : `Ainda faltam ${p.total - p.reviewed} roteiro(s) para revisar.`;

    const approved = document.querySelector('[data-summary-approved]');
    const changes = document.querySelector('[data-summary-changes]');
    const left = document.querySelector('[data-summary-left]');
    if (approved) approved.textContent = p.approved;
    if (changes) changes.textContent = p.changes;
    if (left) left.textContent = p.total - p.reviewed;
  }

  function bind() {
    document.querySelectorAll('[data-open]').forEach((button) => {
      button.addEventListener('click', () => openScript(button.dataset.open));
    });

    document.querySelectorAll('[data-jump]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.jump;
        if (openId === id) {
          document.querySelector(`[data-script-card="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        openScript(id);
      });
    });

    document.querySelectorAll('[data-next]').forEach((button) => {
      button.addEventListener('click', () => openScript(button.dataset.next));
    });

    document.querySelectorAll('[data-note]').forEach((textarea) => {
      textarea.addEventListener('input', () => { noteDrafts[textarea.dataset.note] = textarea.value; });
    });

    document.querySelectorAll('[data-approve]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.approve;
        setDecision(id, 'approved', '');
        const box = document.querySelector(`[data-revision-box="${id}"]`);
        box?.classList.remove('is-open');
        toast('✓ Roteiro aprovado');
      });
    });

    document.querySelectorAll('[data-revise]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.revise;
        const box = document.querySelector(`[data-revision-box="${id}"]`);
        box?.classList.add('is-open');
        setTimeout(() => document.querySelector(`[data-note="${id}"]`)?.focus(), 180);
      });
    });

    document.querySelectorAll('[data-cancel-revise]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.cancelRevise;
        document.querySelector(`[data-revision-box="${id}"]`)?.classList.remove('is-open');
      });
    });

    document.querySelectorAll('[data-confirm-revise]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.confirmRevise;
        const textarea = document.querySelector(`[data-note="${id}"]`);
        const note = textarea?.value.trim() || '';
        if (!note) {
          textarea?.focus();
          toast('Descreva o ajuste primeiro');
          return;
        }
        noteDrafts[id] = note;
        setDecision(id, 'changes', note);
        document.querySelector(`[data-revision-box="${id}"]`)?.classList.remove('is-open');
        toast('↻ Ajuste registrado');
      });
    });

    document.querySelector('[data-copy-summary]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(reviewSummaryText());
        toast('Resumo copiado');
      } catch {
        toast('Não foi possível copiar');
      }
    });

    document.querySelector('[data-share-summary]')?.addEventListener('click', async () => {
      const text = reviewSummaryText();
      if (navigator.share) {
        try {
          await navigator.share({ title: `Revisão de roteiros — ${data.client.name}`, text });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  render();
})();
