import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { eventsApi } from '../api/events';

const THEMES = [
  { id: 'confetti', label: 'Confetti', emoji: '🎊' },
  { id: 'elegant', label: 'Elegant', emoji: '🌸' },
  { id: 'neon', label: 'Neon', emoji: '✨' },
];

const STATUS_BADGE = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-600',
};

const schema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(5000).optional(),
  event_date: z.string().min(1),
  event_end_date: z.string().optional(),
  location_name: z.string().max(255).optional(),
  location_address: z.string().max(1000).optional(),
  theme: z.enum(['confetti', 'elegant', 'neon']),
  max_guests: z.coerce.number().int().min(1).optional().or(z.literal('')),
  rsvp_deadline: z.string().optional(),
  is_public: z.boolean(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens').optional().or(z.literal('')),
});

function toDatetimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id).then((r) => r.data.event),
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (data) {
      reset({
        title: data.title,
        description: data.description || '',
        event_date: toDatetimeLocal(data.event_date),
        event_end_date: toDatetimeLocal(data.event_end_date),
        location_name: data.location_name || '',
        location_address: data.location_address || '',
        theme: data.theme,
        max_guests: data.max_guests || '',
        rsvp_deadline: toDatetimeLocal(data.rsvp_deadline),
        is_public: data.is_public,
        slug: data.slug,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (vals) => eventsApi.update(id, {
      ...vals,
      max_guests: vals.max_guests ? parseInt(vals.max_guests) : null,
      event_end_date: vals.event_end_date || null,
      rsvp_deadline: vals.rsvp_deadline || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['events', 'mine'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setApiError('');
    },
    onError: (err) => setApiError(err.response?.data?.error || 'Save failed'),
  });

  const transitionMutation = useMutation({
    mutationFn: (action) => eventsApi[action](id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['events', 'mine'] });
    },
  });

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await eventsApi.uploadCover(id, file);
      qc.setQueryData(['event', id], (old) => ({ ...old, cover_image_url: res.data.cover_image_url }));
    } catch (err) {
      setApiError('Cover upload failed');
    } finally {
      setUploadingCover(false);
    }
  }

  const theme = watch('theme');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (!data) return null;

  const shareUrl = `${window.location.origin}/${data.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[data.status]}`}>
              {data.status}
            </span>
            {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Cover image */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cover image</h3>
          {data.cover_image_url ? (
            <div className="relative">
              <img src={data.cover_image_url} alt="" className="w-full h-48 object-cover rounded-xl" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 btn-secondary text-xs py-1.5 px-3"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingCover}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
            >
              <span className="text-2xl mb-1">🖼</span>
              <span className="text-sm">{uploadingCover ? 'Uploading…' : 'Upload cover image'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="card space-y-5">
          <h3 className="text-sm font-semibold text-gray-700">Event details</h3>

          <div>
            <label className="label">Title</label>
            <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date & time</label>
              <input type="datetime-local" {...register('event_date')} className={`input ${errors.event_date ? 'input-error' : ''}`} />
            </div>
            <div>
              <label className="label">End time (optional)</label>
              <input type="datetime-local" {...register('event_end_date')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Venue name</label>
            <input {...register('location_name')} className="input" />
          </div>

          <div>
            <label className="label">Address</label>
            <input {...register('location_address')} className="input" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={4} className="input" />
          </div>

          <div>
            <label className="label">Theme</label>
            <div className="flex gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setValue('theme', t.id, { shouldDirty: true })}
                  className={`flex-1 p-2 rounded-xl border-2 text-center text-sm transition-all ${
                    theme === t.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('theme')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Guest cap</label>
              <input type="number" {...register('max_guests')} className="input" min={1} placeholder="Unlimited" />
            </div>
            <div>
              <label className="label">RSVP deadline</label>
              <input type="datetime-local" {...register('rsvp_deadline')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">{window.location.host}/</span>
              <input {...register('slug')} className={`input ${errors.slug ? 'input-error' : ''}`} />
            </div>
            {errors.slug && <p className="error-text">{errors.slug.message}</p>}
            <p className="text-xs text-yellow-600 mt-1">⚠ Changing the slug breaks existing shared links</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <label className="text-sm font-medium text-gray-700">Public invite</label>
            <input type="checkbox" {...register('is_public')} className="w-5 h-5 text-primary-600 rounded" />
          </div>

          {apiError && <p className="error-text">{apiError}</p>}

          <button type="submit" disabled={saveMutation.isPending || !isDirty} className="btn-primary w-full">
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Actions */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Actions</h3>

          {data.status === 'published' && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-green-800">Share link</p>
                <p className="text-xs text-green-600 truncate max-w-xs">{shareUrl}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Copy
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {data.status === 'draft' && (
              <button
                onClick={() => transitionMutation.mutate('publish')}
                disabled={transitionMutation.isPending}
                className="btn-primary text-sm"
              >
                Publish
              </button>
            )}
            {data.status === 'published' && (
              <button
                onClick={() => transitionMutation.mutate('close')}
                disabled={transitionMutation.isPending}
                className="btn-secondary text-sm"
              >
                Close RSVPs
              </button>
            )}
            {data.status === 'closed' && (
              <button
                onClick={() => transitionMutation.mutate('reopen')}
                disabled={transitionMutation.isPending}
                className="btn-secondary text-sm"
              >
                Re-open RSVPs
              </button>
            )}
            {data.status !== 'archived' && (
              <button
                onClick={() => transitionMutation.mutate('archive')}
                disabled={transitionMutation.isPending}
                className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
              >
                Archive
              </button>
            )}
            <button onClick={() => navigate(`/events/${id}/guests`)} className="btn-secondary text-sm">
              Manage guests →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
