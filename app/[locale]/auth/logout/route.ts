import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { locale } = await params;
  const url = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL(`/${locale}`, url.origin));
}

