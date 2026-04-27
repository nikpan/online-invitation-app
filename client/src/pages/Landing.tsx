import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">🎉 Invitely</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm py-2 px-4">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 text-center pt-20 pb-24">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
          Beautiful invitations,
          <br />
          <span className="text-primary-600">zero effort</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
          Create gorgeous, shareable event invitations in minutes. Guests RSVP via link — no app download, no account needed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base py-3 px-6">
            Create your first invite — it&apos;s free
          </Link>
          <Link to="/login" className="btn-secondary text-base py-3 px-6">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: '🔗',
                title: 'Shareable link',
                desc: 'Each invite gets its own URL. Share it anywhere — text, email, WhatsApp.',
              },
              {
                icon: '📋',
                title: 'RSVP management',
                desc: "See who's coming in real time. Export your guest list as CSV.",
              },
              {
                icon: '🎨',
                title: 'Beautiful themes',
                desc: 'Choose from Confetti, Elegant, or Neon — all mobile-friendly.',
              },
            ].map((f) => (
              <div key={f.title} className="card text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-sm text-gray-400">
        © {new Date().getFullYear()} Invitely
      </footer>
    </div>
  );
}
