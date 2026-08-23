/** Fire-and-forget: prepare carousel logo draft after employer saves original logo. */
export function queueEmployerCarouselLogoProcessing(): void {
  if (typeof window === "undefined") return;
  void fetch("/api/employer/carousel-logo/process", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => {
    /* silent — processing is best-effort */
  });
}
