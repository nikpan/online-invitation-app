import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { eventsApi } from '../api/events';

const THEME_STYLES = {
  confetti: {
    bg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50',
    header: 'bg-gradient-to-r from-primary-500 to-purple-500',
    btn: 'bg-primary-600 hover:bg-primary-700 text-white',
    accent: 'text-primary-600',
  },
  elegant: {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
    header: 'bg-gradient-to-r from-rose-400 to-pink-400',
    btn: 'bg-rose-500 hover:bg-rose-600 text-white',
    accent: 'text-rose-500',
  },
  neon: {
    bg: 'bg-gray-950',
    header: 'bg-gradient-to-r from-cyan-500 to-purple-600',
    btn: 'bg-cyan-500 hover:bg-cyan-400 text-black font-bold',
    accent: 'text-cyan-400',
    text: 'text-gray-100',
    subtext: 'text-gray-400',
    card: 'bg-gray-900 border-gray-800',
  },
};

function getStyles(theme) {
  return THEME_STYLES[theme] || THEME_STYLES.confetti;
}

export default function EventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['event-public', slug],
    queryFn: () => eventsApi.getPublic(slug).then((r) => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900">Event not found</h1>
        <p className="text-gray-500 mt-2">This invitation link may be incorrect or the event was removed.</p>
      </div>
    );
  }

  const { event, attending_count } = data;
  const s = getStyles(event.theme);
  const isClosed = event.status === 'closed';
  const isNeon = event.theme === 'neon';

  const spotsLeft = event.max_guests ? event.max_guests - (attending_count || 0) : null;

  function addToGoogleCalendar() {
    const start = new Date(event.event_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = event.event_end_date
      ? new Date(event.event_end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : start;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || '',
      location: event.location_address || event.location_name || '',
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`);
  }

  return (
    <div className={`min-h-screen ${s.bg} ${isNeon ? s.text : 'text-gray-900'}`}>
      {/* Cover / header */}
      <div className={`w-full ${event.cover_image_url ? '' : s.header}`}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} className="w-full h-64 sm:h-80 object-cover" />
        ) : (
          <div className="h-40 sm:h-56 flex items-center justify-center text-6xl">🎉</div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title & date */}
        <div className={`rounded-2xl shadow-sm border p-6 ${isNeon ? s.card : 'bg-white border-gray-100'}`}>
          <h1 className="text-3xl font-bold">{event.title}</h1>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span>📅</span>
              <div>
                <p className="font-medium">{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</p>
                <p className={isNeon ? s.subtext : 'text-gray-500'}>
                  {format(new Date(event.event_date), 'h:mm a')}
                  {event.event_end_date && ` – ${format(new Date(event.event_end_date), 'h:mm a')}`}
                  {' · '}
                  <span className={s.accent}>{formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}</span>
                </p>
              </div>
            </div>

            {(event.location_name || event.location_address) && (
              <div className="flex items-start gap-2">
                <span>📍</span>
                <div>
                  {event.location_name && <p className="font-medium">{event.location_name}</p>}
                  {event.location_address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${s.accent} hover:underline`}
                    >
                      {event.location_address}
                    </a>
                  )}
                </div>
              </div>
            )}

            {spotsLeft !== null && (
              <div className="flex items-center gap-2">
                <span>👥</span>
                <p className={spotsLeft <= 5 ? 'text-red-500 font-semibold' : ''}>
                  {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Event is at capacity'}
                </p>
              </div>
            )}
          </div>

          {event.description && (
            <p className={`mt-4 text-sm leading-relaxed ${isNeon ? s.subtext : 'text-gray-600'}`}>
              {event.description}
            </p>
          )}

          {/* Add to calendar */}
          <button
            onClick={addToGoogleCalendar}
            className={`mt-4 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              isNeon ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            + Add to Google Calendar
          </button>
        </div>

        {/* RSVP section */}
        <div className={`rounded-2xl shadow-sm border p-6 ${isNeon ? s.card : 'bg-white border-gray-100'}`}>
          {isClosed ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🔒</div>
              <h2 className="text-lg font-semibold">RSVPs are closed</h2>
              <p className={`text-sm mt-1 ${isNeon ? s.subtext : 'text-gray-500'}`}>
                The host has closed registration for this event.
              </p>
            </div>
          ) : spotsLeft === 0 ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">😔</div>
              <h2 className="text-lg font-semibold">Event is full</h2>
              <p className={`text-sm mt-1 ${isNeon ? s.subtext : 'text-gray-500'}`}>
                This event has reached its capacity.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">Are you coming?</h2>
              <p className={`text-sm mb-4 ${isNeon ? s.subtext : 'text-gray-500'}`}>
                Let the host know you're attending.
              </p>
              <button
                onClick={() => navigate(`/${slug}/rsvp`)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${s.btn}`}
              >
                RSVP now →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
