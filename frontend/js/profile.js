
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



// omat postaukset näkyviin profiliiin
let posts = [];
let currentPostIndex = 0;

async function loadMyPosts() {
  try {
    const response = await fetch('/api/my-posts');

    if (!response.ok) {
      throw new Error('Postauksien lataus epäonnistui');
    }

    posts = await response.json();
    showPost();
  } catch (error) {
    console.error('Virhe omien postauksien latauksessa:', error);
    document.getElementById("postTitle").textContent = "Virhe";
    document.getElementById("postText").textContent = "Postauksia ei voitu ladata.";
    document.getElementById("postDate").textContent = "";
  }
}

function showPost() {
  const titleEl = document.getElementById("postTitle");
  const textEl = document.getElementById("postText");
  const dateEl = document.getElementById("postDate");
  const deleteBtn = document.getElementById("deletePostBtn");

  if (!posts.length) {
    titleEl.textContent = "Ei postauksia";
    textEl.textContent = "Sinulla ei ole vielä omia postauksia.";
    dateEl.textContent = "";
    deleteBtn.classList.add("d-none");
    return;
  }

  deleteBtn.classList.remove("d-none");

  const post = posts[currentPostIndex];

  titleEl.textContent = post.title;
  textEl.textContent = post.content;
  dateEl.textContent = new Date(post.created_at).toLocaleString('fi-FI');
}

function nextPost() {
  if (!posts.length) return;
  currentPostIndex = (currentPostIndex + 1) % posts.length;
  showPost();
}

function previousPost() {
  if (!posts.length) return;
  currentPostIndex = (currentPostIndex - 1 + posts.length) % posts.length;
  showPost();
}

document.addEventListener("DOMContentLoaded", () => {
  loadMyPosts();

  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  confirmDeleteBtn.addEventListener("click", deleteUserAccount);
});

//poista julkaisu

async function deleteCurrentPost() {
  if (!posts.length) return;

  const confirmed = confirm("Haluatko varmasti poistaa tämän julkaisun?");
  if (!confirmed) return;

  const postId = posts[currentPostIndex].id;

  try {
    const response = await fetch(`/api/delete-post/${postId}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Julkaisun poistaminen epäonnistui.");
    }

    posts.splice(currentPostIndex, 1);

    if (currentPostIndex >= posts.length && currentPostIndex > 0) {
      currentPostIndex--;
    }

    showPost();
  } catch (error) {
    console.error("Virhe julkaisun poistossa:", error);
    alert("Julkaisun poistaminen epäonnistui.");
  }
}

// tilin poisto

async function deleteUserAccount(event) {
  event.preventDefault();

  const passwordInput = document.getElementById("deletePassword");
  const password = passwordInput.value.trim();

  if (!password) {
    alert("Syötä salasana ennen tilin poistamista.");
    return;
  }

  const confirmed = confirm("Haluatko varmasti poistaa tilisi?");
  if (!confirmed) return;

  try {
    const response = await fetch("/api/delete-user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Tilin poistaminen epäonnistui.");
    }

    alert(data.message || "Tili poistettu.");
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Virhe tilin poistossa:", error);
    alert(error.message || "Tilin poistaminen epäonnistui.");
  }
}