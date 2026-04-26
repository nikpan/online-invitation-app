const crypto = require('crypto');
const { Op } = require('sequelize');
const { Event, Guest } = require('../models');

function generateEditToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── List guests for an event ─────────────────────────────────────────────────

async function list(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { status, page = 1, limit = 50 } = req.query;
    const where = { event_id: req.params.id };
    if (status) where.rsvp_status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Guest.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      guests: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Add guest manually ───────────────────────────────────────────────────────

async function add(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { name, email, phone, rsvp_status, adult_count, kid_count, message } = req.body;

    const guest = await Guest.create({
      event_id: req.params.id,
      name,
      email,
      phone,
      rsvp_status: rsvp_status || 'pending',
      adult_count: adult_count || 1,
      kid_count: kid_count || 0,
      message,
      edit_token: generateEditToken(),
      rsvp_at: rsvp_status ? new Date() : null,
    });

    return res.status(201).json({ guest });
  } catch (err) {
    next(err);
  }
}

// ─── Update guest ─────────────────────────────────────────────────────────────

async function update(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const guest = await Guest.findOne({
      where: { id: req.params.guestId, event_id: req.params.id },
    });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const { name, email, phone, rsvp_status, adult_count, kid_count, message } = req.body;

    const hadStatus = guest.rsvp_status !== 'pending';
    const gettingStatus = rsvp_status && rsvp_status !== 'pending';

    await guest.update({
      name: name ?? guest.name,
      email: email !== undefined ? email : guest.email,
      phone: phone !== undefined ? phone : guest.phone,
      rsvp_status: rsvp_status ?? guest.rsvp_status,
      adult_count: adult_count ?? guest.adult_count,
      kid_count: kid_count ?? guest.kid_count,
      message: message !== undefined ? message : guest.message,
      rsvp_at: !hadStatus && gettingStatus ? new Date() : guest.rsvp_at,
    });

    return res.json({ guest });
  } catch (err) {
    next(err);
  }
}

// ─── Remove guest ─────────────────────────────────────────────────────────────

async function remove(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const guest = await Guest.findOne({
      where: { id: req.params.guestId, event_id: req.params.id },
    });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    await guest.destroy();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Public RSVP submission ───────────────────────────────────────────────────

async function rsvp(req, res, next) {
  try {
    const event = await Event.findOne({ where: { slug: req.params.slug } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.status !== 'published') {
      return res.status(409).json({ error: 'RSVPs are not open for this event' });
    }

    if (event.rsvp_deadline && new Date() > new Date(event.rsvp_deadline)) {
      return res.status(409).json({ error: 'The RSVP deadline has passed' });
    }

    const { name, email, phone, rsvp_status, adult_count, kid_count, message } = req.body;

    // Check guest cap
    if (event.max_guests && rsvp_status === 'attending') {
      const currentAttending = await Guest.sum('adult_count', {
        where: { event_id: event.id, rsvp_status: 'attending' },
      });
      const requested = parseInt(adult_count) || 1;
      if ((currentAttending || 0) + requested > event.max_guests) {
        return res.status(409).json({ error: 'Sorry, the event is at capacity' });
      }
    }

    const edit_token = generateEditToken();

    const guest = await Guest.create({
      event_id: event.id,
      name,
      email,
      phone,
      rsvp_status: rsvp_status || 'attending',
      adult_count: adult_count || 1,
      kid_count: kid_count || 0,
      message,
      edit_token,
      rsvp_at: new Date(),
    });

    return res.status(201).json({ guest, edit_token });
  } catch (err) {
    next(err);
  }
}

// ─── Get RSVP by edit token (for guest edit flow) ─────────────────────────────

async function getByToken(req, res, next) {
  try {
    const guest = await Guest.findOne({
      where: { edit_token: req.params.token },
      include: [{ association: 'event' }],
    });

    if (!guest) return res.status(404).json({ error: 'RSVP not found' });

    return res.json({ guest, event: guest.event });
  } catch (err) {
    next(err);
  }
}

// ─── Edit RSVP by edit token ──────────────────────────────────────────────────

async function editByToken(req, res, next) {
  try {
    const guest = await Guest.findOne({
      where: { edit_token: req.params.token },
      include: [{ association: 'event' }],
    });

    if (!guest) return res.status(404).json({ error: 'RSVP not found' });
    if (guest.event.status === 'closed') {
      return res.status(409).json({ error: 'RSVPs are closed for this event' });
    }

    const { name, email, phone, rsvp_status, adult_count, kid_count, message } = req.body;

    await guest.update({
      name: name ?? guest.name,
      email: email !== undefined ? email : guest.email,
      phone: phone !== undefined ? phone : guest.phone,
      rsvp_status: rsvp_status ?? guest.rsvp_status,
      adult_count: adult_count ?? guest.adult_count,
      kid_count: kid_count ?? guest.kid_count,
      message: message !== undefined ? message : guest.message,
    });

    return res.json({ guest });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, add, update, remove, rsvp, getByToken, editByToken };
