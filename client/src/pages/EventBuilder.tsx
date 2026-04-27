import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { eventsApi } from '../api/events';
import type { EventTheme } from '../types';

const THEMES: ReadonlyArray<{ id: EventTheme; label: string; desc: string; emoji: string }> = [
  { id: 'confetti', label: 'Confetti', desc: 'Colorful & playful', emoji: '🎊' },
  { id: 'elegant', label: 'Elegant', desc: 'Soft pastels, clean type', emoji: '🌸' },
  { id: 'neon', label: 'Neon', desc: 'Dark & vibrant', emoji: '✨' },
];

const step1Schema = z.object({
  title: z.string().min(2, 'Title is required').max(255),
  event_date: z.string().min(1, 'Event date is required'),
  event_end_date: z.string().optional(),
  location_name: z.string().max(255).optional(),
  location_address: z.string().max(1000).optional(),
});

const step2Schema = z.object({
  theme: z.enum(['confetti', 'elegant', 'neon']),
  description: z.string().max(5000).optional(),
});

const step3Schema = z.object({
  max_guests: z.coerce.number().int().min(1).optional().or(z.literal('')),
  rsvp_deadline: z.string().optional(),
  is_public: z.boolean(),
});

const STEPS = ['Basics', 'Customize', 'Settings', 'Review'] as const;

interface BuilderData {
  title?: string;
  event_date?: string;
  event_end_date?: string;
  location_name?: string;
  location_address?: string;
  theme: EventTheme;
  description?: string;
  max_guests?: number | '' | string;
  rsvp_deadline?: string;
  is_public: boolean;
}

type StepValues = Partial<BuilderData>;

export default function EventBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BuilderData>({ theme: 'confetti', is_public: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const schemas = [step1Schema, step2Schema, step3Schema, null] as const;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BuilderData>({
    resolver: schemas[step] ? (zodResolver(schemas[step]!) as unknown as Resolver<BuilderData>) : undefined,
    defaultValues: data,
  });

  const theme = watch('theme');

  const onNext: SubmitHandler<BuilderData> = (values) => {
    setData((prev) => ({ ...prev, ...values }));
    setStep((s) => s + 1);
  };

  async function onSubmit(values: StepValues) {
    const final = { ...data, ...values };
    setSubmitting(true);
    setError('');
    try {
      const max =
        typeof final.max_guests === 'number'
          ? final.max_guests
          : final.max_guests
            ? parseInt(String(final.max_guests), 10)
            : null;

      const res = await eventsApi.create({
        title: final.title!,
        description: final.description || '',
        event_date: final.event_date!,
        event_end_date: final.event_end_date || null,
        location_name: final.location_name || '',
        location_address: final.location_address || '',
        theme: final.theme,
        max_guests: max,
        rsvp_deadline: final.rsvp_deadline || null,
        is_public: final.is_public,
      });
      navigate(`/events/${res.data.event.id}/edit`);
    } catch (err) {
      const message =
        isAxiosError<{ error?: string }>(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">New invitation</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i < step ? 'bg-primary-600 border-primary-600 text-white' :
                  i === step ? 'border-primary-600 text-primary-600' :
                  'border-gray-300 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="card">
          {step === 0 && (
            <form onSubmit={handleSubmit(onNext)} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event basics</h2>
                <p className="text-sm text-gray-500 mt-1">Tell people what's happening and when.</p>
              </div>

              <div>
                <label className="label">Event title *</label>
                <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="Jake's 30th Birthday" />
                {errors.title && <p className="error-text">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date & time *</label>
                  <input type="datetime-local" {...register('event_date')} className={`input ${errors.event_date ? 'input-error' : ''}`} />
                  {errors.event_date && <p className="error-text">{errors.event_date.message}</p>}
                </div>
                <div>
                  <label className="label">End time (optional)</label>
                  <input type="datetime-local" {...register('event_end_date')} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Venue name</label>
                <input {...register('location_name')} className="input" placeholder="The Grand Ballroom" />
              </div>

              <div>
                <label className="label">Address</label>
                <input {...register('location_address')} className="input" placeholder="123 Main St, New York, NY" />
              </div>

              <button type="submit" className="btn-primary w-full">Continue →</button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit(onNext)} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customize</h2>
                <p className="text-sm text-gray-500 mt-1">Pick a look and add a description.</p>
              </div>

              <div>
                <label className="label">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setValue('theme', t.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        theme === t.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{t.emoji}</div>
                      <div className="text-xs font-semibold">{t.label}</div>
                      <div className="text-xs text-gray-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('theme')} />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="input"
                  placeholder="Join us for a night of celebration! Dress code: smart casual..."
                />
                {errors.description && <p className="error-text">{errors.description.message}</p>}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
                <button type="submit" className="btn-primary flex-1">Continue →</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onNext)} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Set limits and deadlines for your invite.</p>
              </div>

              <div>
                <label className="label">Guest cap (optional)</label>
                <input
                  type="number"
                  {...register('max_guests')}
                  className="input"
                  placeholder="Leave blank for unlimited"
                  min={1}
                />
                {errors.max_guests && <p className="error-text">{errors.max_guests.message}</p>}
              </div>

              <div>
                <label className="label">RSVP deadline (optional)</label>
                <input type="datetime-local" {...register('rsvp_deadline')} className="input" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Public invite</p>
                  <p className="text-xs text-gray-500">Anyone with the link can view the event page</p>
                </div>
                <input type="checkbox" {...register('is_public')} className="w-5 h-5 text-primary-600 rounded" defaultChecked />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button type="submit" className="btn-primary flex-1">Continue →</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review & save</h2>
                <p className="text-sm text-gray-500 mt-1">Your invitation will be saved as a draft.</p>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <Row label="Title" value={data.title} />
                <Row label="Date" value={data.event_date ? new Date(data.event_date).toLocaleString() : '—'} />
                {data.event_end_date && <Row label="End" value={new Date(data.event_end_date).toLocaleString()} />}
                {data.location_name && <Row label="Venue" value={data.location_name} />}
                {data.location_address && <Row label="Address" value={data.location_address} />}
                <Row label="Theme" value={THEMES.find((t) => t.id === data.theme)?.label || data.theme} />
                {data.description && <Row label="Description" value={data.description} />}
                {data.max_guests && <Row label="Guest cap" value={data.max_guests} />}
                {data.rsvp_deadline && <Row label="RSVP deadline" value={new Date(data.rsvp_deadline).toLocaleString()} />}
                <Row label="Visibility" value={data.is_public ? 'Public' : 'Private'} />
              </div>

              {error && <p className="error-text text-center">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                <button
                  onClick={() => onSubmit({})}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Saving…' : 'Save as draft'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface RowProps {
  label: string;
  value: ReactNode;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-900 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
