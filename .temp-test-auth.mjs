import { auth } from './server/auth.ts'
const req = new Request('http://localhost/auth/sign-up/email', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ name: 'Test', email: 'test+check@example.com', password: 'Password123!' }),
})
const res = await auth.handler(req)
console.log('status', res.status)
console.log('headers', Object.fromEntries(res.headers.entries()))
console.log('text', await res.text())
