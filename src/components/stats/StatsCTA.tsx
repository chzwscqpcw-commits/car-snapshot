import Link from "next/link";

export default function StatsCTA() {
  return (
    <div className="my-10 rounded-xl border border-emerald-800/40 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 p-6 sm:p-8 text-center">
      <h3 className="text-xl font-bold text-gray-100">
        Check Your Own Vehicle
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
        Enter any UK reg plate for a free instant check — MOT history, tax
        status, mileage, valuations and more.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
      >
        Look up a vehicle free
      </Link>
    </div>
  );
}
