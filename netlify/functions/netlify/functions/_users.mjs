import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const store = () => getStore('phase16-users');
const KEY = 'users.json';

// Demo/prototype admin. For a real deployment, set ADMIN_USERNAME,
// ADMIN_PASSWORD and PHASE16_SECRET in Netlify Environment Variables.
export const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  name: 'Ayush Admin',
  role: 'admin',
  phone: ''
};

async function readUsers() {
  return (await store().get(KEY, { type: 'json' })) || [];
}

async function saveUsers(users) {
  await store().setJSON(KEY, users);
}

export async function findCustomer(phone) {
  const key = String(phone || '').replace(/\D/g, '');
  if (!key) return null;
  const users = await readUsers();
  return users.find(u => u.role === 'customer' && u.username === key) || null;
}

export async function findUser(username) {
  const key = String(username || '').trim();
  if (!key) return null;
  if (key === ADMIN_USER.username) return ADMIN_USER;

  // Customer Login ID is exactly the registered 10-digit mobile number.
  const phone = key.replace(/\D/g, '');
  if (phone !== key) return null;
  return findCustomer(phone);
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return { salt, hash };
}

export function verifyPassword(password, user) {
  if (user === ADMIN_USER || user.role === 'admin') {
    return password === ADMIN_USER.password;
  }
  if (!user.passwordHash || !user.salt) return false;
  return hashPassword(password, user.salt).hash === user.passwordHash;
}

export async function createCustomer({ name, phone, password }) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const users = await readUsers();

  // Mobile number is both the unique Customer Login ID and account key.
  if (users.some(u => u.role === 'customer' && u.username === cleanPhone)) {
    const error = new Error('This mobile number is already registered. Please login with your mobile number.');
    error.code = 'DUPLICATE_PHONE';
    throw error;
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    username: cleanPhone,
    name,
    phone: cleanPhone,
    role: 'customer',
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await saveUsers(users);
  return user;
}
