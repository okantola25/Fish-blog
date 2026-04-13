async function loadNavbar() {
  try {
    const response = await fetch("./components/navbar.html");
    const data = await response.text();
    document.getElementById("navbar-container").innerHTML = data;

    if (typeof kirjautunutUI === "function") {
      kirjautunutUI();
    }
  } catch (error) {
    console.error("Navbar loading failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadNavbar);

async function loadPart(targetId, path) {
  const response = await fetch(path);
  const html = await response.text();
  document.getElementById(targetId).innerHTML = html;
}

async function loadLayout() {
  try {
    await loadPart("navbar-container", "./components/navbar.html");
    await loadPart("upload-modal-container", "./components/upload-modal.html");
    await loadPart("comments-modal-container", "./components/comments-modal.html");
  } catch (error) {
    console.error("Layout loading failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadLayout);