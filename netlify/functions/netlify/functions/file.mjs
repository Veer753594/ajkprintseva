import { getStore } from '@netlify/blobs';
import { getUser, json } from './_auth.mjs';
const store=()=>getStore('phase16-print');
const isAgent=request=>{const k=process.env.AGENT_KEY||'';return !!k && request.headers.get('x-agent-key')===k;};
export default async request=>{
  const url=new URL(request.url);
  const queryToken=url.searchParams.get('token') || '';
  const authRequest=queryToken ? new Request(request,{headers:new Headers({...Object.fromEntries(request.headers),authorization:`Bearer ${queryToken}`})}) : request;
  const user=getUser(authRequest); const agent=isAgent(request);
  if(!user&&!agent) return json({error:'Please login first.'},401);
  try{
    const p=url.searchParams, fileId=p.get('file'), orderId=p.get('order');
    if(!fileId||!orderId) return json({error:'Missing file.'},400);
    const orders=(await store().get('orders.json',{type:'json'}))||[]; const order=orders.find(o=>o.id===orderId);
    if(!order) return json({error:'Access denied.'},403);
    if(!agent && (user.role!=='admin'&&order.customer.username!==user.username)) return json({error:'Access denied.'},403);
    const file=order.files.find(f=>f.id===fileId); if(!file) return json({error:'File not found.'},404);
    const blob=await store().get(`file-${fileId}`,{type:'arrayBuffer'}); if(!blob) return json({error:'File not found.'},404);
    return new Response(blob,{status:200,headers:{'Content-Type':file.type||'application/octet-stream','Content-Disposition':`attachment; filename="${file.originalName.replace(/"/g,'')}"`,'Cache-Control':'private, no-store'}});
  }catch(e){console.error('FILE_ERROR',e);return json({error:'Could not open file. '+e.message},500);}
};
