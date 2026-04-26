import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { eventsApi } from '../api/events';
import { guestsApi } from '../api/guests';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  rsvp_status: z.enum(['attending', 'declined', 'maybe'], { required_error: 'Please select a response' }),
  adult_count: z.coerce.number().int().min(1).max(20),
  kid_count: z.coerce.number().int().min(0).max(20),
  message: z.string().max(1000).optional().or(z.literal('')),
});

export default function RsvpForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  const { data: eventData, isLoading, isError } = useQuery({
    queryKey: ['event-public', slug],
    queryFn: () => eventsApi.getPublic(slug).then((r) => r.data),
    retry: false,
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { adult_count: 1, kid_count: 0, rsvp_status: 'attending' },
  });

  const rsvpStatus = watch('rsvp_status');

  const submitMutation = useMutation({
    mutationFn: (data) => guestsApi.rsvp(slug, data),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setApiError(err.response?.data?.error || 'Something went wrong'),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  if (isError || !eventData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900">Event not found</h1>
      </div>
    );
  }

  const { event } = eventData;

  if (event.status !== 'published') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900">RSVPs are closed</h1>
        <p className="text-gray-500 mt-2">The host has closed registration for this event.</p>
        <button onClick={() => navigate(`/${slug}`)} className="btn-primary mt-6">View event</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🎊</div>
        <h1 className="text-2xl font-bold text-gray-900">You're on the list!</h1>
        <p className="text-gray-500 mt-2 max-w-sm">
          {rsvpStatus === 'attending'
            ? `We can't wait to see you at ${event.title}!`
            : rsvpStatus === 'maybe'
            ? "Thanks for letting us know. Hope to see you there!"
            : "Thanks for letting us know you can't make it."}
        </p>
        <button onClick={() => navigate(`/${slug}`)} className="btn-primary mt-6">View event page</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(`/${slug}`)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          <h1 className="text-sm font-semibold text-gray-700 truncate">{event.title}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">RSVP</h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(event.event_date), 'EEE, MMM d, yyyy · h:mm a')}
              {event.location_name && ` · ${event.location_name}`}
            </p>
          </div>

          <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
            {/* Response */}
            <div>
              <label className="label">Your response *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'attending', label: 'Yes', color: 'border-green-500 bg-green-50 text-green-700' },
                  { value: 'maybe', label: 'Maybe', color: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
                  { value: 'declined', label: 'No', color: 'border-red-400 bg-red-50 text-red-600' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                      rsvpStatus === opt.value ? opt.color : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <input type="radio" {...register('rsvp_status')} value={opt.value} className="hidden" />
                    {opt.label}
                  </label>
                ))}
              </div>
              {errors.rsvp_status && <p className="error-text">{errors.rsvp_status.message}</p>}
            </div>

            <div>
              <label className="label">Your name *</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Jane Smith" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email (optional)</label>
              <input type="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} placeholder="jane@example.com" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
              <p className="text-xs text-gray-400 mt-1">We'll send you a confirmation with an edit link.</p>
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <input {...register('phone')} className="input" placeholder="+1 555 000 0000" />
            </div>

            {rsvpStatus === 'attending' && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label">Adults (including you)</label>
                  <input type="number" {...register('adult_count')} className="input" min={1} max={20} />
                  {errors.adult_count && <p className="error-text">{errors.adult_count.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="label">Kids</label>
                  <input type="number" {...register('kid_count')} className="input" min={0} max={20} />
                </div>
              </div>
            )}

            <div>
              <label className="label">Message to host (optional)</label>
              <textarea {...register('message')} rows={3} className="input" placeholder="Looking forward to it!" />
            </div>

            {apiError && <p className="error-text">{apiError}</p>}

            <button type="submit" disabled={submitMutation.isPending} className="btn-primary w-full">
              {submitMutation.isPending ? 'Submitting…' : 'Submit RSVP'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
