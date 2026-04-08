import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-1px)] items-center justify-center bg-black px-6 py-20 text-white">
      <div className="w-full max-w-lg rounded-3xl bg-white/5 p-8 ring-1 ring-inset ring-white/10">
        <div className="text-[13px] font-semibold tracking-wide text-white/60">
          Kvalifits
        </div>
        <h1 className="mt-2 text-balance text-[28px] font-semibold leading-[1.15] tracking-[-0.03em]">
          Eesti landing on `/et`.
        </h1>
        <p className="mt-3 text-[15px] leading-[1.65] text-white/72">
          Ava launch-ready premium UI.
        </p>
        <div className="mt-6">
          <Link
            href="/et"
            className="inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-3 text-[15px] font-semibold tracking-tight text-white ring-1 ring-inset ring-white/10 transition hover:bg-violet-400 focus-visible:outline-none"
          >
            Mine /et lehele
          </Link>
        </div>
      </div>
    </div>
  );
}
