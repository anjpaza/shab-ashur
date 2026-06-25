import { db, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "./firebase-config.js";
import { stops, statuses, stages, mapsLink } from "./data.js";

const adminList = document.getElementById("admin-list");
const seedButton = document.getElementById("seed-button");
const saveNotice = document.getElementById("save-notice");

const currentData = {};

function showNotice(text) {
  saveNotice.textContent = text;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => saveNotice.textContent = "Tap a status or stage to update it live.", 2200);
}

async function seedStops() {
  seedButton.disabled = true;
  seedButton.textContent = "Initializing...";

  try {
    await Promise.all(stops.map(stop => setDoc(doc(db, "stops", stop.id), {
      ...stop,
      status: currentData[stop.id]?.status || "Pending",
      stage: currentData[stop.id]?.stage || "",
      updatedAt: serverTimestamp(),
      updatedBy: "Admin"
    }, { merge: true })));
    showNotice("Firebase route initialized.");
  } catch (err) {
    console.error(err);
    showNotice("Error initializing Firebase. Check Firestore rules.");
  } finally {
    seedButton.disabled = false;
    seedButton.textContent = "Initialize Firebase Data";
  }
}

async function setStatus(stop, status) {
  try {
    const payload = {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: "Danish"
    };

    if (status !== "Started") {
      payload.stage = "";
    } else if (!currentData[stop.id]?.stage) {
      payload.stage = "Hadis e Kisa";
    }

    await updateDoc(doc(db, "stops", stop.id), payload);
    showNotice(`${stop.name} marked ${status}.`);
  } catch (err) {
    console.error(err);
    showNotice("Update failed. Tap Initialize Firebase Data first.");
  }
}

async function setStage(stop, stage) {
  try {
    await updateDoc(doc(db, "stops", stop.id), {
      status: "Started",
      stage,
      updatedAt: serverTimestamp(),
      updatedBy: "Danish"
    });
    showNotice(`${stop.name} stage updated to ${stage}.`);
  } catch (err) {
    console.error(err);
    showNotice("Stage update failed. Tap Initialize Firebase Data first.");
  }
}

function render() {
  adminList.innerHTML = stops.map(stop => {
    const activeStatus = currentData[stop.id]?.status || "Pending";
    const activeStage = currentData[stop.id]?.stage || "";
    const showStages = activeStatus === "Started";

    return `
      <div class="admin-card">
        <div class="admin-card-top">
          <div class="num">${stop.order}</div>
          <div>
            <div class="name">${stop.name}${stop.note ? `<div class="final">(${stop.note})</div>` : ""}</div>
            <a class="addr" href="${mapsLink(stop.address)}" target="_blank" rel="noopener noreferrer">${stop.address}</a>
          </div>
        </div>
        <div class="admin-section-label">Status</div>
        <div class="admin-buttons">
          ${statuses.map(status => `<button data-stop="${stop.id}" data-status="${status}" class="${status === activeStatus ? "active" : ""}">${status}</button>`).join("")}
        </div>
        <div class="stage-panel ${showStages ? "" : "hidden"}">
          <div class="admin-section-label">Majlis Stage</div>
          <div class="admin-buttons stage-buttons">
            ${stages.map(stage => `<button data-stop="${stop.id}" data-stage="${stage}" class="${stage === activeStage ? "active" : ""}">${stage}</button>`).join("")}
          </div>
        </div>
      </div>
    `;
  }).join("");

  adminList.querySelectorAll("button[data-status]").forEach(button => {
    const stop = stops.find(item => item.id === button.dataset.stop);
    button.addEventListener("click", () => setStatus(stop, button.dataset.status));
  });

  adminList.querySelectorAll("button[data-stage]").forEach(button => {
    const stop = stops.find(item => item.id === button.dataset.stop);
    button.addEventListener("click", () => setStage(stop, button.dataset.stage));
  });
}

seedButton.addEventListener("click", seedStops);
render();

stops.forEach(stop => {
  onSnapshot(doc(db, "stops", stop.id), snapshot => {
    if (snapshot.exists()) {
      currentData[stop.id] = snapshot.data();
      render();
    }
  }, error => {
    console.error(error);
    showNotice("Unable to connect to Firebase.");
  });
});
