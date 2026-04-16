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
            currentPage = 1
            currentSort = item.dataset.sort
            loadPosts()
        });
    });
}

document.addEventListener('DOMContentLoaded', async() =>{
    await loadModalComponent()
    await loadFishCards()
    initializeRatingSystem()
})

async function loadModalComponent(){
    try{
        const response = await fetch('./components/fishcard-modal.html')
        if(!response.ok) throw new Error('Modaalin lataus epäonnistui')
        
        const html = await response.text()
        document.getElementById('fishcard-modal-container').innerHTML = html
    } catch(error){
        console.error('Virhe ladattaessa komponenttia:', error)
    }
}

function initializeRatingSystem(){
    const ratingModal = document.getElementById('fishcard-modal')
    if(!ratingModal){
        console.error("Modaalia ei löytynyt DOMista!")
        return
    }

    ratingModal.addEventListener('show.bs.modal', event =>{
        const button = event.relatedTarget
        const fishId = button.getAttribute('data-fish-id')
        const fishName = button.getAttribute('data-fish-name')
        const fishImage = button.getAttribute('data-fish-image')
        const fishDesc = button.getAttribute('data-fish-desc')
        const avg1 = button.getAttribute('data-avg-1')
        const avg2 = button.getAttribute('data-avg-2')
        const avg3 = button.getAttribute('data-avg-3')
        const avg4 = button.getAttribute('data-avg-4')

        document.getElementById('modalFishName').textContent = fishName
        document.getElementById('currentRateFishId').value = fishId
        document.getElementById('modal-avg-1').textContent = avg1 || '0.0'
        document.getElementById('modal-avg-2').textContent = avg2 || '0.0'
        document.getElementById('modal-avg-3').textContent = avg3 || '0.0'
        document.getElementById('modal-avg-4').textContent = avg4 || '0.0'

        const imageElement = document.getElementById('modalFishImage')
    if(imageElement){
        imageElement.src = fishImage
        imageElement.alt = fishName
        imageElement.onerror = function(){ this.src = 'https://placehold.co/150x150'; }
    }
    
    const descElement = document.getElementById('modalFishDesc')
    if(descElement){
        descElement.textContent = fishDesc
    }
})
const deleteBtn = document.getElementById('delete-rating-btn')
if (deleteBtn){
    deleteBtn.addEventListener('click', async () =>{
        const fishId = document.getElementById('currentRateFishId').value
        
        if (!confirm("Haluatko varmasti poistaa arvostelusi tästä kalasta?")) {
            return
        }

        try{
            const response = await fetch(`/api/fishes/${fishId}/rate`,{
                method: 'DELETE'
            })

            const data = await response.json();

            if(!response.ok){
                alert(data.error || "Virhe poistossa.")
            } else{
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('fishcard-modal'))
                if(modalInstance){
                    modalInstance.hide()
                }
                await loadFishCards()
                
                alert(data.message)
            }
        } catch(err){
            console.error("Failed to delete rating:", err)
            alert("Yhteysvirhe arvostelua poistettaessa.")
        }
    })
}
}

const sliders = document.querySelectorAll('.auto-submit-slider')
    
  sliders.forEach(slider =>{
    slider.addEventListener('input', (e) =>{
      const displaySpan = document.getElementById(`val-${e.target.id}`)
        if (displaySpan){
          displaySpan.textContent = e.target.value
        }
    })

    slider.addEventListener('change', async () =>{
      const fishId = document.getElementById('currentRateFishId').value
            
      const r1 = parseFloat(document.getElementById('rating1').value) // thrill
      const r2 = parseFloat(document.getElementById('rating2').value) // rarity
      const r3 = parseFloat(document.getElementById('rating3').value) // taste
      const r4 = parseFloat(document.getElementById('rating4').value) // overall

        try {
          const response = await fetch(`/api/fishes/${fishId}/rate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        rating1: r1, 
                        rating2: r2, 
                        rating3: r3, 
                        rating4: r4 
                    })})

                const data = await response.json()

                if(!response.ok){
                    alert(data.error || "Virhe arvostelun tallennuksessa.")
                } else{
                    console.log(data.message)
                }
            } catch(err){
                console.error("Failed to submit rating:", err)
            }
        })
})//Kalakanta arvostelu modaali

async function loadFishCards(){
    const container = document.getElementById('fish-card-container')
    
    container.innerHTML = '<p class="text-center w-100">Ladataan kalakantaa...</p>'

    try{
        const response = await fetch('/api/fishes')
        if (!response.ok) throw new Error('Verkkovirhe kalojen latauksessa')
        
        const fishes = await response.json()
        
        container.innerHTML = ''
        fishes.forEach(fish =>{
          const safeDesc = fish.description ? fish.description.replace(/"/g, '&quot;') : 'Ei kuvausta saatavilla.'
            const cardHTML = `
                <div class="col-6 col-md-4 col-lg-3 col-xl-2">
                <div class="fish-card">
                    <img src="${fish.image_url}" alt="${fish.name}" onerror="this.src='https://placehold.co/150x150'">
                    
                    <div class="fish-card-infocontainer">
                        <h2>${fish.name}</h2>
                        <h3>${fish.scientific_name || ''}</h3>
                        
                        <div class="mb-2">
                            <strong>Arvio: </strong> <span id="avg-${fish.id}">${fish.overall_average}</span>/5
                        </div>

                        <button type="button" class="btn btn-sm btn-outline-dark w-100 mb-2" 
                                data-bs-toggle="modal" 
                                data-bs-target="#fishcard-modal" 
                                data-fish-id="${fish.id}" 
                                data-fish-name="${fish.name}"
                                data-fish-image="${fish.image_url}"
                                data-fish-desc="${safeDesc}"
                                data-avg-1="${fish.avg_rating_thrill}"
                                data-avg-2="${fish.avg_rating_rarity}"
                                data-avg-3="${fish.avg_rating_taste}"
                                data-avg-4="${fish.avg_rating_overall}">
                            Arvostele
                            </button>
                        </div>
                    </div>
                </div>
            `
            container.innerHTML += cardHTML
        })

    } catch(error){
        console.error("Virhe ladattaessa kalakortteja:", error)
        container.innerHTML = '<p class="text-center w-100 text-danger">Kalojen lataaminen epäonnistui.</p>'
    }
} //Lataa kalakortit etusivulle

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
