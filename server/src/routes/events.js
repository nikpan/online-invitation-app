const { Router } = require('express');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const {
  listMine,
  getOne,
  create,
  update,
  transition,
  remove,
  getPublic,
} = require('../controllers/eventController');
const {
  list: listGuests,
  add: addGuest,
  update: updateGuest,
  remove: removeGuest,
  rsvp,
  getByToken,
  editByToken,
} = require('../controllers/guestController');

const router = Router();

// ─── File upload ──────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cover-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// ─── Validation schemas ───────────────────────────────────────────────────────

const createSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().required(),
  description: Joi.string().max(5000).trim().allow('', null),
  event_date: Joi.date().iso().required(),
  event_end_date: Joi.date().iso().allow(null),
  location_name: Joi.string().max(255).trim().allow('', null),
  location_address: Joi.string().max(1000).trim().allow('', null),
  location_lat: Joi.number().allow(null),
  location_lng: Joi.number().allow(null),
  theme: Joi.string().valid('confetti', 'elegant', 'neon'),
  max_guests: Joi.number().integer().min(1).allow(null),
  is_public: Joi.boolean(),
  rsvp_deadline: Joi.date().iso().allow(null),
  slug: Joi.string().lowercase().trim().pattern(/^[a-z0-9-]+$/).min(3).max(200).allow(null),
});

const updateSchema = createSchema.fork(
  ['title', 'event_date'],
  (schema) => schema.optional()
).append({
  cover_image_url: Joi.string().uri().max(500).allow('', null),
});

const guestSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().required(),
  email: Joi.string().email().lowercase().trim().allow('', null),
  phone: Joi.string().max(50).trim().allow('', null),
  rsvp_status: Joi.string().valid('pending', 'attending', 'declined', 'maybe'),
  adult_count: Joi.number().integer().min(1).max(20),
  kid_count: Joi.number().integer().min(0).max(20),
  message: Joi.string().max(1000).trim().allow('', null),
});

const rsvpSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().required(),
  email: Joi.string().email().lowercase().trim().allow('', null),
  phone: Joi.string().max(50).trim().allow('', null),
  rsvp_status: Joi.string().valid('attending', 'declined', 'maybe').required(),
  adult_count: Joi.number().integer().min(1).max(20),
  kid_count: Joi.number().integer().min(0).max(20),
  message: Joi.string().max(1000).trim().allow('', null),
});

// ─── Host routes (protected) ──────────────────────────────────────────────────

router.get('/mine', requireAuth, listMine);
router.post('/', requireAuth, validate(createSchema), create);
router.get('/:id', requireAuth, getOne);
router.put('/:id', requireAuth, validate(updateSchema), update);
router.post('/:id/:action(publish|close|reopen|archive)', requireAuth, transition);
router.delete('/:id', requireAuth, remove);

// Cover image upload
router.post('/:id/cover', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    const { Event } = require('../models');
    const event = await Event.findOne({ where: { id: req.params.id, host_id: req.user.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const url = `/uploads/${req.file.filename}`;
    await event.update({ cover_image_url: url });
    return res.json({ cover_image_url: url });
  } catch (err) {
    next(err);
  }
});

// Guest management (host)
router.get('/:id/guests', requireAuth, listGuests);
router.post('/:id/guests', requireAuth, validate(guestSchema), addGuest);
router.put('/:id/guests/:guestId', requireAuth, validate(guestSchema.fork(['name'], (s) => s.optional())), updateGuest);
router.delete('/:id/guests/:guestId', requireAuth, removeGuest);

// ─── Public routes ────────────────────────────────────────────────────────────

router.get('/public/:slug', getPublic);
router.post('/public/:slug/rsvp', validate(rsvpSchema), rsvp);
router.get('/rsvp/:token', getByToken);
router.put('/rsvp/:token', validate(rsvpSchema.fork(['rsvp_status'], (s) => s.optional())), editByToken);

module.exports = router;
