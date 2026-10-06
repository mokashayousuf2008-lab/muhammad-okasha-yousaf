const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const certGrid = $('#certGrid');
const searchInput = $('#certSearch');
const filterButtons = $$('.filter-btn');
const activityGrid = $('#activityGrid');
const activityButtons = $$('.activity-btn');
const viewer = $('#viewer');
const viewerImage = $('#viewerImage');
const viewerTitle = $('#viewerTitle');
const viewerOpen = $('#viewerOpen');
const viewerClose = $('#viewerClose');
const viewerPrev = $('#viewerPrev');
const viewerNext = $('#viewerNext');
const progress = $('#progress');
const nav = $('#siteNav');
const menuToggle = $('#menuToggle');
const themeToggle = $('#themeToggle');
const cursorGlow = $('#cursorGlow');
const cursorBubble = $('#cursorBubble');

let currentFilter = 'all';
let currentSearch = '';
let filteredCertificates = [...certificates];
let viewerIndex = 0;

function escapeHtml(v){
  return String(v).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
}
function labelFor(cat){
  return ({medical:'MEDICAL & HEALTH',international:'INTERNATIONAL',leadership:'LEADERSHIP & IMPACT',digital:'DIGITAL & AI',communication:'COMMUNICATION',volunteering:'VOLUNTEERING'})[cat] || 'EVIDENCE';
}

function renderCertificates(){
  const list = certificates.filter(c => {
    const matchFilter = currentFilter === 'all' || c.category === currentFilter;
    const q = currentSearch.trim().toLowerCase();
    const matchSearch = !q || [c.title,c.issuer,c.description,c.meta,c.date].join(' ').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  filteredCertificates = list;
  certGrid.innerHTML = list.length ? list.map((c,i) => `
    <article class="cert-card reveal visible" data-cat="${escapeHtml(c.category)}">
      <div class="cert-thumb"><img src="${escapeHtml(c.image)}" loading="lazy" alt="${escapeHtml(c.title)} certificate"></div>
      <div class="cert-body">
        <span class="cert-category">${labelFor(c.category)}</span>
        <h3>${escapeHtml(c.title)}</h3>
        <p class="issuer">${escapeHtml(c.issuer)} • ${escapeHtml(c.date)}</p>
        ${c.meta ? `<p class="meta">${escapeHtml(c.meta)}</p>` : ''}
        <p class="desc">${escapeHtml(c.description)}</p>
        <button class="mini-btn primary" data-cert-view="${escapeHtml(c.id)}">View certificate</button>
      </div>
    </article>`).join('') : `<div class="empty-state"><span>⌕</span><h3>No matching evidence</h3><p>Try a broader search or another category.</p></div>`;
  $$('.cert-card').forEach(card => card.addEventListener('mousemove', tiltCard));
  $$('[data-cert-view]').forEach(btn => btn.addEventListener('click', () => openCertificateById(btn.dataset.certView)));
}

function renderActivities(filter='all'){
  const list = filter === 'all' ? activities : activities.filter(a => a.type === filter);
  activityGrid.innerHTML = list.map((a,i) => `
    <article class="activity-card reveal visible" style="--d:${i*60}ms">
      <span class="activity-icon">${a.icon}</span>
      <span class="activity-type">${escapeHtml(a.type)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <p class="activity-org">${escapeHtml(a.subtitle)}</p>
      <p class="activity-date">${escapeHtml(a.date)}</p>
      <p>${escapeHtml(a.description)}</p>
      ${a.certId ? `<button class="link-button" data-cert-id="${escapeHtml(a.certId)}">View evidence ↗</button>` : ''}
    </article>`).join('');
  $$('[data-cert-id]').forEach(btn => btn.addEventListener('click', () => openCertificateById(btn.dataset.certId)));
}

function openCertificateById(id){
  const idx = filteredCertificates.findIndex(c => c.id === id);
  const fallback = certificates.findIndex(c => c.id === id);
  viewerIndex = idx >= 0 ? idx : Math.max(0, fallback);
  const list = idx >= 0 ? filteredCertificates : certificates;
  showViewer(list, viewerIndex);
}

function showViewer(list, index){
  const item = list[index];
  if(!item) return;
  viewer.dataset.list = list === certificates ? 'all' : 'filtered';
  viewer.dataset.index = String(index);
  viewerImage.src = item.image;
  viewerImage.alt = item.title;
  viewerTitle.textContent = item.title;
  viewerOpen.href = item.image;
  viewer.classList.add('is-open');
  viewer.setAttribute('aria-hidden','false');
  document.body.classList.add('viewer-open');
  viewerPrev.disabled = list.length <= 1;
  viewerNext.disabled = list.length <= 1;
  setTimeout(() => viewerClose.focus(), 30);
}

function changeViewer(step){
  const list = viewer.dataset.list === 'all' ? certificates : filteredCertificates;
  if(!list.length) return;
  viewerIndex = (Number(viewer.dataset.index || 0) + step + list.length) % list.length;
  showViewer(list, viewerIndex);
}

function closeViewer(){
  viewer.classList.remove('is-open');
  viewer.setAttribute('aria-hidden','true');
  document.body.classList.remove('viewer-open');
  viewerImage.src = '';
}

function tiltCard(e){
  const card = e.currentTarget;
  const r = card.getBoundingClientRect();
  const x = (e.clientX-r.left)/r.width-.5;
  const y = (e.clientY-r.top)/r.height-.5;
  card.style.transform = `perspective(900px) rotateX(${(-y*2.2).toFixed(2)}deg) rotateY(${(x*2.2).toFixed(2)}deg) translateY(-3px)`;
  card.addEventListener('mouseleave',()=>{card.style.transform=''}, {once:true});
}

filterButtons.forEach(btn => btn.addEventListener('click', () => {
  filterButtons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderCertificates();
}));

searchInput.addEventListener('input', e => { currentSearch = e.target.value; renderCertificates(); });
activityButtons.forEach(btn=>btn.addEventListener('click',()=>{
  activityButtons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderActivities(btn.dataset.activityFilter);
}));

$$('[data-view]').forEach(btn => btn.addEventListener('click',()=>{
  showViewer([{id:'doc',title:btn.dataset.title||'Document',image:btn.dataset.view}],0);
}));

$$('[data-cert-id]').forEach(btn => btn.addEventListener('click',()=>openCertificateById(btn.dataset.certId)));

$('[data-close-viewer]').addEventListener('click',closeViewer);
viewerClose.addEventListener('click',closeViewer);
viewerPrev.addEventListener('click',()=>changeViewer(-1));
viewerNext.addEventListener('click',()=>changeViewer(1));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && viewer.classList.contains('is-open')) closeViewer();
  if(e.key==='ArrowLeft' && viewer.classList.contains('is-open')) changeViewer(-1);
  if(e.key==='ArrowRight' && viewer.classList.contains('is-open')) changeViewer(1);
});

