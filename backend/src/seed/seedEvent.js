'use strict';

/**
 * Seeds one complete, realistic event so the microsite can be demoed end to end.
 * Safe to re-run: it upserts by slug.
 *
 *   npm run seed
 */

const { connectDatabase, disconnectDatabase } = require('../config/database');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const logger = require('../utils/logger');

const SLUG = 'fertility-gynaecology-summit-2026';

/** Returns a date N days from today at the given hour (IST-ish wall clock). */
function daysFromNow(days, hours = 9, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const eventData = {
  title: 'Fertility & Gynaecology Summit 2026',
  slug: SLUG,
  tagline: 'Advances in Reproductive Medicine — Educate. Engage. Empower.',
  summary:
    'A one-day CME summit bringing together fertility specialists, gynaecologists and embryologists to discuss evidence-based advances in reproductive medicine, IVF outcomes and womens health.',
  description:
    'The Fertility & Gynaecology Summit 2026, hosted by the Department of Fertility & Gynaecology at Prashanth Hospitals, is designed for practising clinicians, postgraduates and allied fertility professionals.\n\nThe programme covers ovarian stimulation protocols, recurrent implantation failure, PCOS management, endometriosis surgery, fertility preservation and the ethics of assisted reproduction. Sessions combine didactic lectures with live case discussions and an interactive panel.\n\nDelegates receive CME credit points, a certificate of participation and full access to session resources.',

  category: 'cme',
  mode: 'in-person',
  status: 'published',

  startDate: daysFromNow(45, 8, 30),
  endDate: daysFromNow(45, 17, 30),
  timezone: 'Asia/Kolkata',

  registrationOpensAt: daysFromNow(-10, 0, 0),
  registrationClosesAt: daysFromNow(43, 23, 59),

  capacity: 400,
  registeredCount: 182,

  organizer: {
    name: 'Prashanth Hospitals',
    department: 'Department of Fertility & Gynaecology',
    logoUrl: '/assets/logo-prashanth.svg',
    websiteUrl: 'https://www.prashanthhospitals.com',
  },

  venue: {
    name: 'Prashanth Hospitals — Convention Hall',
    addressLine1: 'Velappanchavadi, Chennai–Bengaluru Highway',
    addressLine2: 'Near Poonamallee',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600077',
    landmark: 'Opposite Velappanchavadi Bus Terminus',
    mapEmbedUrl:
      'https://www.google.com/maps?q=Prashanth+Hospitals+Velappanchavadi+Chennai&output=embed',
    mapLink: 'https://maps.google.com/?q=Prashanth+Hospitals+Velappanchavadi+Chennai',
    latitude: 13.0553,
    longitude: 80.1257,
    parkingInfo: 'Complimentary delegate parking available in the basement (Gate 2).',
  },

  highlights: [
    '6 CME credit points (TNMC accredited)',
    '18 national faculty across 3 sessions',
    'Live surgical video demonstrations',
    'Certificate of participation for every delegate',
    'Lunch and networking high tea included',
  ],

  speakers: [
    {
      name: 'Dr. Lakshmi Narayanan',
      credentials: 'MBBS, MD (OBG), FRCOG',
      designation: 'Senior Consultant & Head, Reproductive Medicine',
      organization: 'Prashanth Hospitals, Chennai',
      topic: 'Individualising Ovarian Stimulation: What the Evidence Says in 2026',
      bio: 'Dr. Lakshmi has over 22 years of experience in reproductive medicine and has led more than 6,000 IVF cycles. She serves on the national advisory board for ART accreditation.',
      photoUrl: '',
      isKeynote: true,
      order: 1,
    },
    {
      name: 'Dr. Ramesh Subramanian',
      credentials: 'MBBS, MS (OBG), DNB',
      designation: 'Director, Minimally Invasive Gynaecologic Surgery',
      organization: 'Prashanth Hospitals, Chennai',
      topic: 'Endometriosis: Surgical Decision-Making Before ART',
      bio: 'A pioneer of laparoscopic gynaecologic surgery in South India with a special interest in deep infiltrating endometriosis.',
      photoUrl: '',
      isKeynote: false,
      order: 2,
    },
    {
      name: 'Dr. Anjali Mehrotra',
      credentials: 'MBBS, MD, PhD (Reproductive Endocrinology)',
      designation: 'Professor of Reproductive Endocrinology',
      organization: 'AIIMS, New Delhi',
      topic: 'PCOS Across the Life Course: Beyond Fertility',
      bio: 'Dr. Anjali leads a national cohort study on metabolic outcomes in PCOS and has published extensively on insulin sensitisers in anovulatory infertility.',
      photoUrl: '',
      isKeynote: true,
      order: 3,
    },
    {
      name: 'Dr. Vikram Shetty',
      credentials: 'MSc, PhD (Clinical Embryology)',
      designation: 'Chief Embryologist',
      organization: 'Prashanth Fertility Research Centre',
      topic: 'Time-Lapse Imaging and AI-Assisted Embryo Selection',
      bio: 'Clinical embryologist with 15 years of laboratory leadership and a focus on blastocyst culture optimisation and vitrification outcomes.',
      photoUrl: '',
      isKeynote: false,
      order: 4,
    },
    {
      name: 'Dr. Fatima Rizvi',
      credentials: 'MBBS, DGO, DNB (OBG)',
      designation: 'Consultant, Fertility Preservation',
      organization: 'Apollo Hospitals, Chennai',
      topic: 'Oncofertility: Counselling the Young Cancer Patient',
      bio: 'Dr. Fatima established one of the regions first dedicated oncofertility counselling clinics.',
      photoUrl: '',
      isKeynote: false,
      order: 5,
    },
    {
      name: 'Dr. Sanjay Kulkarni',
      credentials: 'MBBS, MD (OBG)',
      designation: 'Consultant, Recurrent Pregnancy Loss Clinic',
      organization: 'Prashanth Hospitals, Chennai',
      topic: 'Recurrent Implantation Failure: Separating Signal from Noise',
      bio: 'Focuses on immunological and endometrial factors in recurrent pregnancy loss and implantation failure.',
      photoUrl: '',
      isKeynote: false,
      order: 6,
    },
  ],

  agenda: [
    {
      date: daysFromNow(45, 0, 0),
      label: 'Summit Day — Convention Hall',
      items: [
        {
          startTime: '08:30',
          endTime: '09:00',
          title: 'Delegate Registration & Welcome Coffee',
          description: 'Scan your QR ticket at the registration desk to collect your delegate kit.',
          type: 'registration',
          track: 'Foyer',
          order: 1,
        },
        {
          startTime: '09:00',
          endTime: '09:20',
          title: 'Inaugural Address',
          description: 'Welcome by the Management and Department of Fertility & Gynaecology.',
          type: 'other',
          track: 'Main Hall',
          order: 2,
        },
        {
          startTime: '09:20',
          endTime: '10:05',
          title: 'Keynote: Individualising Ovarian Stimulation',
          description:
            'What the 2026 evidence says about protocol selection, dosing and freeze-all strategies.',
          speakerNames: ['Dr. Lakshmi Narayanan'],
          type: 'keynote',
          track: 'Main Hall',
          order: 3,
        },
        {
          startTime: '10:05',
          endTime: '10:45',
          title: 'PCOS Across the Life Course: Beyond Fertility',
          description: 'Long-term metabolic and cardiovascular considerations in PCOS care.',
          speakerNames: ['Dr. Anjali Mehrotra'],
          type: 'session',
          track: 'Main Hall',
          order: 4,
        },
        {
          startTime: '10:45',
          endTime: '11:10',
          title: 'Networking Tea Break',
          type: 'break',
          track: 'Foyer',
          order: 5,
        },
        {
          startTime: '11:10',
          endTime: '11:55',
          title: 'Endometriosis: Surgical Decision-Making Before ART',
          description: 'Live surgical video demonstration with case-based discussion.',
          speakerNames: ['Dr. Ramesh Subramanian'],
          type: 'session',
          track: 'Main Hall',
          order: 6,
        },
        {
          startTime: '11:55',
          endTime: '12:40',
          title: 'Time-Lapse Imaging and AI-Assisted Embryo Selection',
          description: 'Laboratory evidence, practical limitations and what to tell patients.',
          speakerNames: ['Dr. Vikram Shetty'],
          type: 'session',
          track: 'Main Hall',
          order: 7,
        },
        {
          startTime: '12:40',
          endTime: '13:40',
          title: 'Lunch',
          type: 'break',
          track: 'Banquet Hall',
          order: 8,
        },
        {
          startTime: '13:40',
          endTime: '14:25',
          title: 'Recurrent Implantation Failure: Separating Signal from Noise',
          speakerNames: ['Dr. Sanjay Kulkarni'],
          type: 'session',
          track: 'Main Hall',
          order: 9,
        },
        {
          startTime: '14:25',
          endTime: '15:10',
          title: 'Oncofertility: Counselling the Young Cancer Patient',
          speakerNames: ['Dr. Fatima Rizvi'],
          type: 'session',
          track: 'Main Hall',
          order: 10,
        },
        {
          startTime: '15:10',
          endTime: '16:10',
          title: 'Hands-on Workshop: Ultrasound in Early Pregnancy',
          description: 'Limited to 40 delegates. Requires a VIP or Workshop pass.',
          type: 'workshop',
          track: 'Skills Lab',
          order: 11,
        },
        {
          startTime: '16:10',
          endTime: '17:00',
          title: 'Expert Panel: Ethics and Regulation in ART',
          description: 'Moderated panel with all faculty, followed by open floor Q&A.',
          speakerNames: ['Dr. Lakshmi Narayanan', 'Dr. Anjali Mehrotra', 'Dr. Ramesh Subramanian'],
          type: 'panel',
          track: 'Main Hall',
          order: 12,
        },
        {
          startTime: '17:00',
          endTime: '17:30',
          title: 'Valedictory, Certificates & High Tea',
          type: 'networking',
          track: 'Foyer',
          order: 13,
        },
      ],
    },
  ],

  sponsors: [
    { name: 'Prashanth Fertility Research Centre', tier: 'title', logoUrl: '', order: 1 },
    { name: 'Merck Healthcare', tier: 'platinum', logoUrl: '', order: 2 },
    { name: 'Ferring Pharmaceuticals', tier: 'gold', logoUrl: '', order: 3 },
    { name: 'Vitrolife', tier: 'gold', logoUrl: '', order: 4 },
    { name: 'Chennai OBGYN Society', tier: 'partner', logoUrl: '', order: 5 },
  ],

  faqs: [
    {
      question: 'Who should attend this summit?',
      answer:
        'Practising gynaecologists, fertility specialists, postgraduates in OBG, clinical embryologists, fertility counsellors and allied reproductive health professionals.',
      order: 1,
    },
    {
      question: 'Will CME credit points be awarded?',
      answer:
        'Yes. The summit is accredited for 6 CME credit points by the Tamil Nadu Medical Council. Credit requires check-in at the venue and attendance until the valedictory session.',
      order: 2,
    },
    {
      question: 'How do I receive my ticket after registering?',
      answer:
        'Immediately after registration you receive a digital ticket with a unique QR code on WhatsApp and email. Show that QR code at the registration desk on event day.',
      order: 3,
    },
    {
      question: 'Can I register a colleague along with me?',
      answer:
        'Yes. The Couple/Duo pass admits two delegates on a single registration. Each delegate still receives an individual QR code and certificate.',
      order: 4,
    },
    {
      question: 'What is the cancellation and refund policy?',
      answer:
        'Cancellations requested in writing up to 14 days before the event are eligible for a refund less a 10% processing fee. Registrations are transferable to another delegate at no cost.',
      order: 5,
    },
    {
      question: 'Is accommodation provided?',
      answer:
        'Accommodation is not included. Our delegate desk can share a list of partner hotels near the venue with negotiated rates on request.',
      order: 6,
    },
  ],

  announcements: [
    {
      message: 'Early bird pricing closes in 7 days — register now to save ₹500 on delegate passes.',
      level: 'info',
      isActive: true,
      publishedAt: new Date(),
      expiresAt: daysFromNow(7, 23, 59),
    },
    {
      message: 'The hands-on ultrasound workshop has limited seats and is filling quickly.',
      level: 'info',
      isActive: true,
      publishedAt: new Date(),
      expiresAt: null,
    },
  ],

  contact: {
    name: 'Delegate Helpdesk — Events Team',
    phone: '+914442279999',
    whatsapp: '+919840012345',
    email: 'events@prashanthhospitals.com',
  },

  seo: {
    metaTitle: 'Fertility & Gynaecology Summit 2026 | Prashanth Hospitals',
    metaDescription:
      'A one-day CME summit on advances in reproductive medicine, IVF and womens health. 6 CME credit points. Chennai. Register now.',
    keywords: [
      'fertility conference chennai',
      'gynaecology CME 2026',
      'IVF summit india',
      'reproductive medicine conference',
      'prashanth hospitals events',
    ],
    ogImageUrl: '/assets/og-summit-2026.jpg',
    noIndex: false,
  },

  theme: {
    primaryColor: '#0E5C8A',
    accentColor: '#E4859B',
    heroImageUrl: '',
    logoUrl: '/assets/logo-prashanth.svg',
  },

  isFeatured: true,
};

const ticketTypesData = [
  {
    name: 'Delegate — Regular',
    code: 'REG',
    description: 'Full-day access to all main hall sessions, delegate kit, lunch and certificate.',
    kind: 'paid',
    price: 2500,
    taxPercent: 18,
    admitsCount: 1,
    quantityTotal: 250,
    quantitySold: 118,
    minPerOrder: 1,
    maxPerOrder: 5,
    benefits: [
      'Access to all main hall sessions',
      'Delegate kit and printed programme',
      'Lunch and high tea',
      '6 CME credit points',
      'E-certificate of participation',
    ],
    isPubliclyVisible: true,
    isActive: true,
    order: 1,
  },
  {
    name: 'PG Student / Resident',
    code: 'PGS',
    description: 'Concessional pass for postgraduates. Valid institutional ID required at check-in.',
    kind: 'paid',
    price: 1200,
    taxPercent: 18,
    admitsCount: 1,
    quantityTotal: 80,
    quantitySold: 44,
    minPerOrder: 1,
    maxPerOrder: 2,
    benefits: [
      'Access to all main hall sessions',
      'Delegate kit',
      'Lunch and high tea',
      'E-certificate of participation',
    ],
    allowedParticipantTypes: ['PG Student', 'Resident'],
    isPubliclyVisible: true,
    isActive: true,
    order: 2,
  },
  {
    name: 'Duo Pass (2 Delegates)',
    code: 'CPL',
    description: 'One registration admitting two delegates. Each receives an individual QR ticket.',
    kind: 'couple',
    price: 4500,
    taxPercent: 18,
    admitsCount: 2,
    quantityTotal: 60,
    quantitySold: 12,
    minPerOrder: 1,
    maxPerOrder: 3,
    benefits: [
      'Admits two delegates',
      'Two delegate kits and two certificates',
      'Reserved seating block',
      'Lunch and high tea for both',
    ],
    isPubliclyVisible: true,
    isActive: true,
    order: 3,
  },
  {
    name: 'VIP + Hands-on Workshop',
    code: 'VIP',
    description:
      'Includes the limited-capacity ultrasound skills workshop and faculty networking dinner.',
    kind: 'vip',
    price: 6500,
    taxPercent: 18,
    admitsCount: 1,
    quantityTotal: 40,
    quantitySold: 33,
    minPerOrder: 1,
    maxPerOrder: 2,
    benefits: [
      'Everything in the Regular pass',
      'Seat in the hands-on ultrasound workshop',
      'Front-row reserved seating',
      'Faculty networking dinner',
      'Printed session resource compendium',
    ],
    isPubliclyVisible: true,
    isActive: true,
    order: 4,
  },
  {
    name: 'Invited Faculty / Complimentary',
    code: 'COMP',
    description: 'Issued by the organising committee. Not available for public purchase.',
    kind: 'complimentary',
    price: 0,
    admitsCount: 1,
    quantityTotal: 30,
    quantitySold: 18,
    benefits: ['Full access', 'Faculty lounge', 'Networking dinner'],
    isPubliclyVisible: false,
    isActive: true,
    order: 5,
  },
];

async function seed() {
  await connectDatabase();

  // Load-then-save (rather than findOneAndUpdate) so document middleware and
  // validators run: slug derivation, publishedAt, and the date-order checks.
  let event = await Event.findOne({ slug: SLUG });
  if (!event) {
    event = new Event(eventData);
  } else {
    event.set(eventData);
  }
  await event.save();

  logger.info(`Seeded event: ${event.title} (${event.slug})`);

  for (const ticket of ticketTypesData) {
    let doc = await TicketType.findOne({ event: event._id, code: ticket.code });
    if (!doc) {
      doc = new TicketType({ ...ticket, event: event._id });
    } else {
      doc.set({ ...ticket, event: event._id });
    }
    await doc.save();
  }

  logger.info(`Seeded ${ticketTypesData.length} ticket types`);
  logger.info(`Microsite URL: /events/${event.slug}`);

  await disconnectDatabase();
}

seed().catch(async (err) => {
  logger.error('Seeding failed', err);
  try {
    await disconnectDatabase();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
