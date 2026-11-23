(function () {
  'use strict';

  var scripts = []
    .concat(window.LAVAREDA_DECEMBER || [])
    .concat(window.LAVAREDA_JANUARY || []);
  if (!scripts.length) return;

  var $ = function (selector) { return document.querySelector(selector); };
  var $$ = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };
  var escapeHtml = function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (s) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s];
    });
  };
  var modelInfo = {
    palestrinha: {label:'Palestrinha',help:'O advogado apresenta um tema por quadros sucessivos. Desenhos de marcador, calendários e números aparecem no momento da explicação.',prepare:'Gravar em pé, com espaço lateral para os slides. Apontar para as informações e voltar o olhar à câmera.'},
    contraste: {label:'Contraste',help:'O vídeo coloca dois cenários lado a lado para deixar a diferença jurídica evidente. Cada bloco revela um novo detalhe.',prepare:'Gravar dois lados/enquadramentos no mesmo ambiente; uma situação em cada posição. O corte sustenta a comparação.'},
    pergunta: {label:'Pergunta e resposta',help:'Alguém apresenta uma dúvida real e o advogado responde diretamente. A identificação com a pergunta é o ponto de entrada.',prepare:'O advogado inicia em uma ação natural. Outra pessoa faz uma pergunta fora do quadro; a câmera aproxima na resposta.'},
    conversa: {label:'Conversa no mesmo ambiente',help:'Um diálogo com perguntas, objeções e esclarecimentos progressivos. O ritmo é determinado pelas réplicas.',prepare:'Gravar duas posições no mesmo escritório; alternar plano e contraplano, evitando uma encenação exagerada.'}
  };
  var month = 'dezembro';
  var active = null;
  var frame = 0;
  var playing = null;
  var toastTimer = null;
  var readingFont = 28;
  var storageKey = 'northe-lavareda-dez26-jan27-review-v1';
  var review = {};
  try { review = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (e) { review = {}; }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(review)); }
    catch (e) { notify('Não foi possível salvar neste navegador. Copie sua revisão.'); }
  }
  function stateOf(script) { return review[script.id] || {}; }
  function statusText(v) { return v === 'approved' ? '✓ Aprovado' : v === 'adjust' ? '✎ Ajuste solicitado' : 'Aguardando revisão'; }
  function notify(text) {
    var el = $('#toast'); el.textContent = text; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3000);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { notify('Texto copiado!'); }).catch(function () { fallbackCopy(text); });
    }
    fallbackCopy(text); return Promise.resolve();
  }
  function fallbackCopy(text) {
    var temp = document.createElement('textarea'); temp.value = text; document.body.appendChild(temp);
    temp.select();
    try { document.execCommand('copy'); notify('Texto copiado!'); }
    catch (e) { notify('Selecione e copie o texto manualmente.'); }
    temp.remove();
  }
  function scriptText(script) {
    if (script.slides) return script.slides.map(function (s) { return s.talk; }).join('\n\n');
    if (script.turns) return script.turns.map(function (t) { return t[0] + ': ' + t[1]; }).join('\n\n');
    return script.text || '';
  }
  function monthScripts() { return scripts.filter(function (s) { return s.month === month; }).sort(function(a,b){return a.number-b.number;}); }
  function monthSwitch(next, scroll) {
    month = next;
    $$('[data-month]').forEach(function (button) {
      var selected = button.getAttribute('data-month') === month;
      button.classList.toggle('active', selected);
      if (button.getAttribute('role') === 'tab') button.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    $('#month-eyebrow').textContent = month === 'dezembro' ? 'DEZEMBRO DE 2026' : 'JANEIRO DE 2027';
    $('#month-title').textContent = month === 'dezembro' ? 'Seu primeiro ciclo de vídeos' : 'O segundo ciclo já está planejado';
    $('#month-description').textContent = month === 'dezembro'
      ? '10 vídeos jurídicos. Natal e Ano-Novo são duas peças institucionais separadas.'
      : '12 vídeos jurídicos com temas atuais e conteúdos de orientação.';
    renderCards();
    if (scroll) $('#cycle-section').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function stageHTML(script, step) {
    var title = step && (step.board || step.title) || script.title;
    var model = script.model;
    if (model === 'palestrinha') {
      return '<div class="sample-stage stage-palestrinha"><div class="stage-board">'
        + '<small>QUADRO BRANCO / PILOTO AZUL</small><h4>' + escapeHtml(title) + '</h4>'
        + '<div class="stage-ink"></div><small>✎ ' + escapeHtml((step && step.draw) || 'Desenhos aparecem conforme a fala.') + '</small>'
        + '</div><span class="stage-marker">✎</span></div>';
    }
    if (model === 'contraste') {
      var l = script.shots && script.shots[0] ? script.shots[0][0] : 'SITUAÇÃO 01';
      var r = script.shots && script.shots[1] ? script.shots[1][0] : 'SITUAÇÃO 02';
      return '<div class="sample-stage stage-contraste">'
        + '<div class="stage-half"><b>01</b><span>' + escapeHtml(l) + '</span><small>PRIMEIRO CENÁRIO</small></div>'
        + '<div class="stage-half"><b>02</b><span>' + escapeHtml(r) + '</span><small>SEGUNDO CENÁRIO</small></div></div>';
    }
    if (model === 'pergunta') {
      var question = script.turns && script.turns[0] ? script.turns[0][1] : script.hook;
      if (question.length > 90) question = question.slice(0,87) + '...';
      return '<div class="sample-stage stage-pergunta"><div class="stage-face"></div>'
        + '<div class="stage-bubble">? ' + escapeHtml(question) + '</div>'
        + '<div class="mini-answer">' + (step && step.title && step.title !== 'A PERGUNTA' ? 'RESPOSTA CLARA ✓' : 'PERGUNTA REAL') + '</div></div>';
    }
    return '<div class="sample-stage stage-conversa"><div class="duo-face"></div><div class="duo-face second"></div>'
      + '<div class="stage-dialogue">' + escapeHtml(step && step.title || 'PERGUNTA → RESPOSTA') + '</div></div>';
  }
  function formatGallery() {
    var models = ['palestrinha','contraste','pergunta','conversa'];
    var examples = {
      palestrinha:'Quadro branco + desenhos que explicam o assunto por etapas.',
      contraste:'Dois cenários em tela para entender o que muda.',
      pergunta:'Uma pergunta do público com resposta direta do advogado.',
      conversa:'Diálogo natural, com objeções e respostas no mesmo espaço.'
    };
    $('#format-gallery').innerHTML = models.map(function (m) {
      var sample = scripts.find(function (s) { return s.model === m; });
      var amount = scripts.filter(function(s){return s.model===m;}).length;
      return '<button type="button" class="format-card" data-model-example="' + m + '" aria-label="Ver exemplo de ' + escapeHtml(modelInfo[m].label) + '">'
        + '<div class="format-preview">' + stageHTML(sample, sample.slides && sample.slides[0]) + '</div>'
        + '<div class="format-text"><h3>' + escapeHtml(modelInfo[m].label) + '</h3><p>' + examples[m] + '</p>'
        + '<div class="format-foot"><span>' + amount + ' ROTEIROS</span><span>VER EXEMPLO ↗</span></div></div></button>';
    }).join('');
  }
  function cardHTML(script) {
    var st = stateOf(script);
    var result = st.status || '';
    return '<button type="button" class="script-card" data-open="' + script.id + '" aria-label="Abrir roteiro ' + script.number + ', ' + escapeHtml(script.title) + '">'
      + '<div class="card-top" data-type="' + script.model + '"><span class="card-label">' + escapeHtml(modelInfo[script.model].label).toUpperCase() + '</span>'
      + '<span class="card-index">' + String(script.number).padStart(2,'0') + '</span>' + stageHTML(script,script.slides && script.slides[0]) + '</div>'
      + '<div class="card-body"><div class="card-who">' + escapeHtml(script.lawyer) + ' / ' + escapeHtml(script.area) + '</div>'
      + '<h3>' + escapeHtml(script.title) + '</h3><p class="card-status ' + result + '">' + statusText(result) + '</p>'
      + '<div class="card-footer"><span>' + escapeHtml(script.duration) + '</span><span>VER COMO SERÁ ↗</span></div></div></button>';
  }
  function renderCards() {
    var q = ($('#search').value || '').toLocaleLowerCase('pt-BR').trim();
    var lawyer = $('#lawyer-filter').value;
    var model = $('#model-filter').value;
    var list = monthScripts().filter(function (s) {
      return (!q || (s.title + ' ' + s.lawyer + ' ' + s.area).toLocaleLowerCase('pt-BR').includes(q))
        && (!lawyer || s.lawyer === lawyer)
        && (!model || s.model === model);
    });
    $('#script-grid').innerHTML = list.map(cardHTML).join('');
    $('#empty').hidden = !!list.length;
    $('#visible-count').textContent = list.length;
    refreshProgress();
  }
  function refreshProgress() {
    var n = scripts.filter(function(s){return stateOf(s).status;}).length;
    $('#progress-text').textContent = n + ' de ' + scripts.length;
    $('#progress-fill').style.width = (100 * n / scripts.length) + '%';
  }
  function scenes(script) {
    if (script.slides) return script.slides.map(function(slide){return slide;});
    var shots = script.shots || [['ABERTURA','Mostrar a situação'],['EXPLICAÇÃO','Explicar o ponto jurídico'],['CONCLUSÃO','Fechar a dúvida']];
    var segments = [];
    if (script.turns) {
      if (script.model === 'pergunta') {
        var answer = script.turns[1] && script.turns[1][1] || '';
        var sentences = answer.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [answer];
        var half = Math.ceil(sentences.length / 2);
        segments = [script.turns[0][0] + ': ' + script.turns[0][1], sentences.slice(0,half).join(' ').trim(), sentences.slice(half).join(' ').trim()];
      } else {
        var turns = script.turns.map(function(t){return t[0] + ': ' + t[1];});
        var size = Math.ceil(turns.length / shots.length);
        segments = shots.map(function(_,i){return turns.slice(i*size,(i+1)*size).join('\n\n');});
      }
    } else {
      var blocks = (script.text || '').split(/\n\s*\n/).filter(Boolean);
      var bs = Math.ceil(blocks.length/shots.length);
      segments = shots.map(function(_,i){return blocks.slice(i*bs,(i+1)*bs).join('\n\n');});
    }
    return shots.map(function(shot,i){
      return {title:shot[0],board:shot[0],draw:shot[1],
        gesture:script.model==='contraste'?'Trocar o enquadramento conforme o lado da comparação.':
          script.model==='conversa'?'Alternar os dois personagens em plano e contraplano.':
          'Pergunta fora de quadro; resposta em plano médio, com aproximação no principal.',
        talk:segments[i] || segments[segments.length-1] || scriptText(script)};
    });
  }
  function currentScript() { return scripts.find(function(s){return s.id===active;}); }
  function stopPlaying() { if (playing) { clearInterval(playing); playing=null; } $('#play-story').textContent='▶ Reproduzir sequência'; }
  function renderFrame() {
    var script = currentScript(); if (!script) return;
    var ss = scenes(script);
    frame = Math.max(0,Math.min(frame,ss.length-1));
    var item = ss[frame];
    $('#frame-counter').textContent = String(frame+1).padStart(2,'0') + ' / ' + String(ss.length).padStart(2,'0');
    $('#storyboard-screen').innerHTML = stageHTML(script,item);
    $('#frame-draw').textContent = item.draw || item.title;
    $('#frame-action').textContent = item.gesture || 'Plano médio, olhar direto para a câmera.';
    $('#scene-talk').textContent = item.talk;
    $('#frame-dots').innerHTML=ss.map(function(_,i){return '<span class="'+(i===frame?'active':'')+'"></span>';}).join('');
    $('#frame-prev').disabled=frame===0; $('#frame-next').disabled=frame===ss.length-1;
  }
  function showFullScript(script) {
    var html = '';
    if (script.slides) html=script.slides.map(function(s,i){
      return '<span class="slide-break">QUADRO '+String(i+1).padStart(2,'0')+' / '+escapeHtml(s.title)+'</span>'
        + '<p>'+escapeHtml(s.talk)+'</p>';
    }).join('');
    else if (script.turns) html=script.turns.map(function(t){
      return '<div class="speech-turn '+(t[0]==='Interlocutor'?'interlocutor':'')+'"><span class="speaker">'+escapeHtml(t[0])+'</span><p>'+escapeHtml(t[1])+'</p></div>';
    }).join('');
    else html=script.text.split(/\n\s*\n/).map(function(p){return '<p>'+escapeHtml(p)+'</p>';}).join('');
    $('#full-script-content').innerHTML=html;
  }
  function updateReviewControls() {
    var st=stateOf(currentScript()); $('#review-note').value=st.note||'';
    $$('.review-buttons [data-review]').forEach(function(b){b.classList.toggle('active',b.dataset.review===st.status);});
    $('#review-state').textContent=statusText(st.status);
  }
  function openScript(id) {
    var script=scripts.find(function(s){return s.id===id;}); if(!script)return;
    if(script.month!==month)monthSwitch(script.month,false);
    stopPlaying();active=id;frame=0;
    $('#dialog-number').textContent='ROTEIRO '+String(script.number).padStart(2,'0');
    $('#dialog-model').textContent=modelInfo[script.model].label.toUpperCase();
    $('#dialog-month').textContent=script.month==='dezembro'?'DEZEMBRO 2026':'JANEIRO 2027';
    $('#detail-title').textContent=script.title;
    $('#detail-lawyer').textContent=script.lawyer+' · '+script.area;
    $('#detail-duration').textContent=script.duration;
    $('#detail-goal').textContent=script.goal;
    $('#detail-model-name').textContent=modelInfo[script.model].label;
    $('#detail-model-help').textContent=modelInfo[script.model].help;
    $('#detail-prepare').textContent=modelInfo[script.model].prepare+(script.legalReview?' ATENÇÃO: '+script.legalReview:' Todos os conteúdos precisam de validação jurídica antes de publicar.');
    showFullScript(script); renderFrame(); updateReviewControls();
    var list=monthScripts();var index=list.findIndex(function(s){return s.id===id;});
    $('#previous-script').disabled=index<=0;$('#next-script').disabled=index>=list.length-1;
    $('#detail-dialog').showModal();$('#detail-dialog').scrollTop=0;
  }
  function moveScript(delta) {
    var list=monthScripts();var index=list.findIndex(function(s){return s.id===active;});
    var next=list[index+delta];if(!next)return;
    $('#detail-dialog').close();openScript(next.id);
  }
  function exportReview() {
    var lines=['LAVAREDA × NORTHE | REVISÃO DE ROTEIROS','DEZEMBRO 2026 + JANEIRO 2027','Revisão anotada no navegador do cliente.',''];
    ['dezembro','janeiro'].forEach(function(m){
      lines.push(m.toUpperCase()+(m==='dezembro'?' 2026':' 2027'));
      scripts.filter(function(s){return s.month===m;}).sort(function(a,b){return a.number-b.number;}).forEach(function(s){
        var st=stateOf(s);lines.push(String(s.number).padStart(2,'0')+'. '+s.lawyer+' — '+s.title);
        lines.push('Formato: '+modelInfo[s.model].label+' | Situação: '+statusText(st.status));
        if(st.note)lines.push('Observação: '+st.note);
        lines.push('');
      });
    });
    copy(lines.join('\n'));
  }
  function setupFilters() {
    var names=Array.from(new Set(scripts.map(function(s){return s.lawyer;})));
    $('#lawyer-filter').innerHTML='<option value="">Todos os advogados</option>'+names.map(function(n){
      return '<option value="'+escapeHtml(n)+'">'+escapeHtml(n)+'</option>';
    }).join('');
    ['#search','#lawyer-filter','#model-filter'].forEach(function(sel){
      $(sel).addEventListener(sel==='#search'?'input':'change',renderCards);
    });
  }
  function initEvents(){
    $$('[data-month]').forEach(function(b){b.addEventListener('click',function(){monthSwitch(b.dataset.month,true);});});
    $('#start-review').addEventListener('click',function(){$('#cycle-section').scrollIntoView({behavior:'smooth'});});
    $('#see-formats').addEventListener('click',function(){$('#formats-section').scrollIntoView({behavior:'smooth'});});
    $('#side-guide').addEventListener('click',function(){$('#formats-section').scrollIntoView({behavior:'smooth'});});
    $('#side-export').addEventListener('click',exportReview);
    $('#format-gallery').addEventListener('click',function(e){
      var b=e.target.closest('[data-model-example]');if(!b)return;
      var list=scripts.filter(function(s){return s.model===b.dataset.model;});
      if(list.length)openScript(list[0].id);
    });
    $('#script-grid').addEventListener('click',function(e){
      var b=e.target.closest('[data-open]');if(b)openScript(b.dataset.open);
    });
    $('#close-dialog').addEventListener('click',function(){$('#detail-dialog').close();});
    $('#detail-dialog').addEventListener('close',function(){stopPlaying();active=null;renderCards();});
    $('#frame-prev').addEventListener('click',function(){stopPlaying();frame--;renderFrame();});
    $('#frame-next').addEventListener('click',function(){stopPlaying();frame++;renderFrame();});
    $('#play-story').addEventListener('click',function(){
      if(playing){stopPlaying();return;}
      if(frame>=scenes(currentScript()).length-1)frame=0;
      renderFrame();$('#play-story').textContent='Ⅱ Pausar prévia';
      playing=setInterval(function(){
        if(frame>=scenes(currentScript()).length-1){stopPlaying();return;}
        frame++;renderFrame();
      },2600);
    });
    $('#copy-scene').addEventListener('click',function(){copy($('#scene-talk').textContent);});
    $('#copy-script').addEventListener('click',function(){copy(scriptText(currentScript()));});
    $('#open-full-script').addEventListener('click',function(){$('#full-script').scrollIntoView({behavior:'smooth',block:'start'});});
    $('#previous-script').addEventListener('click',function(){moveScript(-1);});
    $('#next-script').addEventListener('click',function(){moveScript(1);});
    $$('.review-buttons [data-review]').forEach(function(b){
      b.addEventListener('click',function(){
        var script=currentScript();var st=stateOf(script);st.status=b.dataset.review;st.note=$('#review-note').value;
        review[script.id]=st;persist();updateReviewControls();refreshProgress();
        notify(b.dataset.review==='approved'?'Roteiro marcado como aprovado neste navegador.':'Pedido de ajuste marcado neste navegador.');
      });
    });
    $('#review-note').addEventListener('input',function(){
      var script=currentScript();if(!script)return;
      var st=stateOf(script);st.note=this.value;review[script.id]=st;persist();
    });
    $('#copy-review').addEventListener('click',exportReview);
    $('#teleprompter').addEventListener('click',function(){
      $('#read-body').textContent=scriptText(currentScript());$('#read-body').style.fontSize=readingFont+'px';$('#read-dialog').showModal();
    });
    $('#close-read').addEventListener('click',function(){$('#read-dialog').close();});
    $('#font-up').addEventListener('click',function(){readingFont=Math.min(54,readingFont+3);$('#read-body').style.fontSize=readingFont+'px';});
    $('#font-down').addEventListener('click',function(){readingFont=Math.max(18,readingFont-3);$('#read-body').style.fontSize=readingFont+'px';});
    document.addEventListener('keydown',function(e){
      if(!$('#detail-dialog').open || $('#read-dialog').open)return;
      if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
      if(e.key==='ArrowRight'){e.preventDefault();if(frame<scenes(currentScript()).length-1){stopPlaying();frame++;renderFrame();}}
      if(e.key==='ArrowLeft'){e.preventDefault();if(frame>0){stopPlaying();frame--;renderFrame();}}
    });
  }
  setupFilters();formatGallery();initEvents();monthSwitch('dezembro',false);
}());