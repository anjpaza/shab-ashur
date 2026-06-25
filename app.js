import { db, collection, onSnapshot, query, orderBy } from "./firebase-config.js";
import { stops, mapsLink, routeLink } from "./data.js";

const list = document.getElementById("route-list");
const nowTitle = document.getElementById("now-title");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const routeButton = document.getElementById("route-button");
const mapCard = document.getElementById("map-card");
const routeMap = document.getElementById("route-map");
const mapRouteTitle = document.getElementById("map-route-title");
const mapOpenLink = document.getElementById("map-open-link");

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

function directionsEmbedLink(origin, destination) {
  const saddr = encodeURIComponent(origin.address);
  const daddr = encodeURIComponent(destination.address);
  return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;
}

function directionsOpenLink(origin, destination) {
  const saddr = encodeURIComponent(origin.address);
  const daddr = encodeURIComponent(destination.address);
  return `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${daddr}&travelmode=driving`;
}

function getCurrentAndNext(merged) {
  const lastCompletedIndex = merged.map(stop => stop.status).lastIndexOf("Completed");
  const active = merged.find(stop => ["En Route", "Started", "Delayed"].includes(stop.status));
  const current = active || merged[lastCompletedIndex] || merged.find(stop => stop.status !== "Completed" && stop.status !== "Skipped") || merged[merged.length - 1];

  const currentIndex = merged.findIndex(stop => stop.id === current.id);
  const next = merged.slice(currentIndex + 1).find(stop => stop.status !== "Completed" && stop.status !== "Skipped")
    || merged[currentIndex + 1]
    || null;

  return { current, next };
}

function updateMap(current, next, shouldShowMap) {
  if (!shouldShowMap) {
    mapCard.classList.add("hidden");
    routeMap.removeAttribute("src");
    return;
  }

  mapCard.classList.remove("hidden");

  if (!next) {
    mapRouteTitle.textContent = `${current.name} is the final stop`;
    routeMap.src = mapsLink(current.address) + "&output=embed";
    mapOpenLink.href = mapsLink(current.address);
    return;
  }

  mapRouteTitle.textContent = `${current.name} → ${next.name}`;
  routeMap.src = directionsEmbedLink(current, next);
  mapOpenLink.href = directionsOpenLink(current, next);
}

function stageLine(stop) {
  if (stop.status === "Started" && stop.stage) {
    return `<div class="stage-badge">Current Stage: ${stop.stage}</div>`;
  }
  return "";
}

function render(routeData) {
  const merged = stops.map(stop => ({
    ...stop,
    status: routeData[stop.id]?.status || "Pending",
    stage: routeData[stop.id]?.stage || "",
    updatedAt: routeData[stop.id]?.updatedAt || null
  }));

  list.innerHTML = merged.map(stop => `
    <div class="stop">
      <div class="num">${stop.order}</div>
      <div class="name">${stop.name}${stop.note ? `<div class="final">(${stop.note})</div>` : ""}</div>
      <a class="addr" href="${mapsLink(stop.address)}" target="_blank" rel="noopener noreferrer">${stop.address}</a>
      <div class="badge ${statusClass(stop.status)}">${statusEmoji[stop.status] || "⬜"} ${stop.status}</div>
      ${stageLine(stop)}
    </div>
  `).join("");

  const completed = merged.filter(stop => stop.status === "Completed").length;
  const percent = Math.round((completed / merged.length) * 100);
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${completed} / ${merged.length} stops completed`;

  const { current, next } = getCurrentAndNext(merged);
  const currentStage = current.status === "Started" && current.stage ? ` — ${current.stage}` : "";
  nowTitle.textContent = `${statusEmoji[current.status] || "⬜"} ${current.name} — ${current.status}${currentStage}`;
  updateMap(current, next, completed > 0);
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
  mapRouteTitle.textContent = "Unable to load map route";
});
