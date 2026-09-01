import { findUser, verifyPassword } from './_users.mjs';
import { createToken, json } from './_auth.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const requestedRole = String(body.role || '').trim().toLowerCase();
    if (!username || !password) return json({ error: 'Please enter Login ID and password.' }, 400);

    const user = await findUser(username);
    if (!user || !verifyPassword(password, user)) return json({ error: 'Invalid Login ID or password.' }, 401);
    if (requestedRole && requestedRole !== user.role) return json({ error: `This Login ID is not registered as ${requestedRole}.` }, 403);

    const token = createToken(user);
    return json({ ok: true, token, user: { username: user.username, name: user.name, phone: user.phone || '', role: user.role } });
  } catch (e) {
    console.error('LOGIN_ERROR', e);
    return json({ error: 'Login service error. Check Netlify Functions deployment and environment variables.' }, 500);
  }
};
