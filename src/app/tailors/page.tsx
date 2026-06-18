import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-lg">
          <h1 className="text-4xl font-bold text-slate-900">Browse Tailors</h1>
          <p className="mt-4 text-lg text-slate-600">
            Explore tailor profiles, portfolios, and booking availability from the map-based discovery flow.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard/map"
              className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Open Tailor Map
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
