/* Ncar — prévia. Sem dependências. */
(() => {
  'use strict';
  const WA = '5548998104157';
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- topo e barra fixa ---------- */
  const topo = $('[data-topo]');
  const barra = $('[data-barra-fixa]');
  const hero = $('[data-hero]');
  const visite = $('#visite');
  const ficha = $('[data-ficha]');
  let tick = false;
  function aoRolar() {
    tick = false;
    topo.classList.toggle('rolou', scrollY > 20);
    if (barra) {
      const passouHero = hero.getBoundingClientRect().bottom < 80;
      const vh = innerHeight;
      const perto = [visite, ficha].some((el) => { const r = el.getBoundingClientRect(); return r.top < vh * .85 && r.bottom > vh * .15; });
      barra.classList.toggle('mostra', passouHero && !perto);
    }
    espuma && espuma.rolagem();
    fila && fila.atualiza();
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(aoRolar); } }, { passive: true });

  /* ---------- títulos (line-mask) ---------- */
  const titulos = $$('[data-revela]');
  if ('IntersectionObserver' in window && !reduz.matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    titulos.forEach((t) => io.observe(t));
  } else titulos.forEach((t) => t.classList.add('visto'));

  /* ---------- espuma do hero ---------- */
  const espuma = (() => {
    const palco = $('[data-espuma-palco]');
    const cv = $('[data-espuma]');
    if (!palco || !cv || reduz.matches || !cv.getContext) return null;
    const ctx = cv.getContext('2d');
    const jato = $('[data-jato]');
    const dica = $('[data-dica]');
    const btn = $('[data-reespumar]');
    const medidor = $('[data-medidor]');
    const foam = document.createElement('canvas');
    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d');
    const mini = document.createElement('canvas'); mini.width = 36; mini.height = 60;
    const nctx = mini.getContext('2d', { willReadFrequently: true });
    let base = 1, W = 0, H = 0, dpr = 1, p = 0, gotas = [], loop = 0, ultimo = null, mexeu = false, visivel = true, ultMed = 0;

    function rnd(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

    function desenhaEspuma() {
      const f = foam.getContext('2d');
      foam.width = W; foam.height = H;
      const r = rnd(7);
      const g = f.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(246,249,251,.94)');
      g.addColorStop(.6, 'rgba(236,242,246,.95)');
      g.addColorStop(1, 'rgba(214,226,235,.97)');
      f.fillStyle = g; f.fillRect(0, 0, W, H);
      // nuvens de espuma
      for (let i = 0; i < 70; i++) {
        const x = r() * W, y = r() * H, rad = (40 + r() * 140) * dpr;
        const rg = f.createRadialGradient(x, y, 0, x, y, rad);
        rg.addColorStop(0, 'rgba(255,255,255,.75)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
        f.fillStyle = rg; f.beginPath(); f.arc(x, y, rad, 0, 7); f.fill();
      }
      // bolhas
      // sombras suaves entre aglomerados (dão volume à espuma)
      for (let i = 0; i < 46; i++) {
        const x = r() * W, y = r() * H, rad = (30 + r() * 90) * dpr;
        const rg = f.createRadialGradient(x, y, 0, x, y, rad);
        rg.addColorStop(0, 'rgba(150,170,188,.22)'); rg.addColorStop(1, 'rgba(150,170,188,0)');
        f.fillStyle = rg; f.beginPath(); f.arc(x, y, rad, 0, 7); f.fill();
      }
      const n = Math.round((W * H) / (70 * dpr * dpr));
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H;
        const rad = (1.2 + Math.pow(r(), 4) * 16) * dpr;
        const bg = f.createRadialGradient(x - rad * .3, y - rad * .35, rad * .1, x, y, rad);
        bg.addColorStop(0, 'rgba(255,255,255,.95)');
        bg.addColorStop(.7, 'rgba(244,248,251,.55)');
        bg.addColorStop(1, `rgba(140,162,180,${.18 + r() * .22})`);
        f.beginPath(); f.arc(x, y, rad, 0, 7); f.fillStyle = bg; f.fill();
      }
      // brilho de sabão (iridescente, bem leve)
      f.globalCompositeOperation = 'soft-light';
      const ir = f.createLinearGradient(0, 0, W, H);
      ir.addColorStop(0, 'rgba(255,120,160,.25)'); ir.addColorStop(.5, 'rgba(120,200,255,.25)'); ir.addColorStop(1, 'rgba(255,230,140,.2)');
      f.fillStyle = ir; f.fillRect(0, 0, W, H);
      f.globalCompositeOperation = 'source-over';
      nctx.clearRect(0, 0, 36, 60); nctx.drawImage(foam, 0, 0, 36, 60);
      const d = nctx.getImageData(0, 0, 36, 60).data; let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i];
      base = a || 1;
    }

    function dimensiona() {
      const b = palco.getBoundingClientRect();
      dpr = Math.min(1.5, devicePixelRatio || 1);
      const nW = Math.round(b.width * dpr), nH = Math.round(b.height * dpr);
      if (!nW || !nH || (nW === W && nH === H)) return;
      const antiga = W ? (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(mask, 0, 0); return c; })() : null;
      W = nW; H = nH; cv.width = W; cv.height = H; mask.width = W; mask.height = H;
      if (antiga) mctx.drawImage(antiga, 0, 0, W, H);
      desenhaEspuma(); render();
    }

    function render() {
      if (!W || !H) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(foam, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(mask, 0, 0);
      if (p > 0) {
        const y = p * H * 1.12;
        const g = ctx.createLinearGradient(0, y - 60 * dpr, 0, y);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0);
        for (let x = W; x >= 0; x -= 12 * dpr) ctx.lineTo(x, y - 60 * dpr + Math.sin(x / (38 * dpr) + p * 9) * 10 * dpr - x * .06);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = g; ctx.fillRect(0, y - 70 * dpr - W * .06, W, 70 * dpr + W * .06);
      }
      ctx.globalCompositeOperation = 'source-over';
      const agora = performance.now();
      if (agora - ultMed > 160) { ultMed = agora; mede(); }
      clearTimeout(render.t); render.t = setTimeout(mede, 220);
    }

    function mede() {
      nctx.clearRect(0, 0, 36, 60);
      nctx.drawImage(cv, 0, 0, 36, 60);
      const d = nctx.getImageData(0, 0, 36, 60).data;
      let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i];
      const limpo = clamp(1 - a / base, 0, 1);
      const pct = Math.round(limpo * 100);
      medidor.textContent = pct;
      if (pct > 12 && dica) dica.classList.add('some');
      if (btn) btn.hidden = pct < 85;
    }

    function carimbo(x, y, rad) {
      const g = mctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, rad, 0, 7); mctx.fill();
    }
    function traço(x, y) {
      const rad = (innerWidth < 760 ? 40 : 48) * dpr;
      if (ultimo) {
        const dx = x - ultimo.x, dy = y - ultimo.y, dist = Math.hypot(dx, dy), passos = Math.ceil(dist / (rad * .22));
        for (let i = 1; i <= passos; i++) carimbo(ultimo.x + dx * i / passos, ultimo.y + dy * i / passos, rad);
        if (dist > 4 && Math.random() < .22) gotas.push({ x: x + (Math.random() - .5) * rad, y: y + rad * .5, v: (.8 + Math.random() * 1.2) * dpr, w: (4 + Math.random() * 6) * dpr, vida: 22 + Math.random() * 40 });
      } else carimbo(x, y, rad);
      ultimo = { x, y };
      anima();
    }
    function anima() { if (!loop) loop = requestAnimationFrame(quadro); }
    function quadro() {
      loop = 0;
      gotas = gotas.filter((g) => {
        g.y += g.v; g.v *= 1.02; g.vida--; g.x += (Math.random() - .5) * .6 * dpr;
        mctx.fillStyle = 'rgba(0,0,0,.9)';
        mctx.beginPath(); mctx.ellipse(g.x, g.y, g.w * .5, g.w * .9, 0, 0, 7); mctx.fill();
        return g.vida > 0 && g.y < H;
      });
      render();
      if (gotas.length && visivel) anima();
    }
    function pos(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * dpr, y: (e.clientY - b.top) * dpr }; }
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'pen' || e.pointerType === 'touch') { mexeu = true; const q = pos(e); traço(q.x, q.y); }
    });
    cv.addEventListener('pointerdown', (e) => { mexeu = true; ultimo = null; const q = pos(e); traço(q.x, q.y); });
    cv.addEventListener('pointerleave', () => { ultimo = null; });
    cv.addEventListener('pointerup', () => { ultimo = null; });
    cv.addEventListener('pointercancel', () => { ultimo = null; });

    btn && btn.addEventListener('click', () => { mctx.clearRect(0, 0, W, H); gotas = []; render(); dica && dica.classList.remove('some'); });

    // demonstração inicial: uma passada em S sobre o capô
    function demo() {
      if (mexeu || p > .02) return;
      const t0 = performance.now(), dur = 1300;
      const pts = (t) => ({ x: W * (.18 + .64 * t), y: H * (.66 + Math.sin(t * Math.PI * 1.6) * .06 - t * .08) });
      ultimo = null;
      (function passo(n) {
        if (mexeu) return;
        const t = clamp((n - t0) / dur, 0, 1), q = pts(t);
        traço(q.x, q.y);
        if (t < 1) requestAnimationFrame(passo); else ultimo = null;
      })(t0);
    }

    function rolagem() {
      const b = hero.getBoundingClientRect();
      const mobile = innerWidth < 760;
      const np = clamp(-b.top / (b.height * (mobile ? .5 : .6)), 0, 1);
      if (Math.abs(np - p) < .002) return;
      p = np;
      if (jato) { jato.classList.toggle('ativo', p > .01 && p < .98); jato.style.setProperty('--jy', (p * palco.clientHeight * 1.12 - 60) + 'px'); }
      render();
    }

    new ResizeObserver(dimensiona).observe(palco);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(palco);
    dimensiona();
    setTimeout(demo, 1100);
    return { rolagem };
  })();

  /* ---------- antes e depois ---------- */
  (() => {
    const box = $('[data-comparador]');
    if (!box) return;
    const sec = box.closest('section');
    const ctrl = $('[data-controle]', box);
    const quadro = $('.comparador__quadro', box);
    const fonte = $('[data-fonte]', box);
    const pares = {
      banco: { alt: ['Antes: banco manchado e console com sujeira', 'Depois: banco e console limpos'], reel: 'Dfcx5duM5HP', data: '07/11/2026' },
      assoalho: { alt: ['Antes: assoalho e tapete com barro', 'Depois: assoalho limpo e tapete lavado'], reel: 'Dfcx5duM5HP', data: '07/11/2026' },
      pintura: { alt: ['Antes: porta da Strada com respingos de tinta azul', 'Depois: Strada com a lataria limpa'], reel: 'DfqcBeosXss', data: '12/11/2026' },
    };
    function define(v) {
      box.style.setProperty('--x', v + '%');
      sec.dataset.lado = v < 50 ? 'depois' : 'antes';
    }
    ctrl.addEventListener('input', () => define(+ctrl.value));
    $$('[data-par]', box).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.par, d = pares[k];
      $$('[data-par]', box).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      [['antes', 0], ['depois', 1]].forEach(([lado, i]) => {
        $(`[data-src-${lado}]`, box).srcset = `assets/${lado}-${k}-480.webp 480w, assets/${lado}-${k}-720.webp 720w`;
        const img = $(`[data-img-${lado}]`, box); img.src = `assets/${lado}-${k}-720.jpg`; img.alt = d.alt[i];
      });
      fonte.innerHTML = `Reel de ${d.data} · <a href="https://www.instagram.com/ncar_estetica/reel/${d.reel}/" target="_blank" rel="noopener">ver no Instagram</a>`;
      quadro.classList.remove('trocando'); void quadro.offsetWidth; quadro.classList.add('trocando');
      ctrl.value = 50; define(50);
    }));
    define(50);
    // dica de gesto: o rodo passa uma vez ao aparecer
    if ('IntersectionObserver' in window && !reduz.matches) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io.disconnect();
        const seq = [50, 78, 24, 50], t0 = performance.now(), dur = 1800;
        let mexido = false; ctrl.addEventListener('input', () => { mexido = true; }, { once: true });
        (function passo(n) {
          if (mexido) return;
          const t = clamp((n - t0) / dur, 0, 1), seg = Math.min(2, Math.floor(t * 3)), lt = t * 3 - seg;
          const ease = lt < .5 ? 4 * lt ** 3 : 1 - (-2 * lt + 2) ** 3 / 2;
          const v = seq[seg] + (seq[seg + 1] - seq[seg]) * ease;
          define(v); ctrl.value = Math.round(v);
          if (t < 1) requestAnimationFrame(passo);
        })(t0);
      }, { threshold: .55 });
      io.observe(quadro);
    }
  })();

  /* ---------- ficha de serviço ---------- */
  (() => {
    if (!ficha) return;
    const hoje = $('[data-hoje]');
    if (hoje) hoje.textContent = new Date().toLocaleDateString('pt-BR');
    const cont = $('[data-contagem]');
    const errS = $('[data-erro-servico]');
    const errC = $('[data-erro-carro]');
    const carro = $('#f-carro');
    function conta() {
      const n = $$('input[name="servico"]:checked', ficha).length;
      cont.textContent = n ? `${n} ${n === 1 ? 'serviço marcado' : 'serviços marcados'}` : 'Nenhum serviço marcado ainda';
      if (n) errS.hidden = true;
    }
    ficha.addEventListener('change', conta);
    carro.addEventListener('input', () => { if (carro.value.trim()) { errC.hidden = true; carro.removeAttribute('aria-invalid'); } });
    ficha.addEventListener('submit', (e) => {
      e.preventDefault();
      const servicos = $$('input[name="servico"]:checked', ficha).map((i) => i.value);
      const c = carro.value.trim();
      let ok = true;
      if (!servicos.length) { errS.hidden = false; ok = false; }
      if (!c) { errC.hidden = false; carro.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!ok) { (!servicos.length ? $('input[name="servico"]', ficha) : carro).focus(); return; }
      const nome = $('#f-nome').value.trim(), per = $('#f-periodo').value;
      const linhas = ['Olá, Ncar! Montei uma ficha pelo site:', '', `Carro: ${c}`, 'Serviços:', ...servicos.map((s) => `• ${s}`)];
      if (per) linhas.push(`Melhor período: ${per}`);
      if (nome) linhas.push(`Nome: ${nome}`);
      linhas.push('', 'Pode me passar valor e horário?');
      const url = `https://wa.me/${WA}?text=${encodeURIComponent(linhas.join('\n'))}`;
      const w = window.open(url, '_blank', 'noopener');
      if (!w) location.href = url;
    });
    conta();
  })();

  /* ---------- pátio ---------- */
  const fila = (() => {
    const ul = $('[data-fila]');
    if (!ul) return null;
    const ant = $('[data-patio-ant]'), prox = $('[data-patio-prox]'), bar = $('[data-fila-barra]');
    const imgs = $$('.carro__foto img', ul);
    const passo = () => (ul.querySelector('.carro')?.getBoundingClientRect().width || 300) + 18;
    ant.addEventListener('click', () => ul.scrollBy({ left: -passo() * 2, behavior: reduz.matches ? 'auto' : 'smooth' }));
    prox.addEventListener('click', () => ul.scrollBy({ left: passo() * 2, behavior: reduz.matches ? 'auto' : 'smooth' }));
    let pend = false;
    function atualiza() {
      const max = ul.scrollWidth - ul.clientWidth;
      const t = max > 0 ? ul.scrollLeft / max : 0;
      ant.disabled = ul.scrollLeft < 4; prox.disabled = ul.scrollLeft > max - 4;
      bar.style.setProperty('--fp', (t * 233) + '%');
      if (reduz.matches) return;
      const c = innerWidth / 2;
      imgs.forEach((im) => { const b = im.parentElement.getBoundingClientRect(); if (b.right < 0 || b.left > innerWidth) return; im.style.setProperty('--px', clamp((c - (b.left + b.width / 2)) * -.05, -18, 18).toFixed(1) + 'px'); });
    }
    ul.addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; atualiza(); }); } }, { passive: true });
    addEventListener('resize', atualiza);
    atualiza();
    return { atualiza };
  })();

  aoRolar();
})();
