export default async () => new Response(JSON.stringify({ok:true,service:'phase16',time:new Date().toISOString()}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
