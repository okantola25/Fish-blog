const sortingButton = document.getElementById("sorting");
const sortingItems = document.querySelectorAll(".sorting-item");
let currentSort = 'newest'

if (sortingButton) {
    sortingItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            sortingButton.textContent = item.textContent.trim();
            currentPage = 1
            currentSort = item.dataset.sort
            loadPosts()
        });
    });
}

function renderPost(post) {
    const btnClass = post.user_liked ? 'btn-primary' : 'btn-outline-dark'
    const likeText = post.user_liked ? 'Tykätty' : 'Tykkää'
    return `
    <li class="list-group-item mb-1">
        <div class="card shadow">
          <div class="card-body">
            <header>
              <h2 class="h5 mb-1">${post.title}</h2>
              <p class="text-muted">${post.username} • ${new Date(post.created_at).toLocaleString('fi-FI')}</p>
            </header>
            <p>${post.content}</p>
            <footer>
              <button type="button" class="btn ${btnClass} post-buttons like-btn" data-id="${post.id}">
                <span class="like-count">${post.total_likes}</span>
                <span class="like-text">${likeText}</span>
              </button>
              <button type="button" class="btn btn-outline-dark post-buttons" data-bs-toggle="modal" data-bs-target="#comments-modal" data-id="${post.id}">
                Kommentit
              </button>
            </footer>
          </div>
        </div>
      </li>`
}

const searchInput = document.getElementById("forum-search")

let currentPage = 1
async function loadPosts() {
  try{ 
    const searchText = searchInput ? searchInput.value.trim() : ''
    const response = await fetch(`/api/load-posts?page=${currentPage}&sort=${currentSort}&search=${encodeURIComponent(searchText)}`)
    const posts = await response.json();

    const list = document.getElementById('forum-post-list')
    const btn = document.getElementById('load-more-btn')

    if(currentPage === 1) list.innerHTML = ''

    if(posts.length<10){
      if(btn) btn.style.display = 'none'
    } else{
      if(btn) btn.style.display = 'block'
    }
    
    posts.forEach(post =>{
      const postHTML = renderPost(post)
      list.insertAdjacentHTML('beforeend', postHTML)
    })

} catch (err){
  console.error("Virhe ladatessa julkaisuja:", err)
}}
loadPosts()

const forumSearchButton = document.getElementById("forum-search-button")

function runSearch() {
  currentPage = 1
  loadPosts()
}

if (forumSearchButton) {
  forumSearchButton.addEventListener('click', runSearch)
}

if (searchInput) {
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      runSearch()
    }
  })
}//Hakukenttää varten

document.getElementById('load-more-btn').addEventListener('click',()=>{
  currentPage++
  loadPosts()
}) //Lataa uusimmat 10 julkaisua

document.getElementById('forum-post-list').addEventListener('click', async (e)=>{
  const btn = e.target.closest('.like-btn')
  if(!btn) return

  const postId = btn.getAttribute('data-id')
  const countSpan = btn.querySelector('.like-count')
  const textSpan = btn.querySelector('.like-text')

  try{
  const response = await fetch(`/api/like-post/${postId}`, {method: 'POST'})
        const data = await response.json()
        let currentCount = parseInt(countSpan.innerText)

        if (data.liked){
            btn.classList.replace('btn-outline-dark', 'btn-primary')
            textSpan.innerText = 'Tykätty'
            countSpan.innerText = currentCount + 1
        } else{
            btn.classList.replace('btn-primary', 'btn-outline-dark')
            textSpan.innerText = 'Tykkää'
            countSpan.innerText = currentCount - 1
        }
  } catch(err){
    console.error("Jokin meni pieleen:", err)
  }
}) //Lataa lisää julkaisuja napista

let currentOpenPostId = null

document.getElementById('forum-post-list').addEventListener('click', (e) =>{
  const btn = e.target.closest('[data-bs-target="#comments-modal"]')
  if(!btn) return

  const postCard = btn.closest('.card')
  currentOpenPostId = btn.getAttribute('data-id')

  document.getElementById('modal-post-title').innerText = postCard.querySelector('h2').innerText
  document.getElementById('modal-post-meta').innerText = postCard.querySelector('header p.text-muted').innerText
  document.getElementById('modal-post-content').innerText = postCard.querySelector('.card-body p:not(.text-muted)').innerText

  
  fetchReplies(currentOpenPostId)
})

async function fetchReplies(postId){
  const list = document.getElementById('modal-replies-list')
  list.innerHTML = '<li class="text-center p-3">Ladataan...</li>'

  const res = await fetch(`/api/load-replies/${postId}`)
  const replies = await res.json()

  list.innerHTML = ''
  replies.forEach(reply =>{
    list.insertAdjacentHTML('beforeend',
      `<li class="list-group-item mb-1">
        <div class="card p-2 border-0 bg-light">
          <header>
            <p class="text-muted small mb-1">${reply.username} • ${new Date(reply.created_at).toLocaleString('fi-FI')}</p>
          </header>
          <p class="mb-0">${reply.content}</p>
          </div>
        </li>
      `)    
  })
} //Lataa kommentit
function attachReplyListener() {
document.addEventListener('submit', async (e) =>{
  if(e.target && e.target.id === 'reply-form'){
      e.preventDefault()
      const contentField = document.getElementById('reply-text')
      const content = contentField.value.trim()

      if(!currentOpenPostId){
        console.error("Ei valittua julkaisua")
        return
      }

    try{
      const res = await fetch(`/api/post-reply/${currentOpenPostId}`,{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({content:content})
      })

      if(res.ok){
        contentField.value = ''
        fetchReplies(currentOpenPostId)
      } else if(res.status === 401){
        alert("Kirjaudu sisään!")
      }
  }catch(err){
    console.error("Kommentin lähetys epäonnistui", err)
}}})}
async function loadModal() {
    const resp = await fetch('./components/comments-modal.html');
    const html = await resp.text();
    document.getElementById('comments-modal-container').innerHTML = html;
    attachReplyListener();
}
  
loadModal()

