const ON_CHANGE_DEBOUNCE_TIMER = 300;


class CartRemoveButton extends HTMLElement {
    constructor() {
        super();

        this.addEventListener('click', (event) => {
            event.preventDefault();
            const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
            cartItems.updateQuantity(this.dataset.index, 0);
        });
    }
}

customElements.define('cart-remove-button', CartRemoveButton);



class CartItems extends HTMLElement {
    constructor() {
        super();
        this.lineItemStatusElement =
            document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

        const debouncedOnChange = debounce((event) => {
            this.onChange(event);
        }, ON_CHANGE_DEBOUNCE_TIMER);

        this.addEventListener('change', debouncedOnChange.bind(this));
    }

    cartUpdateUnsubscriber = undefined;

    connectedCallback() {
        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
            if (event.source === 'cart-items') {
                return;
            }
            this.onCartUpdate();
        });
    }

    disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
            this.cartUpdateUnsubscriber();
        }
    }

    onChange(event) {
        this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
    }

    onCartUpdate() {
        fetch(`${routes.cart_url}?section_id=main-cart-items`)
            .then((response) => response.text())
            .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                const sourceQty = html.querySelector('cart-items');
                this.innerHTML = sourceQty.innerHTML;
            })
            .catch((e) => {
                console.error(e);
            });
    }

    getSectionsToRender() {
        return [
            {
                id: 'main-cart-items',
                section: document.getElementById('main-cart-items').dataset.id,
                selector: '.js-contents',
            },
            {
                id: 'cart-icon-bubble',
                section: 'cart-icon-bubble',
                selector: '.shopify-section',
            },
            {
                id: 'cart-icon-bubble-mid',
                section: 'cart-icon-bubble-mid',
                selector: '.shopify-section',
            },
            {
                id: 'cart-icon-bubble-mb',
                section: 'cart-icon-bubble-mb',
                selector: '.shopify-section',
            },
            {
                id: 'cart-live-region-text',
                section: 'cart-live-region-text',
                selector: '.shopify-section',
            },
            {
                id: 'main-cart-footer',
                section: document.getElementById('main-cart-footer').dataset.id,
                selector: '.js-contents',
            },
        ];
    }

    updateQuantity(line, quantity, name) {
        this.enableLoading(line);

        const body = JSON.stringify({
            line,
            quantity,
            sections: this.getSectionsToRender().map((section) => section.section),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
            .then((response) => {
                return response.text();
            })
            .then((state) => {
                const parsedState = JSON.parse(state);
                const quantityElement =
                    document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
                const items = document.querySelectorAll('.cart-item');

                if (parsedState.errors) {
                    quantityElement.value = quantityElement.getAttribute('value');
                    this.updateLiveRegions(line, parsedState.errors);
                    return;
                }

                this.classList.toggle('is-empty', parsedState.item_count === 0);
                const cartDrawerWrapper = document.querySelector('cart-drawer');
                const cartFooter = document.getElementById('main-cart-footer');

                if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
                if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

                this.getSectionsToRender().forEach((section) => {
                    const elementToReplace =
                        document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
                    elementToReplace.innerHTML = this.getSectionInnerHTML(
                        parsedState.sections[section.section],
                        section.selector
                    );
                });
                const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
                let message = '';
                if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
                    if (typeof updatedValue === 'undefined') {
                        message = window.cartStrings.error;
                    } else {
                        message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
                    }
                }
                this.updateLiveRegions(line, message);

                const lineItem =
                    document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
                if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
                    cartDrawerWrapper
                        ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
                        : lineItem.querySelector(`[name="${name}"]`).focus();
                } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
                    trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
                } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
                    trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
                }
                publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items' });
            })
            .catch(() => {
                this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
                const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
                if (errors != null) {
                    errors.textContent = window.cartStrings.error;
                }
            })
            .finally(() => {
                this.disableLoading(line);
            });
    }

    updateLiveRegions(line, message) {
        const lineItemError =
            document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
        if (message == 'expected String to be a Integer: quantity') {
            message = "Please add the integer value";
        }
        if (lineItemError) lineItemError.querySelector('.cart-item__error-text').innerHTML = message;

        this.lineItemStatusElement.setAttribute('aria-hidden', true);

        const cartStatus =
            document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
        cartStatus.setAttribute('aria-hidden', false);

        setTimeout(() => {
            cartStatus.setAttribute('aria-hidden', true);
        }, 1000);
    }

    getSectionInnerHTML(html, selector) {
        return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
    }

    enableLoading(line) {
        const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
        mainCartItems.classList.add('cart__items--disabled');

        const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`);
        const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

        [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

        document.activeElement.blur();
        this.lineItemStatusElement.setAttribute('aria-hidden', false);
    }

    disableLoading(line) {
        const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
        mainCartItems.classList.remove('cart__items--disabled');

        const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`);
        const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

        cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
        cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
    customElements.define(
        'cart-note',
        class CartNote extends HTMLElement {
            constructor() {
                super();

                this.addEventListener(
                    'change',
                    debounce((event) => {
                        const body = JSON.stringify({ note: event.target.value });
                        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
                    }, ON_CHANGE_DEBOUNCE_TIMER)
                );
            }
        }
    );
}

class RecommendProduct extends HTMLElement {
    constructor() {
        super();

        
        this.querySelectorAll('form.product-purchase-form').forEach(item => {
            $(item.closest('.product-form')).trigger('load-product-form');
            item.addEventListener('submit', (event) => {
                event.preventDefault();
                let $form = $(item);
                //Disable add button
                $form.find('button[type="submit"]').attr('disabled', 'disabled').each(function () {
                $(this).data('previous-value', $(this).val());
                }).val(theme.strings.products_product_adding_to_cart);

                //Hide any existing notifications
                $('#cart-summary-overlay #shop-more').triggerHandler('click');

                this.cart = document.querySelector('cart-drawer');
                const config = fetchConfig('javascript');
                config.headers['X-Requested-With'] = 'XMLHttpRequest';
                delete config.headers['Content-Type'];

                const formData = new FormData(item);
                if (this.cart) {
                    formData.append(
                        'sections',
                        this.cart.getSectionsToRender().map((section) => section.id)
                    );
                    formData.append('sections_url', window.location.pathname);
                    this.cart.setActiveElement(document.activeElement);
                }

                config.body = formData;
                fetch(`${routes.cart_add_url}`, config)
                    .then((response) => response.json())
                    .then((response) => {
                        console.log(response);
                      this.cart.renderContents(response);
                        
                      //Enable add button
                      $form.find('button[type="submit"]').removeAttr('disabled').each(function () {
                        let buttonAfter = $(this);
                        //Set to 'DONE', alter button style, wait a few secs, revert to normal
                        buttonAfter.val(theme.strings.products_product_added_to_cart).addClass('inverted');
                        window.setTimeout(function () {
                          buttonAfter.removeClass('inverted').val(buttonAfter.data('previous-value'));
                        }, 3000); 
                      }); 

                      //Dispatch change event
                      document.documentElement.dispatchEvent(
                        new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false })
                      );

                    })
                    .catch((e) => {
                      console.error(e);
                    })
                    .finally(() => {
                      if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');

                      $form.find('button[type="submit"]').removeAttr('disabled').each(function () {
                        $(this).val($(this).data('previous-value'));
                      });

                    });
            })
        })
    }
}

customElements.define('recommend-product', RecommendProduct);
