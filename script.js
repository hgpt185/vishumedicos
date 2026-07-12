// ---------------------------------------------------------------------------
// Vishu Medicos - front-end interactions
// Doctor data, appointment slot generation, and booking flow.
// All state is in-memory (no backend) - safe to swap for a real API later.
// ---------------------------------------------------------------------------

const doctors = [
  {
    id: "arora",
    name: "Dr. Rhea Arora",
    specialty: "General Physician",
    blurb: "12+ years treating fever, infections, and everyday illnesses.",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=500&q=80",
    // Working window for this doctor (24h). Slots are 5 minutes each.
    hours: { start: "10:00", end: "13:00" },
  },
  {
    id: "kapoor",
    name: "Dr. Aman Kapoor",
    specialty: "Pediatrician",
    blurb: "Gentle, child-friendly care for newborns to teenagers.",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80",
    hours: { start: "16:00", end: "19:00" },
  },
  {
    id: "nair",
    name: "Dr. Meera Nair",
    specialty: "Dermatologist",
    blurb: "Skin, hair, and cosmetic concerns handled with expert care.",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80",
    hours: { start: "11:00", end: "14:00" },
  },
];

const SLOT_MINUTES = 5;

// Booked slots keyed by `${doctorId}|${date}` -> Set of "HH:MM" strings.
// Pre-seed a few so the UI shows some slots as already taken.
const booked = {};
function seedBooked(doctorId, date, times) {
  booked[`${doctorId}|${date}`] = new Set(times);
}

// State
let selectedDoctorId = null;
let selectedDate = null;
let selectedSlot = null;

