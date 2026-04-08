import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { locale } = await params;
  const url = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Even if signOut fails, always redirect safely.
  }
  // Use 303 so browsers don't retry POST on the redirected URL.
  return NextResponse.redirect(new URL(`/${locale}`, url.origin), { status: 303 });
}

