addEventListener('pageshow', function () {
    reloadCartDraw();
})

function fetchConfig(type = 'json') {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
    };
}

function getSectionInnerHTML(html, selector) {
    return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
}

function reloadCartDraw() {
    let sections = [ 'cart-icon-bubble', 'cart-live-region-text', "cart-drawer", "cart-icon-bubble"];
    let body = JSON.stringify({
        sections: sections,
        sections_url: window.location.pathname
    });

    fetch('/cart/update', { ...fetchConfig(), ...{ body } }) .then((response) => {
        return response.text();
    })
        .then(async (state) => {
            let parsedState = JSON.parse(state);


            const cartDrawerWrapper = document.querySelector('cart-drawer');
                    const cartFooter = document.getElementById('main-cart-footer');
            
                    if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
                    if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);
            
                    let sections = [];
                    if(document.getElementById('main-cart-items')) {
                        sections.push({id: 'main-cart-items', section: document.getElementById('main-cart-items').dataset.id, selector: '.js-contents'})
                    }
                    if(document.getElementById('main-cart-footer')) {
                        sections.push({id: 'main-cart-footer', section: document.getElementById('main-cart-footer').dataset.id, selector: '.js-contents'})
                    }
                    if(document.getElementById('cart-icon-bubble')) {
                        sections.push({id: 'cart-icon-bubble', section: 'cart-icon-bubble', selector: '.shopify-section'})
                    }
                    if(document.getElementById('cart-live-region-text')) {
                        sections.push({id: 'cart-live-region-text', section: 'cart-live-region-text', selector: '.shopify-section'})
                    }
                    if(document.getElementById('CartDrawer')) {
                        sections.push({id: "CartDrawer", section : "cart-drawer", selector: ".drawer__inner"})
                    }
                    sections.forEach((section => {
                        if(parsedState.sections[section.section]) {
                            const elementToReplace =
                                document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
                            elementToReplace.innerHTML =
                            getSectionInnerHTML(parsedState.sections[section.section], section.selector);
                        }
                    }));
        }).finally(async () => {
    });
}
