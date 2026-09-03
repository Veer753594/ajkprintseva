import { createCustomer } from './_users.mjs';
import { createToken, json } from './_auth.mjs';
export default async (request) => {
  if (request.method !== 'POST') return json({ error:'Method not allowed.' },405);
  try {
    const body=await request.json().catch(()=>({}));
    const name=String(body.name||'').trim(); const phone=String(body.phone||'').replace(/\D/g,''); const password=String(body.password||'');
    if(name.length<2) return json({error:'Please enter your full name.'},400);
    if(phone.length!==10) return json({error:'Please enter a valid 10-digit mobile number.'},400);
    if(password.length<6) return json({error:'Password must be at least 6 characters.'},400);
    const user=await createCustomer({name,phone,password}); const token=createToken(user);
    return json({ok:true,token,user:{username:user.username,name:user.name,phone:user.phone,role:user.role},message:'Account created successfully.'},201);
  } catch(e) { console.error('SIGNUP_ERROR',e); if(e.code==='DUPLICATE_PHONE') return json({error:e.message},409); return json({error:'Could not create the account. '+e.message},500); }
};
