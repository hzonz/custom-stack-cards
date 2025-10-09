console.log(
  "%c Custom Stack Cards v1.0.1 ",
  "color: #1976d2; font-weight: bold; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 4px; padding: 2px 6px;"
);


class BaseStackInCard extends HTMLElement {
  constructor() {
    super();
    this._refCards = [];
    this._config = {};
    this._nested = false;
    this._helpers = null;
  }

  setConfig(config) {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    this._config = { ...config };
    this._cardSize = {};
    this._cardSize.promise = new Promise(resolve => (this._cardSize.resolve = resolve));
    this.renderCard();
  }

  _detectNestedStack() {
    let node = this.parentNode;
    while (node) {
      if (node.nodeType === 1) {
        const ln = node.localName;
        if ((ln === "vertical-stack-in-card" || ln === "horizontal-stack-in-card") && node !== this) {
          return true;
        }
      }
      node = node.parentNode || (node.getRootNode && node.getRootNode().host) || null;
    }
    return false;
  }

  async renderCard() {
    const config = this._config;
    if (!this._helpers) this._helpers = await window.loadCardHelpers();

    this._refCards = await Promise.all(config.cards.map(c => this._createCardElement(c)));
    this._nested = this._detectNestedStack();

    const card = document.createElement("ha-card");
    const cardContent = document.createElement("div");
    card.header = config.title;
    card.style.overflow = "hidden";

    if (this._nested) {
      card.style.boxShadow = "none";
      card.style.borderRadius = "0";
      card.style.border = "none";
      card.style.background = "var(--card-background-color, rgba(0,0,0,0))";
    } else {
      card.dataset.stackRoot = "true";
      card.style.background = "var(--card-background-color, white)";
    }

    this.applyLayout(cardContent);

    this._refCards.forEach(child => {
      this.applyChildStyle(child);
      if (child.updateComplete) {
        child.updateComplete.then(() => this._styleCard(child));
      } else {
        this._styleCard(child);
      }
      cardContent.appendChild(child);
    });

    card.appendChild(cardContent);

    const shadowRoot = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = "";
    shadowRoot.appendChild(card);

    this._cardSize.resolve();
  }

  async _createCardElement(cardConfig) {
    const element = cardConfig.type === "divider"
      ? this._helpers.createRowElement(cardConfig)
      : this._helpers.createCardElement(cardConfig);

    element.hass = this._hass;

    element.addEventListener("ll-rebuild", ev => {
      ev.stopPropagation();
      this._createCardElement(cardConfig).then(newEl => {
        const idx = this._refCards.indexOf(element);
        if (idx > -1) {
          this._refCards[idx] = newEl;
          const container = this.shadowRoot?.querySelector("ha-card > div");
          if (container) container.replaceChild(newEl, element);
        }
        this._styleCard(newEl);
      });
    }, { once: true });

    return element;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._refCards) this._refCards.forEach(c => (c.hass = hass));
  }

  _styleCard(element) {
    const config = this._config;
    const applyStyles = ele => {
      if (ele.dataset.styled) return;
      ele.style.boxShadow = "none";
      ele.style.borderRadius = "0";
      ele.style.border = "none";

      if (this._nested) {
        ele.style.background = "var(--card-background-color, rgba(0,0,0,0))";
      }

      if ("styles" in config) {
        Object.entries(config.styles).forEach(([k,v]) => ele.style.setProperty(k,v));
      }

      ele.dataset.styled = "true";
    };

    if (element.shadowRoot) {
      const haCard = element.shadowRoot.querySelector("ha-card");
      if (haCard) applyStyles(haCard);
    } else if (typeof element.querySelector === "function") {
      const haCard = element.querySelector("ha-card");
      if (haCard) applyStyles(haCard);
    }
  }

  _computeCardSize(card) {
    if (typeof card.getCardSize === "function") return card.getCardSize();
    return customElements.whenDefined(card.localName).then(() => this._computeCardSize(card)).catch(() => 1);
  }

  async getCardSize() {
    await this._cardSize.promise;
    const sizes = await Promise.all(this._refCards.map(c => this._computeCardSize(c)));
    return sizes.reduce((a,b) => a+b, 0);
  }

  applyLayout(container) {}
  applyChildStyle(child) {}

  static async getConfigElement() {
    let cls = customElements.get("hui-vertical-stack-card");
    if (!cls) {
      const helpers = await window.loadCardHelpers();
      helpers.createCardElement({ type: "vertical-stack", cards: [] });
      await customElements.whenDefined("hui-vertical-stack-card");
      cls = customElements.get("hui-vertical-stack-card");
    }
    return cls.getConfigElement();
  }

  static getStubConfig() {
    return { cards: [] };
  }
}

class VerticalStackInCard extends BaseStackInCard {
  applyLayout(container) { container.style.display = "block"; }
  applyChildStyle(child) { child.style.display="block"; child.style.width="100%"; }
}

class HorizontalStackInCard extends BaseStackInCard {
  applyLayout(container) { 
    container.style.display = "flex"; 
    container.style.gap = "8px";
  }
  applyChildStyle(child) { child.style.flex="1 1 0"; child.style.minWidth=0; }
}

customElements.define("vertical-stack-in-card", VerticalStackInCard);
customElements.define("horizontal-stack-in-card", HorizontalStackInCard);

window.customCards = window.customCards || [];
window.customCards.push(
  { type: "vertical-stack-in-card", name: "Vertical Stack In Card", description: "Vertical stack without extra borders, supports styles:", preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" },
  { type: "horizontal-stack-in-card", name: "Horizontal Stack In Card", description: "Horizontal stack without extra borders, supports styles:", preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" }
);
