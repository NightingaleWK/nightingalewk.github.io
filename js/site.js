const themeButton = document.querySelector('.theme');
const media = matchMedia('(prefers-color-scheme: dark)');
let choice = 'system';
try { choice = localStorage.getItem('breeze-theme') || 'system'; } catch {}
function applyTheme() {
  document.documentElement.dataset.theme = choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
  const label = {system:'跟随系统',light:'浅色',dark:'深色'}[choice];
  themeButton.textContent = label;
  themeButton.setAttribute('aria-label', `当前${label}，点击切换配色`);
  document.dispatchEvent(new Event('breezehome:themechange'));
}
if (!['system','light','dark'].includes(choice)) choice = 'system';
applyTheme();
themeButton.addEventListener('click', () => {
  choice = {system:'light',light:'dark',dark:'system'}[choice];
  try {localStorage.setItem('breeze-theme', choice);} catch {}
  applyTheme();
});
media.addEventListener('change', applyTheme);
// Progressive enhancement: the static article remains readable without scripts.
document.querySelectorAll('.prose > table, .prose table:not(figure.highlight table)').forEach(table => {
  if (table.closest('.table-wrap, figure.highlight')) return;
  const wrapper=document.createElement('div');wrapper.className='table-wrap';wrapper.tabIndex=0;
  wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','可横向滚动的表格');
  table.before(wrapper);wrapper.append(table);
});
document.querySelectorAll('.prose figure.highlight, .prose pre').forEach(block => {
  if(block.closest('.code-block') || (block.tagName==='PRE' && block.closest('figure.highlight'))) return;
  block.tabIndex=0;
  block.setAttribute('role','region');
  block.setAttribute('aria-label','可横向滚动的代码');
  const wrapper=document.createElement('div');wrapper.className='code-block';
  const bar=document.createElement('div');bar.className='code-head';
  const label=document.createElement('span');label.textContent=block.className.replace(/highlight|hljs/g,'').trim() || '代码';
  const button=document.createElement('button');button.className='copy';button.type='button';button.textContent='复制';
  bar.append(label,button);block.before(wrapper);wrapper.append(bar,block);
});
document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', async () => {
  try {
    const block=button.closest('.code-block');
    await navigator.clipboard.writeText(block.querySelector('.code pre, pre code, pre').textContent);
    button.textContent = '已复制';
  } catch { button.textContent = '请选中代码复制'; }
  setTimeout(() => button.textContent = '复制', 2000);
}));
const toc = document.querySelector('.toc');
if (toc) {
  const wide = matchMedia('(min-width: 1250px)');
  toc.open = wide.matches;
  wide.addEventListener('change', () => {toc.open = wide.matches;});
}
const form = document.querySelector('.search-form');
if (form) {
  const input = form.querySelector('input');
  const results = document.querySelector('#results');
  const status = document.querySelector('#search-status');
  let indexPromise, requestId = 0;
  function highlight(node, value, terms) {
    const pattern = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig');
    for (const part of value.split(pattern)) {
      if (terms.some(t => t === part.toLowerCase())) {const mark = document.createElement('mark');mark.textContent = part;node.append(mark);}
      else node.append(document.createTextNode(part));
    }
  }
  async function search() {
    const id = ++requestId, q = input.value.trim();
    const url = new URL(location.href); q ? url.searchParams.set('q',q) : url.searchParams.delete('q');
    history.replaceState(null,'',url);
    results.replaceChildren();
    if (!q) {status.textContent='搜索标题、分类、标签和正文。';return;}
    status.textContent='正在搜索…';
    try {
      indexPromise ||= fetch(document.body.dataset.searchIndex).then(r => {if(!r.ok)throw new Error('index');return r.json();}).catch(e=>{indexPromise=null;throw e;});
      const data = await indexPromise;
      if (id !== requestId) return;
      const terms = [...new Set(q.toLowerCase().split(/\s+/))];
      const matches = data.filter(p=>terms.every(t=>(p.title+' '+p.taxonomy+' '+p.text).toLowerCase().includes(t)))
        .sort((a,b)=>terms.filter(t=>b.title.toLowerCase().includes(t)).length - terms.filter(t=>a.title.toLowerCase().includes(t)).length);
      status.textContent = matches.length ? `找到 ${matches.length} 篇文章` : '没有找到相关文章，试试更短的关键词。';
      for (const post of matches) {
        const row=document.createElement('article');row.className='result';
        const h=document.createElement('h2'),a=document.createElement('a');a.href=post.url;highlight(a,post.title,terms);h.append(a);
        const p=document.createElement('p');
        const positions=terms.map(t=>post.text.toLowerCase().indexOf(t)).filter(n=>n>=0);
        const start=Math.max(0,(positions.length?Math.min(...positions):0)-45);
        highlight(p,(start?'…':'')+post.text.slice(start,start+180)+(post.text.length>start+180?'…':''),terms);
        row.append(h,p);results.append(row);
      }
    } catch {if(id===requestId)status.textContent='搜索索引加载失败，请再次点击搜索重试。';}
  }
  form.addEventListener('submit', e=>{e.preventDefault();search();});
  let timer;input.addEventListener('input',e=>{clearTimeout(timer);if(!e.isComposing)timer=setTimeout(search,200);});
  input.addEventListener('compositionend',()=>{clearTimeout(timer);timer=setTimeout(search,200);});
  input.value = new URL(location.href).searchParams.get('q') || '';
  search();
}
