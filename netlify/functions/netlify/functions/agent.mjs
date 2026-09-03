import { getStore } from '@netlify/blobs';
import { json } from './_auth.mjs';
const store=()=>getStore('phase16-print');
const agentKey=()=>process.env.AGENT_KEY||'';
function authorized(request){ const key=request.headers.get('x-agent-key')||''; return !!agentKey() && key===agentKey(); }
async function readOrders(){return (await store().get('orders.json',{type:'json'}))||[];}
async function saveOrders(x){await store().setJSON('orders.json',x);}
function recoverStale(orders){
  const cutoff=Date.now()-15*60*1000;
  for(const o of orders){
    for(const f of o.files||[]){
      if(f.status==='Printing' && f.agentClaimedAt && Date.parse(f.agentClaimedAt)<cutoff){
        f.status='Pending'; f.agentClaimedAt=null; f.agentRecovery='Requeued after stale agent claim';
      }
    }
    if(o.status==='Printing' && (o.files||[]).some(f=>f.status==='Pending')) o.status='Approved';
  }
}
export default async request=>{
  if(!authorized(request)) return json({error:'Agent not authorized.'},401);
  try{
    const url=new URL(request.url); const action=url.searchParams.get('action')||'poll';
    if(request.method==='GET' && action==='health') return json({ok:true,service:'Ayush Janseva AutoPrint',time:new Date().toISOString()});
    const orders=await readOrders(); recoverStale(orders);
    if(request.method==='GET' && action==='poll'){
      const jobs=[];
      for(const o of orders){
        const eligible=o.paymentStatus==='Paid' && o.status==='Approved';
        if(!eligible) continue;
        for(const f of o.files||[]){
          if(f.status!=='Pending') continue;
          f.status='Printing'; f.agentClaimedAt=new Date().toISOString();
          jobs.push({
            orderId:o.id,fileId:f.id,fileName:f.originalName,fileType:f.type||'application/octet-stream',
            pages:Number(f.pages||1),copies:Number(o.settings?.copies||1),side:o.settings?.side||'Single Side',
            printType:f.printType||'color',paperType:f.paperType||'Plain Paper',
            url:`/.netlify/functions/file?order=${encodeURIComponent(o.id)}&file=${encodeURIComponent(f.id)}`
          });
        }
        if(jobs.some(j=>j.orderId===o.id)) o.status='Printing';
      }
      if(jobs.length || orders.some(o=>(o.files||[]).some(f=>f.agentRecovery))) await saveOrders(orders);
      return json({ok:true,jobs});
    }
    if(request.method==='POST' && action==='result'){
      const body=await request.json().catch(()=>({}));
      const o=orders.find(x=>x.id===body.orderId); if(!o) return json({error:'Order not found.'},404);
      const f=(o.files||[]).find(x=>x.id===body.fileId); if(!f) return json({error:'File not found.'},404);
      f.status=body.success?'Printed':'Failed'; f.agentResult=String(body.message||''); f.agentCompletedAt=new Date().toISOString(); f.agentClaimedAt=null;
      if((o.files||[]).every(x=>x.status==='Printed')) o.status='Completed';
      else if((o.files||[]).some(x=>x.status==='Failed')) o.status='Failed';
      else o.status='Printing';
      await saveOrders(orders); return json({ok:true,order:o});
    }
    return json({error:'Unsupported agent request.'},405);
  }catch(e){console.error('AGENT_ERROR',e);return json({error:'Agent service error. '+e.message},500)}
};
