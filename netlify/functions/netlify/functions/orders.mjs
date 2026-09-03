import { getStore } from '@netlify/blobs';
import { getUser, json } from './_auth.mjs';
const store = () => getStore('phase16-print');
const RATES = { bw: 5, color: 10, photo: 100 };
const LABELS = { bw:'B&W Document', color:'Color Document', photo:'Color Photo A4' };
async function readOrders(){ return (await store().get('orders.json',{type:'json'})) || []; }
async function saveOrders(x){ await store().setJSON('orders.json',x); }
function cleanFileName(name){ return String(name||'file').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,180); }
function calc(files,copies){
  const details=files.map(f=>{ const type=String(f.printType||'color'); const pages=Math.max(1,Math.min(10000,parseInt(f.pages||1,10)||1)); const rate=RATES[type]||RATES.color; return {id:f.id,type,printType:LABELS[type]||LABELS.color,pages,rate,amount:pages*rate*copies}; });
  return {details,total:details.reduce((n,x)=>n+x.amount,0)};
}
export default async (request) => {
  const user=getUser(request); if(!user) return json({error:'Please login first.'},401);
  try {
    if(request.method==='GET'){ const orders=await readOrders(); return json(user.role==='admin'?orders:orders.filter(o=>o.customer.username===user.username)); }
    if(request.method!=='POST') return json({error:'Method not allowed.'},405);
    if(user.role!=='customer') return json({error:'Access denied.'},403);
    const body=await request.json().catch(()=>({}));
    if(!Array.isArray(body.files)||!body.files.length) return json({error:'Please select at least one file.'},400);
    if(body.files.length>20) return json({error:'Maximum 20 files per order.'},400);
    const id='PRN-'+Date.now().toString().slice(-8); const files=[];
    for(let i=0;i<body.files.length;i++){
      const f=body.files[i]; if(!f.data||typeof f.data!=='string') continue;
      const raw=f.data.includes(',')?f.data.split(',').pop():f.data; const bytes=Buffer.from(raw,'base64');
      if(bytes.length>5*1024*1024) return json({error:`${f.name||'File'} is over the 5 MB prototype limit.`},400);
      const fid=`${id}-${i+1}`; const printType=['bw','color','photo'].includes(String(f.printType))?String(f.printType):'color'; const pages=Math.max(1,Math.min(10000,parseInt(f.pages||1,10)||1));
      await store().set(`file-${fid}`,bytes,{metadata:{contentType:f.type||'application/octet-stream',name:cleanFileName(f.name)}});
      files.push({id:fid,originalName:cleanFileName(f.name),size:bytes.length,type:f.type||'application/octet-stream',url:`/.netlify/functions/file?order=${encodeURIComponent(id)}&file=${encodeURIComponent(fid)}`,paperType:printType==='photo'?'Photo Paper':'Plain Paper',status:'Pending',printType,pages});
    }
    if(!files.length) return json({error:'No usable files were received.'},400);
    const copies=Math.max(1,Math.min(100,parseInt(body.copies||'1',10)||1));
    const pricing=calc(files,copies);
    const order={id,createdAt:new Date().toISOString(),customer:{name:String(body.name||user.name),phone:String(body.phone||user.phone||''),username:user.username},settings:{copies,side:body.side||'Single Side'},files,status:'New',adminNote:'',pricing:{...pricing,upiId:'7535948371@ybl',currency:'INR'},paymentStatus:'Pending'};
    const orders=await readOrders(); orders.unshift(order); await saveOrders(orders); return json({ok:true,order},201);
  } catch(e){ console.error('ORDERS_ERROR',e); return json({error:'Could not process the order. '+e.message},500); }
};
