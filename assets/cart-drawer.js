class QuantityInput extends HTMLElement {
    constructor() {
        super();
        this.input = this.querySelector('input');
        this.changeEvent = new Event('change', { bubbles: true });

        this.input.addEventListener('change', this.onInputChange.bind(this));
        this.querySelectorAll('button').forEach((button) =>
            button.addEventListener('click', this.onButtonClick.bind(this))
        );
    }

    quantityUpdateUnsubscriber = undefined;

    connectedCallback() {
        this.validateQtyRules();
        this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
    }

    disconnectedCallback() {
        if (this.quantityUpdateUnsubscriber) {
            this.quantityUpdateUnsubscriber();
        }
    }

    onInputChange(event) {
        this.validateQtyRules();
    }

    onButtonClick(event) {
        event.preventDefault();
        const previousValue = this.input.value;

        event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
        if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }

    validateQtyRules() {
        const value = parseInt(this.input.value);
        if (this.input.min) {
            const min = parseInt(this.input.min);
            const buttonMinus = this.querySelector(".quantity__button[name='minus']");
            buttonMinus.classList.toggle('disabled', value <= min);
        }
        if (this.input.max) {
            const max = parseInt(this.input.max);
            const buttonPlus = this.querySelector(".quantity__button[name='plus']");
            buttonPlus.classList.toggle('disabled', value >= max);
        }
    }
}

customElements.define('quantity-input', QuantityInput);

class CartDrawer extends HTMLElement {
    constructor() {
        super();

        this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
        this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
        this.setHeaderCartIconAccessibility();
    }

    setHeaderCartIconAccessibility() {
        const cartLink = document.querySelector('#cart-icon-bubble');
        cartLink.setAttribute('role', 'button');
        cartLink.setAttribute('aria-haspopup', 'dialog');
        const cartDrawer = document.querySelector('.headerGroup cart-drawer');

        cartLink.addEventListener('click', (event) => {
            event.preventDefault();
            const dataCart = document.querySelector('.headerGroup cart-drawer.active');
            if (dataCart) {
                cartDrawer.close();
                this.headerTranparent = document.querySelector('.header-body-tranparent')
                if (this.headerTranparent) {
                    this.activeHeader = this.headerTranparent.querySelector('.header-active')
                    if (!this.activeHeader) {
                        this.headerTranparent.classList.remove('header-active')
                    }
                }
            } else {
                this.open(cartLink);
                this.headerTranparent = document.querySelector('.header-body-tranparent')
                if (this.headerTranparent) {
                    this.activeHeader = this.headerTranparent.querySelector('.header-active')
                    if (!this.activeHeader) {
                        this.headerTranparent.classList.remove('header-active')
                    }
                }
                if (this.headerTranparent) {
                    this.headerTranparent.classList.add('header-active')
                }
            }
        });

        cartLink.addEventListener('keydown', (event) => {
            if (event.code.toUpperCase() === 'SPACE') {
                event.preventDefault();
                const dataCart = document.querySelector('.headerGroup cart-drawer.active');
                if (dataCart) {
                    cartDrawer.close();
                    this.headerTranparent = document.querySelector('.header-body-tranparent')
                    if (this.headerTranparent) {
                        this.activeHeader = this.headerTranparent.querySelector('.header-active')
                        if (!this.activeHeader) {
                            this.headerTranparent.classList.remove('header-active')
                        }
                    }
                } else {
                    this.open(cartLink);
                    this.headerTranparent = document.querySelector('.header-body-tranparent')
                    if (this.headerTranparent) {
                        this.headerTranparent.classList.add('header-active')
                    }
                }
            }
        });
    }


    open(triggeredBy) {
        if (triggeredBy) this.setActiveElement(triggeredBy);
        const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
        if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
        // here the animation doesn't seem to always get triggered. A timeout seem to help
        setTimeout(() => {
            this.classList.add('animate', 'active');
            document.querySelector('body').classList.add('overflow-hidden');
        });

        this.addEventListener(
            'transitionend',
            () => {
                const containerToTrapFocusOn = this.classList.contains('is-empty')
                    ? this.querySelector('.drawer__inner-empty')
                    : document.getElementById('CartDrawer');
                const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
                trapFocus(containerToTrapFocusOn, focusElement);
            },
            {once: true}
        );

    }

    close() {
        this.classList.remove('active');
        document.querySelector('body').classList.remove('overflow-hidden');
        removeTrapFocus(this.activeElement);
    }

    setSummaryAccessibility(cartDrawerNote) {
        cartDrawerNote.setAttribute('role', 'button');
        cartDrawerNote.setAttribute('aria-expanded', 'false');

        if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
            cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
        }

        cartDrawerNote.addEventListener('click', (event) => {
            event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
        });

        cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
    }

    renderContents(parsedState) {
        this.querySelector('.drawer__inner').classList.contains('is-empty') &&
        this.querySelector('.drawer__inner').classList.remove('is-empty');
        this.productId = parsedState.id;
        this.getSectionsToRender().forEach((section) => {
            const sectionElement = section.selector
                ? document.querySelector(section.selector)
                : document.getElementById(section.id);
            if (sectionElement && sectionElement != null) {
                sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
            }
        });

        setTimeout(() => {
            this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
            this.open();
        });
    }

    getSectionInnerHTML(html, selector = '.shopify-section') {
        return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
    }

    getSectionsToRender() {
        return [
            {
                id: 'cart-drawer',
                selector: '#CartDrawer',
            },
            {
                id: 'cart-icon-bubble',
            },
            {
                id: 'cart-icon-bubble-mid',
            },
            {
                id: 'cart-icon-bubble-mb',
            },
        ];
    }

    getSectionDOM(html, selector = '.shopify-section') {
        return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
    }

    setActiveElement(element) {
        this.activeElement = element;
    }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
    getSectionsToRender() {
        return [
            {
                id: 'CartDrawer',
                section: 'cart-drawer',
                selector: '.drawer__inner',
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
        ];
    }
}

customElements.define('cart-drawer-items', CartDrawerItems);

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('cart-icon-bubble-mid') && document.getElementById('cart-icon-bubble-mid') !=null) {
        document.getElementById('cart-icon-bubble-mid').addEventListener('click', function (event) {
            event.preventDefault();
            document.getElementById('cart-icon-bubble').click();
        });
    }
    if (document.getElementById('cart-icon-bubble-mb') && document.getElementById('cart-icon-bubble-mb') !=null) {
        document.getElementById('cart-icon-bubble-mb').addEventListener('click', function (event) {
            event.preventDefault();
            document.getElementById('cart-icon-bubble').click();
        });
    }
});
