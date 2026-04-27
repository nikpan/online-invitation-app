import crypto from 'crypto';
import type { RequestHandler } from 'express';
import { Event, Guest } from '../models';
import type { RsvpStatus } from '../models/Guest';

function generateEditToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface GuestBody {
  name: string;
  email?: string | null;
  phone?: string | null;
  rsvp_status?: RsvpStatus;
  adult_count?: number;
  kid_count?: number;
  message?: string | null;
}

interface ListQuery {
  status?: RsvpStatus;
  page?: string;
  limit?: string;
}

export const list: RequestHandler<{ id: string }, unknown, unknown, ListQuery> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const { status, page = '1', limit = '50' } = req.query;
    const where: Record<string, unknown> = { event_id: req.params.id };
    if (status) where.rsvp_status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Guest.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({
      guests: rows,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const add: RequestHandler<{ id: string }, unknown, GuestBody> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const { name, email, phone, rsvp_status, adult_count, kid_count, message } = req.body;

    const guest = await Guest.create({
      event_id: req.params.id,
      name,
      email: email ?? null,
      phone: phone ?? null,
      rsvp_status: rsvp_status || 'pending',
      adult_count: adult_count || 1,
      kid_count: kid_count || 0,
      message: message ?? null,
      edit_token: generateEditToken(),
      rsvp_at: rsvp_status ? new Date() : null,
      reminded_at: null,
    });

    res.status(201).json({ guest });
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler<{ id: string; guestId: string }, unknown, GuestBody> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const guest = await Guest.findOne({
      where: { id: req.params.guestId, event_id: req.params.id },
    });
    if (!guest) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

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

    res.json({ guest });
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler<{ id: string; guestId: string }> = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, host_id: req.user!.id },
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const guest = await Guest.findOne({
      where: { id: req.params.guestId, event_id: req.params.id },
    });
    if (!guest) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    await guest.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const rsvp: RequestHandler<{ slug: string }, unknown, GuestBody> = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { slug: req.params.slug } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.status !== 'published') {
      res.status(409).json({ error: 'RSVPs are not open for this event' });
      return;
    }

    if (event.rsvp_deadline && new Date() > new Date(event.rsvp_deadline)) {
      res.status(409).json({ error: 'The RSVP deadline has passed' });
      return;
    }

    const { name, email, phone, rsvp_status, adult_count, kid_count, message } = req.body;

    if (event.max_guests && rsvp_status === 'attending') {
      const currentAttending = await Guest.sum('adult_count', {
        where: { event_id: event.id, rsvp_status: 'attending' },
      });
      const requested = adult_count || 1;
      if ((currentAttending || 0) + requested > event.max_guests) {
        res.status(409).json({ error: 'Sorry, the event is at capacity' });
        return;
      }
    }

    const edit_token = generateEditToken();

    const guest = await Guest.create({
      event_id: event.id,
      name,
      email: email ?? null,
      phone: phone ?? null,
      rsvp_status: rsvp_status || 'attending',
      adult_count: adult_count || 1,
      kid_count: kid_count || 0,
      message: message ?? null,
      edit_token,
      rsvp_at: new Date(),
      reminded_at: null,
    });

    res.status(201).json({ guest, edit_token });
  } catch (err) {
    next(err);
  }
};

export const getByToken: RequestHandler<{ token: string }> = async (req, res, next) => {
  try {
    const guest = await Guest.findOne({
      where: { edit_token: req.params.token },
      include: [{ association: 'event' }],
    });

    if (!guest) {
      res.status(404).json({ error: 'RSVP not found' });
      return;
    }

    const event = (guest as Guest & { event?: Event }).event;
    res.json({ guest, event });
  } catch (err) {
    next(err);
  }
};

export const editByToken: RequestHandler<{ token: string }, unknown, GuestBody> = async (req, res, next) => {
  try {
    const guest = await Guest.findOne({
      where: { edit_token: req.params.token },
      include: [{ association: 'event' }],
    });

    if (!guest) {
      res.status(404).json({ error: 'RSVP not found' });
      return;
    }
    const event = (guest as Guest & { event?: Event }).event;
    if (event?.status === 'closed') {
      res.status(409).json({ error: 'RSVPs are closed for this event' });
      return;
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

    res.json({ guest });
  } catch (err) {
    next(err);
  }
};
