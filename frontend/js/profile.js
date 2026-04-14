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