import type { SupabaseClient } from "@supabase/supabase-js";

export type EmployerHomepageCarouselUpdate = {
  employerProfileId: string;
  showOnHomepage?: boolean;
  homepageLogoApproved?: boolean;
  carouselLogoPath?: string | null;
  useLogoPlate?: boolean;
};

/** Admin/service-role only: update homepage carousel approval fields. */
export async function updateEmployerHomepageCarousel(
  supabase: SupabaseClient,
  input: EmployerHomepageCarouselUpdate,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.showOnHomepage !== undefined) patch.show_on_homepage = input.showOnHomepage;
  if (input.homepageLogoApproved !== undefined) patch.homepage_logo_approved = input.homepageLogoApproved;
  if (input.carouselLogoPath !== undefined) {
    patch.carousel_logo_path = input.carouselLogoPath?.trim() || null;
  }
  if (input.useLogoPlate !== undefined) patch.use_logo_plate = input.useLogoPlate;

  if (!Object.keys(patch).length) return;

  const { error } = await supabase.from("employer_profiles").update(patch).eq("id", input.employerProfileId);
  if (error) throw error;
}
