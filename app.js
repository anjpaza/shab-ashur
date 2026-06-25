import { db, collection, doc, setDoc, onSnapshot, query, orderBy, increment, serverTimestamp } from "./firebase-config.js";
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

function trackVisit() {
  const uniqueKey = "apa-shabashur-visitor-counted";
  const isNewVisitor = localStorage.getItem(uniqueKey) !== "true";

  setDoc(doc(db, "stats", "visitors"), {
    pageViews: increment(1),
    uniqueVisitors: increment(isNewVisitor ? 1 : 0),
    lastVisitAt: serverTimestamp()
  }, { merge: true }).then(() => {
    if (isNewVisitor) localStorage.setItem(uniqueKey, "true");
  }).catch(error => console.error("Visitor tracking failed", error));
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

function getDisplayCurrent(merged) {
  return merged.find(stop => ["En Route", "Started", "Delayed"].includes(stop.status))
    || merged.find(stop => stop.status !== "Completed" && stop.status !== "Skipped")
    || merged[merged.length - 1];
}

function getMapRoute(merged) {
  const enRouteStop = merged.find(stop => stop.status === "En Route");

  if (enRouteStop) {
    const enRouteIndex = merged.findIndex(stop => stop.id === enRouteStop.id);
    const previous = merged[enRouteIndex - 1] || null;
    return { origin: previous, destination: enRouteStop };
  }

  const lastCompletedIndex = merged.map(stop => stop.status).lastIndexOf("Completed");

  if (lastCompletedIndex >= 0) {
    const origin = merged[lastCompletedIndex];
    const destination = merged.slice(lastCompletedIndex + 1).find(stop => stop.status !== "Completed" && stop.status !== "Skipped")
      || merged[lastCompletedIndex + 1]
      || null;
    return { origin, destination };
  }

  return { origin: null, destination: null };
}

function updateMap(origin, destination, shouldShowMap) {
  if (!shouldShowMap || !origin) {
    mapCard.classList.add("hidden");
    routeMap.removeAttribute("src");
    return;
  }

  mapCard.classList.remove("hidden");

  if (!destination) {
    mapRouteTitle.textContent = `${origin.name} is the final stop`;
    routeMap.src = mapsLink(origin.address) + "&output=embed";
    mapOpenLink.href = mapsLink(origin.address);
    return;
  }

  mapRouteTitle.textContent = `${origin.name} → ${destination.name}`;
  routeMap.src = directionsEmbedLink(origin, destination);
  mapOpenLink.href = directionsOpenLink(origin, destination);
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

  const current = getDisplayCurrent(merged);
  const currentStage = current.status === "Started" && current.stage ? ` — ${current.stage}` : "";
  nowTitle.textContent = `${statusEmoji[current.status] || "⬜"} ${current.name} — ${current.status}${currentStage}`;

  const { origin, destination } = getMapRoute(merged);
  updateMap(origin, destination, completed > 0 || Boolean(origin));
}

trackVisit();
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