menuToggle.addEventListener('click',()=>{
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded',String(open));
});
$$('#siteNav a').forEach(a=>a.addEventListener('click',()=>{
  nav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded','false');
}));

function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('okasha-theme',theme);
}
const savedTheme = localStorage.getItem('okasha-theme');
applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeToggle.addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light':'dark'));

let raf = 0;
window.addEventListener('pointermove', e=>{
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(()=>{
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    cursorGlow.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
    cursorBubble.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
  });
},{passive:true});
window.addEventListener('pointerdown',()=>{
  cursorBubble.classList.remove('pulse');
  void cursorBubble.offsetWidth;
  cursorBubble.classList.add('pulse');
});

const revealObserver = new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){ entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
}),{threshold:.08});
$$('.reveal').forEach(el=>revealObserver.observe(el));

const sectionEls = $$('[data-section-id]');
const railLinks = $$('#sectionRail a');
const sectionObserver = new IntersectionObserver(entries=>{
  const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!visible) return;
  const id = visible.target.dataset.sectionId;
  railLinks.forEach(link=>link.classList.toggle('active',link.dataset.section===id));
},{rootMargin:'-35% 0px -50% 0px',threshold:[0,.15,.35,.6]});
sectionEls.forEach(s=>sectionObserver.observe(s));

function updateProgress(){
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h>0 ? Math.min(100, Math.max(0, window.scrollY/h*100)) : 0;
  progress.style.width = `${pct}%`;
}
window.addEventListener('scroll',updateProgress,{passive:true});
updateProgress();

renderCertificates();
renderActivities();
