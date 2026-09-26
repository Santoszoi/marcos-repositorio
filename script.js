document.querySelectorAll('[data-whatsapp]').forEach(link => {
  link.href = 'https://wa.me/5561996253510?text=' + encodeURIComponent(link.dataset.whatsapp);
});
document.getElementById('year').textContent = new Date().getFullYear();
const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('main-nav');
function closeMenu() { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded', String(open)); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
const form = document.getElementById('lead-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  const message = [
    '*NOVA SOLICITAÇÃO DE PROPOSTA - MARCOS SOLUTIONS* ✳️',
    '',
    '*👤 Nome:* ' + fields.get('nome').trim(),
    '*🏢 Empresa:* ' + fields.get('empresa').trim(),
    '*🛠️ Solução procurada:* ' + fields.get('solucao'),
    '*📅 Prazo pretendido:* ' + fields.get('prazo'),
    '',
    '*🎯 Principal Desafio Operacional:*',
    '"' + fields.get('desafio').trim() + '"',
    '',
    '---',
    '_Mensagem gerada via marcossolutions.com.br_'
  ].join('\n');
  const url = 'https://wa.me/5561996253510?text=' + encodeURIComponent(message);
  const status = document.getElementById('form-status');
  status.replaceChildren(document.createTextNode('Seu resumo está pronto. Revise e envie no WhatsApp. Se ele não abrir, '));
  const retry = document.createElement('a'); retry.href = url; retry.target = '_blank'; retry.rel = 'noopener noreferrer'; retry.textContent = 'abra a conversa aqui';
  status.append(retry);
  window.open(url, '_blank', 'noopener,noreferrer');
});
// Fixed, fictitious data for the portfolio demonstration only.
const demoTickets = Array.from({length:30}, (_,day) => Array.from({length:2+(day%5)}, (_,i) => ({
  id:2000+day*10+i, day, company:['Empresa Alfa','Empresa Beta','Empresa Gama'][i%3],
  category:['Acesso ao sistema','Ajuste de cadastro','Dúvida sobre relatório'][i%3],
  status:(day+i)%5===0?'Aberto':(day+i)%5===1?'Em andamento':'Concluído',
  priority:(day+i)%4===0?'Alta':'Normal', minutes:15+((day*7+i*11)%90)
}))).flat();
let demoView = 'overview';
const periodControl = document.getElementById('demo-period');
function renderDemo() {
  const days=Number(periodControl.value), selected=demoTickets.filter(t=>t.day>=30-days);
  const done=selected.filter(t=>t.status==='Concluído');
  document.getElementById('demo-total').textContent=selected.length;
  document.getElementById('demo-open').textContent=selected.filter(t=>t.status!=='Concluído').length;
  document.getElementById('demo-average').textContent=done.length?Math.round(done.reduce((s,t)=>s+t.minutes,0)/done.length)+' min':'Sem conclusões';
  const rows=document.getElementById('demo-rows');rows.replaceChildren();
  selected.slice().reverse().forEach(t=>{const row=document.createElement('tr');
    ['#'+t.id,t.company,t.category,t.priority,t.status].forEach((value,index)=>{const cell=document.createElement('td');
      if(index===4){const badge=document.createElement('span');badge.className='demo-badge '+(value==='Concluído'?'done':value==='Aberto'?'open':'progress');badge.textContent=value;cell.append(badge);}else cell.textContent=value;row.append(cell);});rows.append(row);});
  const counts=Array.from({length:days},(_,i)=>selected.filter(t=>t.day===30-days+i).length);
  const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 660 235');svg.setAttribute('role','img');svg.setAttribute('aria-label','Dados fictícios: '+selected.length+' demandas em '+days+' dia(s). Consulte os registros na tabela de chamados.');
  function node(tag,attrs,text){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;svg.append(e);return e;}
  [0,2,4,6].forEach(n=>{const y=195-n*26;node('line',{x1:35,y1:y,x2:646,y2:y,stroke:'#353847'});node('text',{x:8,y:y+4},n);});
  counts.forEach((count,i)=>{const step=600/days,x=40+i*step,w=Math.min(55,step*.7);const bar=node('rect',{x:x+(step-w)/2,y:195-count*26,width:w,height:count*26,rx:3,fill:'#00bcd4'});const date=new Date(Date.UTC(2026,7,24+30-days+i));const label=String(date.getUTCDate()).padStart(2,'0')+'/'+String(date.getUTCMonth()+1).padStart(2,'0');const title=document.createElementNS(ns,'title');title.textContent=label+': '+count+' demandas';bar.append(title);if(days<=7||i%5===0||i===days-1)node('text',{x:x+step/2,y:220,'text-anchor':'middle'},label);});
  document.getElementById('demo-chart').replaceChildren(svg);
  document.querySelector('[data-demo-panel="chart"]').hidden=demoView==='tickets';
  document.querySelector('[data-demo-panel="table"]').hidden=demoView==='reports';
  document.getElementById('demo-view-title').textContent={overview:'Visão geral da operação',tickets:'Chamados no período',reports:'Relatório de demandas'}[demoView];
  document.getElementById('demo-feedback').textContent=selected.length+' demandas fictícias no período; '+done.length+' concluídas. Em aberto inclui chamados em andamento.';
}
periodControl.addEventListener('change',renderDemo);
document.querySelectorAll('[data-demo-view]').forEach(button=>button.addEventListener('click',()=>{demoView=button.dataset.demoView;document.querySelectorAll('[data-demo-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderDemo();}));
document.querySelectorAll('[data-solution]').forEach(a=>a.addEventListener('click',()=>{form.elements.solucao.value=a.dataset.solution;}));
renderDemo();

// Replay service-card entrances when scrolling in either direction.
(() => {
  const cards = [...document.querySelectorAll('.expanded-services > article')];
  if (!cards.length || !('IntersectionObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let lastY = window.scrollY;
  let direction = 'down';
  const updateDirection = () => {
    const nextY = window.scrollY;
    if (nextY !== lastY) direction = nextY > lastY ? 'down' : 'up';
    lastY = nextY;
  };
  const resetCard = card => card.classList.remove('service-enter-down', 'service-enter-up');
  const configureMotion = () => {
    if (observer) observer.disconnect();
    window.removeEventListener('scroll', updateDirection);
    cards.forEach(resetCard);
    if (motion.matches) return;
    lastY = window.scrollY;
    window.addEventListener('scroll', updateDirection, { passive: true });
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          resetCard(entry.target);
          entry.target.classList.add('service-enter-' + direction);
        } else {
          resetCard(entry.target);
        }
      });
    }, { threshold: 0.12 });
    cards.forEach(card => observer.observe(card));
  };
  if (motion.addEventListener) motion.addEventListener('change', configureMotion);
  configureMotion();
})();
