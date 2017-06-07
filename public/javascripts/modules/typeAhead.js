import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
          <a href="/store/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
          </a>
        `;
    }).join('');
}

function typeAhead(search) {
    if (!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('div.search__results');

    searchInput.on('input', function() { // on is bling method for addEventListener
        // if there is no value, quit search and hide old results
        if(!this.value){
            searchResults.style.display = 'none';
            return;
        }
        // show search results

        searchResults.style.display = 'block';

        axios
            .get(`/api/v1/search?q=${this.value}`)
            .then(res => {
                if(res.data.length){
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                    return;
                }else{
                    searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results found for <strong>${this.value}</strong></div>`);
                }
            })
            .catch(err => {
                console.error(err);
            });
        
        // handle keyboard input
        searchInput.on('keyup', function(event) {
            event.preventDefault();
            // ignore any keys not up, down or enter
            if(![38, 40,13].includes(event.keyCode)) {
                return;
            }
            
            const activeClass = 'search__result--active';
            const current = search.querySelector(`.${activeClass}`);
            const items = search.querySelectorAll('.search__result');

            let next;
            if(event.keyCode === 40){
                if(!current){
                    next = items[0];
                }else{
                    next = current.nextElementSibling || items[0];
                    current.classList.remove(activeClass);
                }
                next.className += ` ${activeClass}`;
            }

            else if(event.keyCode === 38){
                if(!current){
                    next = items[items.length - 1];
                }else{
                    next = current.previousElementSibling || items[items.length - 1];
                    current.classList.remove(activeClass);
                }
                next.className += ` ${activeClass}`;
            }
            else if(event.keyCode === 13 && current.href){
                window.location = current.href;
            }

        });
    });
}

export default typeAhead;