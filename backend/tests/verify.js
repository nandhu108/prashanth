/* Verification suite: exercises models, virtuals, serializer and the HTTP
   layer without a live MongoDB (binaries are unreachable in this sandbox).
   Run with: npm run verify */
process.env.NODE_ENV = 'development';

const mongoose = require('mongoose');
const Event = require('../src/models/Event');
const TicketType = require('../src/models/TicketType');
const {
  serializeEventForPublic,
  serializeTicketTypeForPublic,
  serializeEventCard,
} = require('../src/services/eventSerializer');
const { hashPassword, comparePassword } = require('../src/utils/password');
const { signAdminToken, verifyAdminToken } = require('../src/utils/jwt');

let pass = 0;
let fail = 0;
function check(label, fn) {
  try {
    const note = fn();
    console.log(`PASS  ${label}${note ? '  — ' + note : ''}`);
    pass++;
  } catch (e) {
    console.log(`FAIL  ${label}  — ${e.message}`);
    fail++;
  }
}
async function checkAsync(label, fn) {
  try {
    const note = await fn();
    console.log(`PASS  ${label}${note ? '  — ' + note : ''}`);
    pass++;
  } catch (e) {
    console.log(`FAIL  ${label}  — ${e.message}`);
    fail++;
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const days = (n, h = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, 0, 0, 0);
  return d;
};

console.log('\n=== 1. Event model: validation, slug, virtuals ===');

const ev = new Event({
  title: 'Fertility & Gynaecology Summit 2026',
  summary: 'CME summit',
  status: 'published',
  startDate: days(45),
  endDate: days(45, 17),
  registrationOpensAt: days(-10),
  registrationClosesAt: days(43),
  capacity: 400,
  registeredCount: 182,
  venue: { name: 'Convention Hall', city: 'Chennai', state: 'Tamil Nadu' },
  speakers: [
    { name: 'Dr. A', order: 2, isKeynote: false },
    { name: 'Dr. B', order: 1, isKeynote: true },
  ],
  agenda: [
    {
      date: days(45),
      items: [
        { startTime: '10:00', title: 'Second', order: 2 },
        { startTime: '09:00', title: 'First', order: 1 },
      ],
    },
  ],
  faqs: [{ question: 'Q?', answer: 'A.', order: 1 }],
  announcements: [
    { message: 'Active one', isActive: true, expiresAt: days(7) },
    { message: 'Expired one', isActive: true, expiresAt: days(-1) },
    { message: 'Switched off', isActive: false },
  ],
});

// Run the real (async) validation path so document middleware fires, exactly
// as it does on save(). validateSync() deliberately skips hooks.
async function main() {
await checkAsync('validates a well-formed event', async () => {
  await ev.validate();
});

check('auto-generates a URL slug from the title', () => {
  assert(/^fertility-/.test(ev.slug || ''), 'got ' + ev.slug);
  return ev.slug;
});

check('sets publishedAt when status becomes published', () => {
  assert(ev.publishedAt instanceof Date, 'publishedAt not set');
  return ev.publishedAt.toISOString().slice(0, 10);
});

check('registrationState = open for a live event', () => {
  assert(ev.registrationState === 'open', 'got ' + ev.registrationState);
  return ev.registrationState;
});

check('seatsRemaining = capacity - registered', () => {
  assert(ev.seatsRemaining === 218, 'got ' + ev.seatsRemaining);
  return ev.seatsRemaining + ' of 400';
});

check('sold-out detection flips registrationState', () => {
  ev.registeredCount = 400;
  assert(ev.isSoldOut === true, 'isSoldOut false');
  assert(ev.registrationState === 'sold-out', 'got ' + ev.registrationState);
  ev.registeredCount = 182;
  return 'sold-out';
});

check('closed registration window is honoured', () => {
  const orig = ev.registrationClosesAt;
  ev.registrationClosesAt = days(-1);
  assert(ev.registrationState === 'closed', 'got ' + ev.registrationState);
  ev.registrationClosesAt = orig;
  return 'closed';
});

check('not-yet-open window is honoured', () => {
  const orig = ev.registrationOpensAt;
  ev.registrationOpensAt = days(5);
  assert(ev.registrationState === 'not-yet-open', 'got ' + ev.registrationState);
  ev.registrationOpensAt = orig;
  return 'not-yet-open';
});

check('unlimited capacity (0) never sells out', () => {
  const orig = ev.capacity;
  ev.capacity = 0;
  assert(ev.isSoldOut === false && ev.seatsRemaining === null, 'unlimited mishandled');
  ev.capacity = orig;
  return 'seatsRemaining=null';
});

check('rejects endDate before startDate (sync path too)', () => {
  const bad = new Event({ title: 'Bad', startDate: days(10), endDate: days(5) });
  const err = bad.validateSync();
  assert(err, 'expected a validation error');
  assert(err.errors.endDate, 'error not attached to endDate');
  return err.errors.endDate.message;
});

check('rejects registration closing before it opens', () => {
  const bad = new Event({
    title: 'Bad Window',
    startDate: days(10),
    endDate: days(11),
    registrationOpensAt: days(5),
    registrationClosesAt: days(2),
  });
  const err = bad.validateSync();
  assert(err && err.errors.registrationClosesAt, 'expected a validation error');
  return err.errors.registrationClosesAt.message;
});

check('only active, unexpired announcements surface', () => {
  assert(ev.activeAnnouncements.length === 1, 'got ' + ev.activeAnnouncements.length);
  assert(ev.activeAnnouncements[0].message === 'Active one');
  return '1 of 3 shown';
});

console.log('\n=== 2. TicketType model: pricing and availability ===');

const mk = (o) => new TicketType({ event: new mongoose.Types.ObjectId(), ...o });

check('GST-inclusive price computed correctly', () => {
  const t = mk({ name: 'Regular', code: 'REG', price: 2500, taxPercent: 18 });
  assert(t.priceWithTax === 2950, 'got ' + t.priceWithTax);
  return 'Rs.2500 +18% = Rs.2950';
});

check('free / complimentary passes flagged', () => {
  const t = mk({ name: 'Comp', code: 'COMP', price: 0, kind: 'complimentary' });
  assert(t.isFree === true, 'not free');
  assert(t.priceWithTax === 0);
  return 'isFree=true';
});

check('availability nets off sold and held inventory', () => {
  const t = mk({ name: 'VIP', code: 'VIP', price: 6500, quantityTotal: 40, quantitySold: 33, quantityHeld: 2 });
  assert(t.quantityAvailable === 5, 'got ' + t.quantityAvailable);
  assert(t.isSoldOut === false);
  assert(t.saleState === 'on-sale', 'got ' + t.saleState);
  return '5 left, on-sale';
});

check('sold-out pass reports sold-out saleState', () => {
  const t = mk({ name: 'X', code: 'X', quantityTotal: 10, quantitySold: 10 });
  assert(t.isSoldOut === true && t.saleState === 'sold-out', 'got ' + t.saleState);
  return 'sold-out';
});

check('unlimited pass (quantityTotal 0) never sells out', () => {
  const t = mk({ name: 'Y', code: 'Y', quantityTotal: 0, quantitySold: 999 });
  assert(t.quantityAvailable === null && t.isSoldOut === false);
  return 'unlimited';
});

check('sales window closes the pass', () => {
  const t = mk({ name: 'Z', code: 'Z', salesEndAt: days(-1) });
  assert(t.saleState === 'closed', 'got ' + t.saleState);
  return 'closed';
});

check('inactive pass reports inactive', () => {
  const t = mk({ name: 'W', code: 'W', isActive: false });
  assert(t.saleState === 'inactive');
  return 'inactive';
});

console.log('\n=== 3. Public serializer: payload shape, SEO, data leaks ===');

const payload = serializeEventForPublic(ev);

check('sorts speakers by display order', () => {
  assert(payload.speakers[0].name === 'Dr. B', 'got ' + payload.speakers[0].name);
  return 'Dr. B (keynote) first';
});

check('sorts agenda items by order', () => {
  assert(payload.agenda[0].items[0].title === 'First', 'got ' + payload.agenda[0].items[0].title);
  return 'First, Second';
});

check('builds schema.org JSON-LD for rich previews', () => {
  assert(payload.jsonLd['@type'] === 'Event', 'wrong @type');
  assert(payload.jsonLd.location['@type'] === 'Place', 'wrong location type');
  assert(payload.jsonLd.eventAttendanceMode.includes('Offline'), 'wrong attendance mode');
  assert(payload.jsonLd.organizer.name === 'Prashanth Hospitals');
  return payload.jsonLd.location.addressLocality;
});

check('falls back to sensible SEO meta when unset', () => {
  assert(payload.seo.metaTitle.includes('Prashanth Hospitals'), payload.seo.metaTitle);
  assert(payload.seo.metaDescription.length > 0);
  assert(payload.seo.canonicalUrl.includes('/events/'), payload.seo.canonicalUrl);
  return payload.seo.metaTitle;
});

check('virtual-mode event hides physical venue', () => {
  ev.mode = 'virtual';
  ev.virtualLink = 'https://zoom.example/abc';
  const v = serializeEventForPublic(ev);
  assert(v.venue === null, 'venue leaked on virtual event');
  assert(v.virtualLink === 'https://zoom.example/abc', 'virtual link missing');
  assert(v.jsonLd.location['@type'] === 'VirtualLocation', 'wrong JSON-LD location');
  ev.mode = 'in-person';
  return 'venue=null, VirtualLocation';
});

check('in-person event hides the virtual join link', () => {
  const v = serializeEventForPublic(ev);
  assert(v.virtualLink === '', 'virtual link leaked');
  return 'virtualLink hidden';
});

const pubTicket = serializeTicketTypeForPublic(
  mk({ name: 'VIP', code: 'VIP', price: 6500, taxPercent: 18, quantityTotal: 40, quantitySold: 33 })
);

check('ticket payload never exposes internal inventory', () => {
  ['quantityTotal', 'quantitySold', 'quantityHeld', 'quantityAvailable'].forEach((k) => {
    assert(!(k in pubTicket), `leaked ${k}`);
  });
  return 'no raw counts exposed';
});

check('surfaces scarcity as a boolean only', () => {
  assert(pubTicket.isLowStock === true, 'expected low stock flag');
  return 'isLowStock=true (7 left)';
});

check('event card shape is compact for listings', () => {
  const card = serializeEventCard(ev);
  assert(!('agenda' in card) && !('speakers' in card) && !('faqs' in card), 'card too heavy');
  assert(card.registrationState === 'open' && card.slug, 'card missing key fields');
  return Object.keys(card).length + ' fields';
});

console.log('\n=== 4. HTTP layer ===');

const app = require('../src/app');
const server = app.listen(5099);
const base = 'http://127.0.0.1:5099';

{
  const get = async (p, origin) => {
    const res = await fetch(base + p, origin ? { headers: { Origin: origin } } : undefined);
    let body = null;
    try { body = await res.json(); } catch { /* non-json */ }
    return { res, body };
  };

  let r = await get('/api/v1/health');
  check('GET /api/v1/health returns ok envelope', () => {
    assert(r.res.status === 200 && r.body.success === true, 'status ' + r.res.status);
    assert(r.body.data.status === 'ok');
    return 'db=' + r.body.data.database + ' (no DB in sandbox, as expected)';
  });

  r = await get('/');
  check('GET / returns API index', () => {
    assert(r.res.status === 200 && r.body.data.version === 'v1');
    return r.body.data.name;
  });

  r = await get('/api/v1/nope');
  check('unknown route -> 404 error envelope', () => {
    assert(r.res.status === 404 && r.body.success === false, 'status ' + r.res.status);
    assert(r.body.error.code === 'ROUTE_NOT_FOUND', r.body.error.code);
    return r.body.error.code;
  });

  check('security headers applied by helmet', () => {
    assert(r.res.headers.get('x-content-type-options') === 'nosniff', 'missing nosniff');
    assert(!r.res.headers.get('x-powered-by'), 'x-powered-by leaked');
    return 'nosniff set, x-powered-by removed';
  });

  check('rate-limit headers present on /api', () => {
    assert(r.res.headers.get('ratelimit-limit'), 'no ratelimit-limit header');
    return 'limit=' + r.res.headers.get('ratelimit-limit');
  });

  r = await get('/api/v1/health', 'http://localhost:5173');
  check('CORS allows the configured frontend origin', () => {
    assert(
      r.res.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'got ' + r.res.headers.get('access-control-allow-origin')
    );
    return 'localhost:5173 allowed';
  });

  r = await get('/api/v1/health', 'http://evil.example.com');
  check('CORS rejects an unknown origin', () => {
    assert(!r.res.headers.get('access-control-allow-origin'), 'unknown origin was allowed');
    return 'blocked';
  });

  console.log('\n=== 5. Auth: passwords, JWT, RBAC guard ===');

  await checkAsync('bcrypt hash round-trips and rejects wrong password', async () => {
    const hash = await hashPassword('Correct-Horse-1');
    assert(await comparePassword('Correct-Horse-1', hash) === true, 'valid password rejected');
    assert(await comparePassword('wrong', hash) === false, 'wrong password accepted');
  });

  check('JWT sign/verify round-trips the user id and role', () => {
    const token = signAdminToken({ _id: '507f1f77bcf86cd799439011', role: 'superadmin' });
    const payload = verifyAdminToken(token);
    assert(payload.sub === '507f1f77bcf86cd799439011', 'sub mismatch');
    assert(payload.role === 'superadmin', 'role mismatch');
    return 'sub+role preserved';
  });

  check('a tampered/garbage token fails verification', () => {
    let threw = false;
    try {
      verifyAdminToken('not.a.real.token');
    } catch {
      threw = true;
    }
    assert(threw, 'garbage token was accepted');
    return 'rejected';
  });

  r = await (async () => {
    const res = await fetch(base + '/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return { res, body: await res.json() };
  })();
  check('login without credentials -> 400, never touches the DB', () => {
    assert(r.res.status === 400, 'status ' + r.res.status);
    assert(r.body.success === false);
    return r.body.error.message;
  });

  r = await get('/api/v1/admin/auth/me');
  check('protected route without a token -> 401', () => {
    assert(r.res.status === 401, 'status ' + r.res.status);
    return r.body.error.message;
  });

  r = await (async () => {
    const res = await fetch(base + '/api/v1/admin/auth/me', {
      headers: { Authorization: 'Bearer garbage.token.here' },
    });
    return { res, body: await res.json() };
  })();
  check('protected route with an invalid token -> 401', () => {
    assert(r.res.status === 401, 'status ' + r.res.status);
    return r.body.error.message;
  });

  server.close();
  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail ? 1 : 0);
}
}

main().catch((e) => { console.error(e); process.exit(1); });
