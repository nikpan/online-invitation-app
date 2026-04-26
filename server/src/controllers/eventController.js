const { Op } = require('sequelize');
const { Event, Guest } = require('../models');
const { uniqueSlug } = require('../utils/slug');

// ─── List host's events ───────────────────────────────────────────────────────

async function listMine(req, res, next) {
  try {
    const events = await Event.findAll({
      where: { host_id: req.user.id },
      order: [['created_at', 'DESC']],
      attributes: { exclude: [] },
    });

    // Attach guest counts
    const ids = events.map((e) => e.id);
    const counts = await Guest.findAll({
      where: { event_id: { [Op.in]: ids } },
      attributes: ['event_id', 'rsvp_status'],
      raw: true,
    });

    const countMap = {};
    for (const row of counts) {
      if (!countMap[row.event_id]) {
        countMap[row.event_id] = { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0 };
      }
      countMap[row.event_id].total++;
      countMap[row.event_id][row.rsvp_status]++;
    }

    const result = events.map((e) => ({
      ...e.toJSON(),
      guest_counts: countMap[e.id] || { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0 },
    }));

    return res.json({ events: result });
  } catch (err) {
    next(err);
  }
}

// ─── Get single event (host only) ────────────────────────────────────────────

async function getOne(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    return res.json({ event });
  } catch (err) {
    next(err);
  }
}

// ─── Create event ─────────────────────────────────────────────────────────────

async function create(req, res, next) {
  try {
    const {
      title,
      description,
      event_date,
      event_end_date,
      location_name,
      location_address,
      location_lat,
      location_lng,
      theme,
      max_guests,
      is_public,
      rsvp_deadline,
      slug: customSlug,
    } = req.body;

    const slug = customSlug || (await uniqueSlug(title));

    if (customSlug) {
      const existing = await Event.findOne({ where: { slug: customSlug } });
      if (existing) {
        return res.status(409).json({ error: 'That URL slug is already taken' });
      }
    }

    const event = await Event.create({
      host_id: req.user.id,
      slug,
      title,
      description,
      event_date,
      event_end_date,
      location_name,
      location_address,
      location_lat,
      location_lng,
      theme: theme || 'confetti',
      max_guests,
      is_public: is_public !== undefined ? is_public : true,
      rsvp_deadline,
      status: 'draft',
    });

    return res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

// ─── Update event ─────────────────────────────────────────────────────────────

async function update(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const {
      title,
      description,
      event_date,
      event_end_date,
      location_name,
      location_address,
      location_lat,
      location_lng,
      cover_image_url,
      theme,
      max_guests,
      is_public,
      rsvp_deadline,
      slug: newSlug,
    } = req.body;

    if (newSlug && newSlug !== event.slug) {
      const existing = await Event.findOne({ where: { slug: newSlug } });
      if (existing) {
        return res.status(409).json({ error: 'That URL slug is already taken' });
      }
    }

    await event.update({
      title: title ?? event.title,
      description: description !== undefined ? description : event.description,
      event_date: event_date ?? event.event_date,
      event_end_date: event_end_date !== undefined ? event_end_date : event.event_end_date,
      location_name: location_name !== undefined ? location_name : event.location_name,
      location_address: location_address !== undefined ? location_address : event.location_address,
      location_lat: location_lat !== undefined ? location_lat : event.location_lat,
      location_lng: location_lng !== undefined ? location_lng : event.location_lng,
      cover_image_url: cover_image_url !== undefined ? cover_image_url : event.cover_image_url,
      theme: theme ?? event.theme,
      max_guests: max_guests !== undefined ? max_guests : event.max_guests,
      is_public: is_public !== undefined ? is_public : event.is_public,
      rsvp_deadline: rsvp_deadline !== undefined ? rsvp_deadline : event.rsvp_deadline,
      slug: newSlug ?? event.slug,
    });

    return res.json({ event });
  } catch (err) {
    next(err);
  }
}

// ─── Status transitions ───────────────────────────────────────────────────────

async function transition(req, res, next) {
  const ACTION_MAP = {
    publish: { from: ['draft', 'closed'], to: 'published' },
    close: { from: ['published'], to: 'closed' },
    reopen: { from: ['closed'], to: 'published' },
    archive: { from: ['draft', 'published', 'closed'], to: 'archived' },
  };

  try {
    const action = req.params.action;
    const rule = ACTION_MAP[action];
    if (!rule) return res.status(400).json({ error: 'Unknown action' });

    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!rule.from.includes(event.status)) {
      return res.status(409).json({
        error: `Cannot ${action} an event with status "${event.status}"`,
      });
    }

    await event.update({ status: rule.to });
    return res.json({ event });
  } catch (err) {
    next(err);
  }
}

// ─── Delete event ─────────────────────────────────────────────────────────────

async function remove(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user.id },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    await event.destroy();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Get public event by slug ─────────────────────────────────────────────────

async function getPublic(req, res, next) {
  try {
    const event = await Event.findOne({
      where: { slug: req.params.slug },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status === 'archived') return res.status(404).json({ error: 'Event not found' });

    // Count attending guests
    const attendingCount = await Guest.count({
      where: { event_id: event.id, rsvp_status: 'attending' },
    });

    return res.json({ event, attending_count: attendingCount });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMine, getOne, create, update, transition, remove, getPublic };
