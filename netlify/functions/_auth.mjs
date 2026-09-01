import crypto from 'node:crypto';
const secret = process.env.PHASE16_SECRET || 'phase16-demo-secret-change-in-netlify';
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');
export function createToken(user) {
  const payload = b64(JSON.stringify({ username:user.username, name:user.name, role:user.role, phone:user.phone||'', exp:Date.now()+7*24*60*60*1000 }));
  return `${payload}.${sign(payload)}`;
}
export function getUser(request) {
  const auth = request.headers.get('authorization') || request.headers.get('x-session-token') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const [payload,sig] = token.split('.'); if (!payload || !sig) return null;
  const expected=sign(payload); const a=Buffer.from(sig); const b=Buffer.from(expected);
  if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) return null;
  try { const data=JSON.parse(Buffer.from(payload,'base64url').toString()); return data.exp && data.exp>Date.now() ? data : null; } catch { return null; }
}
export function json(body,status=200,extraHeaders={}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type':'application/json','Cache-Control':'no-store',...extraHeaders } });
}
