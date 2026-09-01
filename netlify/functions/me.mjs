import { getUser, json } from './_auth.mjs';
export default async (request) => { const user=getUser(request); return user ? json({ok:true,user}) : json({error:'Not authenticated.'},401); };
