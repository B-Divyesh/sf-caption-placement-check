const heading = document.querySelector<HTMLHeadingElement>("main h1");

function focusRouteHeading() {
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  const announcer = document.querySelector<HTMLElement>("#route-announcer");
  if (announcer) announcer.textContent = `${document.title}. ${heading.textContent || ""}`;
}

if (!document.querySelector("#route-announcer")) {
  const announcer = document.createElement("div");
  announcer.id = "route-announcer";
  announcer.className = "visually-hidden";
  announcer.setAttribute("aria-live", "polite");
  document.body.append(announcer);
}

requestAnimationFrame(focusRouteHeading);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) requestAnimationFrame(focusRouteHeading);
});
