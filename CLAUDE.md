# Vishu Medicos - Website

A static marketing site for **Vishu Medicos**, a neighbourhood pharmacy and clinic.
Pure HTML/CSS/JS, no build step, no backend. Open `index.html` in a browser to run.

## Files

| File         | Purpose                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `index.html` | All page markup: header, hero, services, doctors, booking, contact, map, footer. |
| `styles.css` | All styling. Theme lives in `:root` CSS variables (teal medical palette).  |
| `script.js`  | Doctor data, appointment slot generation, booking flow, contact form, nav. |
| `favicon.svg`| Teal rounded-square medical-cross favicon, linked from `index.html` `<head>`.   |

## Sections (in order)

1. **Hero** - headline, CTAs, quick stats.
2. **Trust bar** - four trust badges.
3. **Services** - six service cards.
4. **Doctors** - cards rendered from the `doctors` array in `script.js`. "View Slots" jumps to booking.
5. **Booking** - 3-step flow: pick doctor -> pick date -> pick a 5-minute slot.
6. **Contact** - store info + a demo contact form (no submission backend).
7. **Map** - OpenStreetMap embed + "Open in Google Maps" link.
8. **Footer**.

## Appointment system

- Defined entirely in `script.js`.
- Each doctor has a `hours` window; slots are generated every `SLOT_MINUTES` (currently **5**).
- `booked` is an in-memory map (`"<doctorId>|<date>" -> Set of "HH:MM"`). A few slots are
  pre-seeded for today so some appear taken. Booking a slot marks it taken for the session only;
  it resets on page reload. There is no persistence or server.

## Common edits

- **Change to real content**: images are Unsplash placeholder URLs in `index.html` (hero) and
  `script.js` (`doctors[].photo`). Replace with real image files/URLs.
- **Business details** (address, phone, email, hours): search `index.html` for the placeholder
  `+91 00000 00000`, `hello@vishumedicos.com`, and the address block; update the footer too.
- **Add/remove/edit a doctor**: edit the `doctors` array in `script.js`. `id`, `name`,
  `specialty`, `blurb`, `photo`, and `hours` (`start`/`end` in 24h "HH:MM").
- **Slot length**: change the `SLOT_MINUTES` constant in `script.js`.
- **Map location**: update the `bbox` and `marker` params of the `<iframe src>` in `index.html`,
  and the Google Maps `query` in the link above it.
- **Theme colors**: edit the CSS variables in `:root` at the top of `styles.css`.

## Notes / future work

- The contact form and booking are front-end only. To make them real, wire them to a backend or
  a form service (e.g. Formspree) and replace the in-memory `booked` map with an API.
- No em dashes are used in copy per project style.