// ---- Helpers -------------------------------------------------------------

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatTime12(hhmm) {
  let [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function generateSlots(doctor) {
  const slots = [];
  const start = toMinutes(doctor.hours.start);
  const end = toMinutes(doctor.hours.end);
  for (let t = start; t < end; t += SLOT_MINUTES) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

// ---- Rendering: doctors section -----------------------------------------

function renderDoctorCards() {
  const grid = document.getElementById("doctorGrid");
  grid.innerHTML = doctors
    .map(
      (d) => `
      <article class="doctor-card">
        <img class="doctor-photo" src="${d.photo}" alt="${d.name}" />
        <div class="doctor-body">
          <h3>${d.name}</h3>
          <div class="doctor-spec">${d.specialty}</div>
          <p>${d.blurb}</p>
          <button class="btn btn-primary btn-sm" data-doctor="${d.id}">View Slots</button>
        </div>
      </article>`
    )
    .join("");

  grid.querySelectorAll("[data-doctor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectDoctor(btn.dataset.doctor);
      document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ---- Rendering: booking picker ------------------------------------------

function renderDoctorPicker() {
  const picker = document.getElementById("doctorPicker");
  picker.innerHTML = doctors
    .map(
      (d) => `
      <button class="doctor-chip" data-doctor="${d.id}">
        <img src="${d.photo}" alt="${d.name}" />
        <span>
          <span class="chip-name">${d.name}</span><br />
          <span class="chip-spec">${d.specialty}</span>
        </span>
      </button>`
    )
    .join("");

  picker.querySelectorAll("[data-doctor]").forEach((btn) => {
    btn.addEventListener("click", () => selectDoctor(btn.dataset.doctor));
  });
}

function selectDoctor(id) {
  selectedDoctorId = id;
  selectedSlot = null;
  document.querySelectorAll("#doctorPicker .doctor-chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.doctor === id);
  });
  renderSlots();
}

// ---- Rendering: slots ----------------------------------------------------

function renderSlots() {
  const container = document.getElementById("slots");
  const hint = document.getElementById("slotHint");
  container.innerHTML = "";

  if (!selectedDoctorId || !selectedDate) {
    hint.style.display = "block";
    hint.textContent = "Select a doctor and date to see 5-minute slots.";
    return;
  }

  const doctor = doctors.find((d) => d.id === selectedDoctorId);
  const slots = generateSlots(doctor);
  const takenKey = `${selectedDoctorId}|${selectedDate}`;
  const taken = booked[takenKey] || new Set();

  hint.style.display = "block";
  hint.textContent = `Showing ${doctor.name} (${doctor.specialty}) - ${formatTime12(
    doctor.hours.start
  )} to ${formatTime12(doctor.hours.end)}, ${SLOT_MINUTES}-min slots.`;

  slots.forEach((time) => {
    const btn = document.createElement("button");
    btn.className = "slot";
    btn.textContent = formatTime12(time);
    if (taken.has(time)) {
      btn.disabled = true;
      btn.title = "Already booked";
    } else {
      btn.addEventListener("click", () => confirmSlot(doctor, time, btn));
    }
    container.appendChild(btn);
  });

  const note = document.createElement("div");
  note.className = "booking-confirm";
  note.id = "bookingConfirm";
  container.parentElement.appendChild(note);
}

function confirmSlot(doctor, time, btn) {
  document.querySelectorAll(".slot.selected").forEach((s) => s.classList.remove("selected"));
  btn.classList.add("selected");
  selectedSlot = time;

  // Mark as booked in-memory so it can't be double-booked this session.
  const key = `${doctor.id}|${selectedDate}`;
  if (!booked[key]) booked[key] = new Set();
  booked[key].add(time);

  const confirm = document.getElementById("bookingConfirm");
  const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  confirm.classList.add("show");
  confirm.innerHTML = `✅ <strong>Appointment held!</strong> ${doctor.name} on ${dateLabel} at ${formatTime12(
    time
  )}. Please call <a href="tel:+919829433388">+91 98294 33388</a> to confirm.`;

  // Disable the just-booked slot after a moment so the confirmation reads clearly.
  setTimeout(() => {
    btn.disabled = true;
    btn.classList.remove("selected");
  }, 1200);
}

// ---- Date picker ---------------------------------------------------------

function initDatePicker() {
  const input = document.getElementById("datePicker");
  const min = todayISO();
  input.min = min;
  input.value = min;
  selectedDate = min;

  // Seed a couple of booked slots for today's demo view.
  seedBooked("arora", min, ["10:15", "10:20", "11:00"]);
  seedBooked("kapoor", min, ["16:30", "17:45"]);
  seedBooked("nair", min, ["11:10", "13:00"]);

  input.addEventListener("change", () => {
    selectedDate = input.value;
    selectedSlot = null;
    renderSlots();
  });
}

// ---- Contact form (demo) -------------------------------------------------

function initContactForm() {
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    note.textContent = `Thanks ${name || "there"}! We've received your message and will get back shortly.`;
    form.reset();
  });
}

// ---- Hero carousel -------------------------------------------------------

function initCarousel() {
  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  const carousel = document.getElementById("carousel");
  if (!track) return;

  const slides = track.children.length;
  let index = 0;
  let timer = null;

  // Build a dot per slide.
  for (let i = 0; i < slides; i++) {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to image ${i + 1}`);
    dot.addEventListener("click", () => goTo(i, true));
    dotsWrap.appendChild(dot);
  }

  function goTo(i, restart) {
    index = (i + slides) % slides;
    track.style.transform = `translateX(-${index * 100}%)`;
    dotsWrap.querySelectorAll(".carousel-dot").forEach((d, di) =>
      d.classList.toggle("active", di === index)
    );
    if (restart) start();
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(() => goTo(index + 1), 3500);
  }

  // Pause auto-scroll while hovering.
  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", start);

  start();
}

// ---- Nav toggle & misc ---------------------------------------------------

function initNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

// ---- Boot ----------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  initCarousel();
  renderDoctorCards();
  renderDoctorPicker();
  initDatePicker();
  initContactForm();
  initNav();
  renderSlots();
});
