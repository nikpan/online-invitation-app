import type { RequestHandler } from 'express';
import { Op } from 'sequelize';
import { Event, Guest } from '../models';
import type { EventStatus, EventTheme } from '../models/Event';
import type { RsvpStatus } from '../models/Guest';
import { uniqueSlug } from '../utils/slug';

interface RsvpCounts {
  total: number;
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
}

function emptyCounts(): RsvpCounts {
  return { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0 };
}

export const listMine: RequestHandler = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { host_id: req.user!.id },
      order: [['created_at', 'DESC']],
    });

    const ids = events.map((e) => e.id);
    const counts = await Guest.findAll({
      where: { event_id: { [Op.in]: ids } },
      attributes: ['event_id', 'rsvp_status'],
      raw: true,
    });

    const countMap: Record<string, RsvpCounts> = {};
    for (const row of counts as Array<{ event_id: string; rsvp_status: RsvpStatus }>) {
      if (!countMap[row.event_id]) countMap[row.event_id] = emptyCounts();
      countMap[row.event_id].total++;
      countMap[row.event_id][row.rsvp_status]++;
    }

    const result = events.map((e) => ({
      ...e.toJSON(),
      guest_counts: countMap[e.id] || emptyCounts(),
    }));

    res.json({ events: result });
  } catch (err) {
    next(err);
  }
};

export const getOne: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ event });
  } catch (err) {
    next(err);
  }
};

interface CreateEventBody {
  title: string;
  description?: string | null;
  event_date: string;
  event_end_date?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  theme?: EventTheme;
  max_guests?: number | null;
  is_public?: boolean;
  rsvp_deadline?: string | null;
  slug?: string;
}

export const create: RequestHandler<unknown, unknown, CreateEventBody> = async (req, res, next) => {
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
        res.status(409).json({ error: 'That URL slug is already taken' });
        return;
      }
    }

    const event = await Event.create({
      host_id: req.user!.id,
      slug,
      title,
      description: description ?? null,
      event_date: new Date(event_date),
      event_end_date: event_end_date ? new Date(event_end_date) : null,
      location_name: location_name ?? null,
      location_address: location_address ?? null,
      location_lat: location_lat ?? null,
      location_lng: location_lng ?? null,
      cover_image_url: null,
      theme: theme || 'confetti',
      max_guests: max_guests ?? null,
      is_public: is_public !== undefined ? is_public : true,
      rsvp_deadline: rsvp_deadline ? new Date(rsvp_deadline) : null,
      status: 'draft',
    });

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

interface UpdateEventBody extends Partial<CreateEventBody> {
  cover_image_url?: string | null;
}

export const update: RequestHandler<{ id: string }, unknown, UpdateEventBody> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

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
        res.status(409).json({ error: 'That URL slug is already taken' });
        return;
      }
    }

    await event.update({
      title: title ?? event.title,
      description: description !== undefined ? description : event.description,
      event_date: event_date ? new Date(event_date) : event.event_date,
      event_end_date:
        event_end_date !== undefined
          ? event_end_date ? new Date(event_end_date) : null
          : event.event_end_date,
      location_name: location_name !== undefined ? location_name : event.location_name,
      location_address: location_address !== undefined ? location_address : event.location_address,
      location_lat: location_lat !== undefined ? location_lat : event.location_lat,
      location_lng: location_lng !== undefined ? location_lng : event.location_lng,
      cover_image_url: cover_image_url !== undefined ? cover_image_url : event.cover_image_url,
      theme: theme ?? event.theme,
      max_guests: max_guests !== undefined ? max_guests : event.max_guests,
      is_public: is_public !== undefined ? is_public : event.is_public,
      rsvp_deadline:
        rsvp_deadline !== undefined
          ? rsvp_deadline ? new Date(rsvp_deadline) : null
          : event.rsvp_deadline,
      slug: newSlug ?? event.slug,
    });

    res.json({ event });
  } catch (err) {
    next(err);
  }
};

type Action = 'publish' | 'close' | 'reopen' | 'archive';

const ACTION_MAP: Record<Action, { from: EventStatus[]; to: EventStatus }> = {
  publish: { from: ['draft', 'closed'], to: 'published' },
  close: { from: ['published'], to: 'closed' },
  reopen: { from: ['closed'], to: 'published' },
  archive: { from: ['draft', 'published', 'closed'], to: 'archived' },
};

export const transition: RequestHandler<{ id: string; action: string }> = async (req, res, next) => {
  try {
    const action = req.params.action as Action;
    const rule = ACTION_MAP[action];
    if (!rule) {
      res.status(400).json({ error: 'Unknown action' });
      return;
    }

    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (!rule.from.includes(event.status)) {
      res.status(409).json({
        error: `Cannot ${action} an event with status "${event.status}"`,
      });
      return;
    }

    await event.update({ status: rule.to });
    res.json({ event });
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    await event.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getPublic: RequestHandler<{ slug: string }> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { slug: req.params.slug },
    });

    if (!event || event.status === 'archived') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const attendingCount = await Guest.count({
      where: { event_id: event.id, rsvp_status: 'attending' },
    });

    res.json({ event, attending_count: attendingCount });
  } catch (err) {
    next(err);
  }
};
