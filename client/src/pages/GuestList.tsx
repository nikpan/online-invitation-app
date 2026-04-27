import { useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { eventsApi } from '../api/events';
import { guestsApi, type AddGuestInput } from '../api/guests';
import type { RsvpStatus } from '../types';

const STATUS_COLORS: Record<RsvpStatus, string> = {
  attending: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
  maybe: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-100 text-gray-500',
};

interface AddForm {
  name: string;
  email: string;
  rsvp_status: RsvpStatus;
  adult_count: number;
  kid_count: number;
}

const INITIAL_ADD_FORM: AddForm = {
  name: '',
  email: '',
  rsvp_status: 'attending',
  adult_count: 1,
  kid_count: 0,
};

export default function GuestList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<RsvpStatus | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(INITIAL_ADD_FORM);
  const [addError, setAddError] = useState('');

  const { data: eventData } = useQuery({
    queryKey: ['event', id] as const,
    queryFn: () => eventsApi.get(id!).then((r) => r.data.event),
    enabled: !!id,
  });

  const { data: guestData, isLoading } = useQuery({
    queryKey: ['guests', id, filter] as const,
    queryFn: () => guestsApi.list(id!, { status: filter || undefined, limit: 200 }).then((r) => r.data),
    enabled: !!id,
  });

  const removeMutation = useMutation({
    mutationFn: (guestId: string) => guestsApi.remove(id!, guestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guests', id] }),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddGuestInput) => guestsApi.add(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests', id] });
      setShowAddForm(false);
      setAddForm(INITIAL_ADD_FORM);
      setAddError('');
    },
    onError: (err) => {
      const message =
        isAxiosError<{ error?: string }>(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Failed to add guest';
      setAddError(message);
    },
  });

  const guests = guestData?.guests || [];
  const event = eventData;

  function downloadCsv() {
    const rows: Array<Array<string | number>> = [
      ['Name', 'Email', 'Phone', 'Status', 'Adults', 'Kids', 'Total', 'Message'],
      ...guests.map((g) => [
        g.name, g.email || '', g.phone || '', g.rsvp_status,
        g.adult_count, g.kid_count, g.adult_count + g.kid_count, g.message || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title || 'guests'}-guests.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalAttending = guests
    .filter((g) => g.rsvp_status === 'attending')
    .reduce((sum, g) => sum + g.adult_count + g.kid_count, 0);

  const filterOptions: Array<RsvpStatus | ''> = ['', 'attending', 'declined', 'maybe', 'pending'];

  function updateAdd<K extends keyof AddForm>(key: K, value: AddForm[K]) {
    setAddForm((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(`/events/${id}/edit`)} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to event
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">{event?.title || 'Guest list'}</h1>
          <div className="w-24 text-right">
            <button onClick={downloadCsv} className="btn-secondary text-xs py-1.5 px-3">Export CSV</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total RSVPs', value: guestData?.total || 0 },
            { label: 'Attending', value: guests.filter((g) => g.rsvp_status === 'attending').length, color: 'text-green-600' },
            { label: 'Total headcount', value: totalAttending, color: 'text-primary-600' },
            { label: 'Declined', value: guests.filter((g) => g.rsvp_status === 'declined').length, color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="card py-4">
              <p className={`text-2xl font-bold ${s.color || 'text-gray-900'}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filter === s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary text-sm">
            + Add guest
          </button>
        </div>

        {showAddForm && (
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold">Add guest manually</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={addForm.name}
                  onChange={(e) => updateAdd('name', e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={addForm.email}
                  onChange={(e) => updateAdd('email', e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="label">RSVP status</label>
                <select
                  className="input"
                  value={addForm.rsvp_status}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    updateAdd('rsvp_status', e.target.value as RsvpStatus)
                  }
                >
                  <option value="attending">Attending</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="label">Adults</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={addForm.adult_count}
                    onChange={(e) => updateAdd('adult_count', parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Kids</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={addForm.kid_count}
                    onChange={(e) => updateAdd('kid_count', parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>
            {addError && <p className="error-text">{addError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => addMutation.mutate(addForm)}
                disabled={!addForm.name || addMutation.isPending}
                className="btn-primary"
              >
                {addMutation.isPending ? 'Adding…' : 'Add guest'}
              </button>
            </div>
          </div>
        )}

        {isLoading && <div className="card text-center py-10 text-gray-400">Loading…</div>}

        {!isLoading && guests.length === 0 && (
          <div className="card text-center py-10 text-gray-500">No guests yet.</div>
        )}

        {guests.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">👥</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {g.name}
                      {g.message && (
                        <p className="text-xs text-gray-400 font-normal truncate max-w-[160px]" title={g.message}>
                          "{g.message}"
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      <div>{g.email || '—'}</div>
                      {g.phone && <div className="text-xs">{g.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[g.rsvp_status]}`}>
                        {g.rsvp_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {g.adult_count}
                      {g.kid_count > 0 && <span className="text-xs text-gray-400"> +{g.kid_count}k</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { if (confirm('Remove this guest?')) removeMutation.mutate(g.id); }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
