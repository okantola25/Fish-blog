async function kirjautunutUI(){
    try{
        const response = await fetch('/api/me')
        const data = await response.json()

        const vierasUI = document.getElementById('auth-vieras')
        const käyttäjäUI = document.getElementById('auth-käyttäjä')
        const postButton = document.getElementById('postButton')

        if(data.kirjautunut){
            vierasUI.style.display = 'none'
            käyttäjäUI.style.display = 'block'
        } else{
            vierasUI.style.display = 'block'
            käyttäjäUI.style.display = 'none'
            postButton.style.display = 'none'
        }
    } catch(err){
        console.error("auth check failed:", err)
    }
}
document.addEventListener('DOMContentLoaded', kirjautunutUI) //Näyttää vieraille ja käyttäjille eri näkymät. Vois kopsata muille sivuille.

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

function renderPost(post) {
    return `
    <li class="list-group-item mb-1">
        <div class="card shadow">
          <div class="card-body">
            <header>
              <h2 class="h5 mb-1">${post.title}</h2>
              <p class="text-muted">${post.username} • ${new Date(post.created_at).toLocaleString()}</p>
            </header>
            <p>${post.content}</p>
            <footer>
              <button type="button" class="btn btn-outline-dark post-buttons">
                <svg class="like-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M22 11.5c0-2.097-1.228-3.498-3.315-3.498h-2.918c.089-.919.133-1.752.133-2.502 0-1.963-1.81-3.5-3.64-3.5-1.414 0-1.81.81-2.049 2.683-.004.034-.094.762-.125.995-.055.407-.112.77-.182 1.133-.273 1.414-.989 2.944-1.727 3.841a2.317 2.317 0 0 0-.456-.318C7.314 10.116 6.838 10 6.153 10h-.306c-.685 0-1.16.116-1.568.334a2.272 2.272 0 0 0-.945.945c-.218.407-.334.883-.334 1.568v5.306c0 .685.116 1.16.334 1.568.218.407.538.727.945.945.407.218.883.334 1.568.334h.306c.685 0 1.16-.116 1.568-.334.235-.126.441-.286.615-.477.697.525 1.68.811 2.985.811h4.452c1.486 0 2.565-.553 3.253-1.487.284-.384.407-.652.597-1.166a.806.806 0 0 1 .162-.214c.026-.028.11-.112.208-.21.135-.134.296-.295.369-.373.323-.346.576-.69.782-1.103.357-.713.406-1.258.337-2.173-.026-.35-.027-.464-.008-.542.034-.145.075-.265.147-.447l.066-.166c.22-.552.314-.971.314-1.619zm-9.932-5.555c.034-.251.129-1.018.127-1.009.062-.483.114-.768.168-.932.76.059 1.537.75 1.537 1.496 0 .955-.08 2.082-.242 3.378a1 1 0 0 0 .992 1.124h4.035c.92 0 1.315.451 1.315 1.498 0 .37-.04.547-.173.881l-.066.167a4.916 4.916 0 0 0-.234.72c-.084.356-.083.586-.04 1.156.044.582.022.822-.131 1.129a2.607 2.607 0 0 1-.455.63c-.04.044-.148.152-.262.266-.129.128-.265.264-.319.322-.266.286-.451.554-.573.882-.128.345-.192.486-.33.674-.314.425-.798.673-1.644.673H11.32c-1.833 0-2.317-.568-2.317-2v-4.35c1.31-1.104 2.458-3.356 2.864-5.46.077-.405.14-.803.2-1.245zm-6.846 6.152c.116-.061.278-.097.625-.097h.306c.347 0 .509.036.625.098a.275.275 0 0 1 .124.124c.062.116.098.277.098.625v5.306c0 .348-.036.509-.098.625a.275.275 0 0 1-.124.125c-.116.061-.278.097-.625.097h-.306c-.347 0-.509-.036-.625-.098a.275.275 0 0 1-.124-.124C5.036 18.662 5 18.5 5 18.153v-5.306c0-.348.036-.509.098-.625a.275.275 0 0 1 .124-.124z"/>
                </svg>
                Tykkää
              </button>
              <button type="button" class="btn btn-outline-dark post-buttons" data-bs-toggle="modal" data-bs-target="#comments-modal">
                <svg class="comment-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g transform="translate(-152 -255)" fill="currentColor">
                    <path d="M168,281 C166.832,281 165.704,280.864 164.62,280.633 L159.912,283.463 L159.975,278.824 C156.366,276.654 154,273.066 154,269 C154,262.373 160.268,257 168,257 C175.732,257 182,262.373 182,269 C182,275.628 175.732,281 168,281 L168,281 Z M168,255 C159.164,255 152,261.269 152,269 C152,273.419 154.345,277.354 158,279.919 L158,287 L165.009,282.747 C165.979,282.907 166.977,283 168,283 C176.836,283 184,276.732 184,269 C184,261.269 176.836,255 168,255 L168,255 Z M175,266 L161,266 C160.448,266 160,266.448 160,267 C160,267.553 160.448,268 161,268 L175,268 C175.552,268 176,267.553 176,267 C176,266.448 175.552,266 175,266 L175,266 Z M173,272 L163,272 C162.448,272 162,272.447 162,273 C162,273.553 162.448,274 163,274 L173,274 C173.552,274 174,273.553 174,273 C174,272.447 173.552,272 173,272 L173,272 Z"/>
                  </g>
                </svg>
                Kommentit
              </button>
            </footer>
          </div>
        </div>
      </li>`
}

async function loadPosts() {
    const response = await fetch('/api/posts');
    const posts = await response.json();

    const list = document.getElementById("forum-post-list");
    list.innerHTML = posts.map(renderPost).join('')
}

document.addEventListener('DOMContentLoaded', loadPosts);