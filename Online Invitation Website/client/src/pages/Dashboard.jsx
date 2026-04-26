import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { eventsApi } from '../api/events';

const STATUS_BADGE = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-600',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [actionMenu, setActionMenu] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'mine'],
    queryFn: () => eventsApi.listMine().then((r) => r.data.events),
  });

  const events = data || [];

  const archiveMutation = useMutation({
    mutationFn: (id) => eventsApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', 'mine'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => eventsApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', 'mine'] }),
  });

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🎉 Invitely</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.display_name}</span>
            <button onClick={handleLogout} className="btn-secondary text-xs py-1.5 px-3">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your invitations</h2>
            <p className="text-gray-500 mt-1">Create and manage your event invitations</p>
          </div>
          <button onClick={() => navigate('/events/new')} className="btn-primary">
            + New invitation
          </button>
        </div>

        {isLoading && (
          <div className="card text-center py-16 text-gray-400">Loading…</div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🎊</div>
            <h3 className="text-lg font-semibold text-gray-900">No invitations yet</h3>
            <p className="text-gray-500 mt-2 mb-6">
              Create your first invitation and share it with your guests.
            </p>
            <button onClick={() => navigate('/events/new')} className="btn-primary">
              Create your first invitation
            </button>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => navigate(`/events/${event.id}/edit`)}
                onGuests={() => navigate(`/events/${event.id}/guests`)}
                onCopy={() => copyLink(event.slug)}
                onPublish={() => publishMutation.mutate(event.id)}
                onArchive={() => archiveMutation.mutate(event.id)}
                menuOpen={actionMenu === event.id}
                onMenuToggle={() => setActionMenu(actionMenu === event.id ? null : event.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ event, onEdit, onGuests, onCopy, onPublish, onArchive, menuOpen, onMenuToggle }) {
  const { guest_counts: gc } = event;
  const isPast = new Date(event.event_date) < new Date();

  return (
    <div className="card flex flex-col sm:flex-row sm:items-center gap-4">
      {event.cover_image_url && (
        <img
          src={event.cover_image_url}
          alt={event.title}
          className="w-full sm:w-24 h-24 object-cover rounded-xl flex-shrink-0"
        />
      )}
      {!event.cover_image_url && (
        <div className="w-24 h-24 bg-primary-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          🎉
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[event.status]}`}>
            {event.status}
          </span>
          {isPast && event.status === 'published' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Past</span>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-0.5">
          {event.event_date ? format(new Date(event.event_date), 'EEE, MMM d, yyyy · h:mm a') : '—'}
        </p>

        {event.location_name && (
          <p className="text-sm text-gray-400 mt-0.5 truncate">📍 {event.location_name}</p>
        )}

        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span>👥 {gc.total} total</span>
          <span className="text-green-600">✓ {gc.attending} attending</span>
          {gc.maybe > 0 && <span className="text-yellow-600">? {gc.maybe} maybe</span>}
          {gc.pending > 0 && <span>{gc.pending} pending</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onEdit} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
        <button onClick={onGuests} className="btn-secondary text-xs py-1.5 px-3">Guests</button>

        <div className="relative">
          <button onClick={onMenuToggle} className="btn-secondary text-xs py-1.5 px-2">⋯</button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
              {event.status === 'draft' && (
                <MenuItem onClick={onPublish}>Publish</MenuItem>
              )}
              {event.status === 'published' && (
                <MenuItem onClick={onCopy}>Copy link</MenuItem>
              )}
              {event.status !== 'archived' && (
                <MenuItem onClick={onArchive} danger>Archive</MenuItem>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${danger ? 'text-red-600' : 'text-gray-700'}`}
    >
      {children}
    </button>
  );
}
