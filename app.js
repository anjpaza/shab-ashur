import { db, collection, onSnapshot, query, orderBy } from "./firebase-config.js";
import { stops, mapsLink, routeLink } from "./data.js";

const list = document.getElementById("route-list");
const nowTitle = document.getElementById("now-title");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const routeButton = document.getElementById("route-button");

const statusEmoji = {
  "Pending": "⬜",
  "En Route": "🔵",
  "Started": "🟡",
  "Completed": "🟢",
  "Delayed": "🟠",
  "Skipped": "🔴"
};

function statusClass(status) {
  return String(status || "Pending").replaceAll(" ", "-");
}

function render(routeData) {
  const merged = stops.map(stop => ({
    ...stop,
    status: routeData[stop.id]?.status || "Pending",
    updatedAt: routeData[stop.id]?.updatedAt || null
  }));

  list.innerHTML = merged.map(stop => `
    <div class="stop">
      <div class="num">${stop.order}</div>
      <div class="name">${stop.name}${stop.note ? `<div class="final">(${stop.note})</div>` : ""}</div>
      <a class="addr" href="${mapsLink(stop.address)}" target="_blank" rel="noopener noreferrer">${stop.address}</a>
      <div class="badge ${statusClass(stop.status)}">${statusEmoji[stop.status] || "⬜"} ${stop.status}</div>
    </div>
  `).join("");

  const completed = merged.filter(stop => stop.status === "Completed").length;
  const percent = Math.round((completed / merged.length) * 100);
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${completed} / ${merged.length} stops completed`;

  const current = merged.find(stop => ["En Route", "Started", "Delayed"].includes(stop.status))
    || merged.find(stop => stop.status !== "Completed" && stop.status !== "Skipped")
    || merged[merged.length - 1];

  nowTitle.textContent = `${statusEmoji[current.status] || "⬜"} ${current.name} — ${current.status}`;
}

routeButton.href = routeLink();
render({});

const q = query(collection(db, "stops"), orderBy("order"));
onSnapshot(q, snapshot => {
  const routeData = {};
  snapshot.forEach(doc => {
    routeData[doc.id] = doc.data();
  });
  render(routeData);
}, error => {
  console.error(error);
  nowTitle.textContent = "Unable to load live status";
});
