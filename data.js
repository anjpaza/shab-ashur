export const stops = [
  { id: "stop-01", order: 1, name: "Faiz Jaffery", address: "8011 Garland Path Bend Ln, Richmond, TX 77407" },
  { id: "stop-02", order: 2, name: "Al Ghadeer", address: "9260 S Course Dr, Houston, TX 77099" },
  { id: "stop-03", order: 3, name: "Syed Jafar Raza Rizvi", address: "111 Water Bluff Ln, Richmond, TX 77406" },
  { id: "stop-04", order: 4, name: "Saulat Raza", address: "20202 Pebble Hollow, Richmond, TX 77407" },
  { id: "stop-05", order: 5, name: "Guddu Zaidi", address: "8411 Victoria Springs Dr, Richmond, TX 77407" },
  { id: "stop-06", order: 6, name: "Aijaz Rizvi", address: "21319 Grand Hollow Ln, Katy, TX 77450" },
  { id: "stop-07", order: 7, name: "Abbas Naqvi", address: "14303 Tasmania Ct, Sugar Land, TX 77498" },
  { id: "stop-08", order: 8, name: "Riaz Naqvi", address: "10515 Pilkington Dr, Richmond, TX 77406" },
  { id: "stop-09", order: 9, name: "Mehdi Jaffari", address: "18223 Trace Pointe Ln, Richmond, TX 77407" },
  { id: "stop-10", order: 10, name: "Hammad Raza", address: "12206 Whittington Dr, Houston, TX 77077" },
  { id: "stop-11", order: 11, name: "Al Ghadeer", address: "9260 S Course Dr, Houston, TX 77099", note: "Final Destination" }
];

export const statuses = ["Pending", "En Route", "Started", "Completed", "Delayed", "Skipped"];

export function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function routeLink() {
  return `https://www.google.com/maps/dir/${stops.map(stop => encodeURIComponent(stop.address)).join("/")}`;
}
