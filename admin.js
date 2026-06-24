import { db, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "./firebase-config.js";
import { stops, statuses, mapsLink } from "./data.js";

const adminList = document.getElementById("admin-list");
const seedButton = document.getElementById("seed-button");
const saveNotice = document.getElementById("save-notice");

const currentStatuses = {};

function showNotice(text) {
  saveNotice.textContent = text;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => saveNotice.textContent = "Tap a status to update it live.", 2200);
}

async function seedStops() {
  seedButton.disabled = true;
  seedButton.textContent = "Initializing...";

  try {
    await Promise.all(stops.map(stop => setDoc(doc(db, "stops", stop.id), {
      ...stop,
      status: currentStatuses[stop.id] || "Pending",
      updatedAt: serverTimestamp(),
      updatedBy: "Admin"
    }, { merge: true })));
    showNotice("Firebase route initialized.");
  } catch (err) {
    console.error(err);
    showNotice("Error initializing Firebase. Check Firestore rules.");
  } finally {
    seedButton.disabled = false;
    seedButton.textContent = "Initialize / Repair Firebase Data";
  }
}

async function setStatus(stop, status) {
  try {
    await updateDoc(doc(db, "stops", stop.id), {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: "Danish"
    });
    showNotice(`${stop.name} marked ${status}.`);
  } catch (err) {
    console.error(err);
    showNotice("Update failed. Try Initialize / Repair Firebase Data first.");
  }
}

function render() {
  adminList.innerHTML = stops.map(stop => {
    const activeStatus = currentStatuses[stop.id] || "Pending";
    return `
      <div class="admin-card">
        <div class="admin-card-top">
          <div class="num">${stop.order}</div>
          <div>
            <div class="name">${stop.name}${stop.note ? `<div class="final">(${stop.note})</div>` : ""}</div>
            <a class="addr" href="${mapsLink(stop.address)}" target="_blank" rel="noopener noreferrer">${stop.address}</a>
          </div>
        </div>
        <div class="admin-buttons">
          ${statuses.map(status => `<button data-stop="${stop.id}" data-status="${status}" class="${status === activeStatus ? "active" : ""}">${status}</button>`).join("")}
        </div>
      </div>
    `;
  }).join("");

  adminList.querySelectorAll("button[data-stop]").forEach(button => {
    const stop = stops.find(item => item.id === button.dataset.stop);
    button.addEventListener("click", () => setStatus(stop, button.dataset.status));
  });
}

seedButton.addEventListener("click", seedStops);
render();

onSnapshot(doc(db, "meta", "admin"), () => {}, () => {});
onSnapshot({
  next: () => {}
});

stops.forEach(stop => {
  onSnapshot(doc(db, "stops", stop.id), snapshot => {
    if (snapshot.exists()) {
      currentStatuses[stop.id] = snapshot.data().status || "Pending";
      render();
    }
  });
});
