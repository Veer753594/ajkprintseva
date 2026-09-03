const form = document.getElementById('orderForm');
const files = document.getElementById('files');
const list = document.getElementById('fileList');
const result = document.getElementById('result');

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function showError(msg){result.innerHTML=`<div class="error">${esc(msg)}</div>`;}

if (location.protocol === 'file:') {
  showError('Please start the Node.js server first, then open http://localhost:3000/ . Do not open index.html directly.');
}

files.addEventListener('change',()=>{
  list.innerHTML=[...files.files].map(f=>`<div class="fileitem">📄 ${esc(f.name)} <span class="muted">(${(f.size/1024).toFixed(1)} KB)</span></div>`).join('');
});

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(location.protocol==='file:') return showError('Server is not running. Use start.bat, then open http://localhost:3000/');
  if(!files.files.length) return showError('Please select at least one file.');
  result.innerHTML='<div class="loading">Submitting order…</div>';
  try {
    const r=await fetch('/.netlify/functions/orders',{method:'POST',body:new FormData(form)});
    const text=await r.text();
    let d; try { d=JSON.parse(text); } catch { throw new Error('Server returned an invalid response. Is the server running on this page?'); }
    if(!r.ok) throw new Error(d.error||'Failed to submit order');
    result.innerHTML=`<div class="ok"><b>Order submitted successfully.</b><br>Order ID: <b>${esc(d.order.id)}</b><br>Keep this ID for reference.</div>`;
    form.reset(); list.innerHTML='';
  } catch(err) { showError(err.message.includes('Failed to fetch') ? 'Cannot connect to the server. Start start.bat and open http://localhost:3000/.' : err.message); }
});
