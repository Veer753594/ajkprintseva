import { getStore } from '@netlify/blobs';
import { getUser, json } from './_auth.mjs';
const store=()=>getStore('phase16-print');
async function readOrders(){return (await store().get('orders.json',{type:'json'}))||[];}
async function saveOrders(x){await store().setJSON('orders.json',x);}
export default async (request) => {
  const user=getUser(request); if(!user) return json({error:'Please login first.'},401);
  try{
    const id=new URL(request.url).searchParams.get('id'); if(!id) return json({error:'Missing order ID.'},400);
    const orders=await readOrders(); const order=orders.find(o=>o.id===id); if(!order) return json({error:'Order not found.'},404);
    if(user.role!=='admin'&&order.customer.username!==user.username) return json({error:'Access denied.'},403);
    if(request.method==='GET') return json(order);
    if(request.method!=='PATCH') return json({error:'Method not allowed.'},405);
    const body=await request.json().catch(()=>({}));
    if(user.role==='customer'){
      if(body.paymentStatus==='Payment Submitted') order.paymentStatus='Payment Submitted'; else return json({error:'Access denied.'},403);
      order.updatedAt=new Date().toISOString(); await saveOrders(orders); return json({ok:true,order});
    }
    if(body.status) order.status=String(body.status);
    if(body.adminNote!==undefined) order.adminNote=String(body.adminNote);
    if(body.paymentStatus) order.paymentStatus=String(body.paymentStatus);
    if(body.filePaperTypes) for(const f of order.files) if(body.filePaperTypes[f.id]) f.paperType=String(body.filePaperTypes[f.id]);
    if(body.fileStatuses) for(const f of order.files) if(body.fileStatuses[f.id]) f.status=String(body.fileStatuses[f.id]);
    order.updatedAt=new Date().toISOString(); await saveOrders(orders); return json({ok:true,order});
  }catch(e){console.error('ORDER_ERROR',e);return json({error:'Could not update the order. '+e.message},500);}
};
