
// tilin poisto nappi
function showConfirmButtons() {
  document.getElementById("deleteBtn").classList.add("d-none");
  document.getElementById("confirmDeleteBtn").classList.remove("d-none");
  document.getElementById("cancelDeleteBtn").classList.remove("d-none");
}

function hideConfirmButtons() {
  document.getElementById("deleteBtn").classList.remove("d-none");
  document.getElementById("confirmDeleteBtn").classList.add("d-none");
  document.getElementById("cancelDeleteBtn").classList.add("d-none");
}



// omat postaukset
const posts = [
  {
    title: "Ahven 1.2 kg",
    text: "fafeferwg regerg gregerg hyfgfbrfthfb dfbdrg rewgsdfgerg  gerg eg erg erg geg"
  },
  {
    title: "Kuha 2.8 kg",
    text: "päpää   pälälälä pälääläopä"
  },
  {
    title: "Hauki 4.1 kg",
    text: "pläpäläpäläpälä "
  }
];

let currentPostIndex = 0;

function showPost() {
  document.getElementById("postTitle").textContent = posts[currentPostIndex].title;
  document.getElementById("postText").textContent = posts[currentPostIndex].text;
}

function nextPost() {
  currentPostIndex = (currentPostIndex + 1) % posts.length;
  showPost();
}

function previousPost() {
  currentPostIndex = (currentPostIndex - 1 + posts.length) % posts.length;
  showPost();
}