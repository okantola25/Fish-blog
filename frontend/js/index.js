const sortingButton = document.getElementById("sorting");
const sortingItems = document.querySelectorAll(".sorting-item");

if (sortingButton) {
    sortingItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            sortingButton.textContent = item.textContent.trim();
        });
    });
}