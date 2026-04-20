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
})}//Kalakanta arvostelu modaali

async function loadFishCards(){
    const container = document.getElementById('fish-card-container')
    if (!container) return

    const searchInput = document.getElementById('kalakanta-search')
    const searchText = searchInput ? searchInput.value.trim() : ''
    const sort = window.currentSortFish || 'rating-desc'
    container.innerHTML = '<p class="text-center w-100">Ladataan kalakantaa...</p>'

    try{
        const response = await fetch(`/api/fishes?search=${encodeURIComponent(searchText)}&sort=${sort}`)

        if (!response.ok) throw new Error('Verkkovirhe kalojen latauksessa')
        
        const fishes = await response.json()
        container.innerHTML = ''

        if(fishes.length === 0){
            container.innerHTML = '<p class="text-center w-100 text-muted">Kaloja ei löytynyt tällä hakusanalla.</p>'
            return
        }
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

document.addEventListener('DOMContentLoaded', () =>{
    const searchInput = document.getElementById('kalakanta-search')
    const searchButton = document.getElementById('kalakanta-search-button')

    if(searchInput){
        searchInput.addEventListener('input', (e) =>{
            if(e.target.value === ''){
                loadFishCards()
            }
        })
    }
    
    if(searchButton){
        searchButton.addEventListener('click', () =>{
            loadFishCards()
        })
    }

    const sortItems = document.querySelectorAll('.sorting-item-fish')
    sortItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault()
            window.currentSortFish = e.target.getAttribute('data-sort')
            loadFishCards()
        })
    })
})

