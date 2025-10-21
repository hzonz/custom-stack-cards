//HTMLElement 实现
//custom-stack-cards.js
const VERSION = "v1.0.5";

console.log(
  `%cCustom Stack Cards ${VERSION}`,
  "color: #1976d2; font-weight: bold; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 4px; padding: 2px 6px;"
);

class BaseStackInCard extends HTMLElement {
  constructor() {
    super();
    this._refCards = [];
    this._config = {};
    this._helpers = null;
    this._cardSize = {};
  }

  setConfig(config) {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    if (config.columns && (!Number.isInteger(config.columns) || config.columns <= 0)) {
      throw new Error('"columns" must be a positive integer');
    }
    if (config.rows && (!Number.isInteger(config.rows) || config.rows <= 0)) {
      throw new Error('"rows" must be a positive integer');
    }
    if (config.styles && typeof config.styles !== "object") {
      throw new Error('"styles" must be an object');
    }

    this._config = { ...config };
    this._cardSize.promise = new Promise(resolve => (this._cardSize.resolve = resolve));
    this.renderCard();
  }

  async renderCard() {
    if (!this._helpers) this._helpers = await window.loadCardHelpers();
    this._refCards = await Promise.all(this._config.cards.map(c => this._createCardElement(c)));

    const shadowRoot = this.shadowRoot || this.attachShadow({ mode: "open" });
    let card = shadowRoot.querySelector("ha-card");
    let stack = shadowRoot.querySelector(".stack");

    if (!card) {
      card = document.createElement("ha-card");
      card.style.height = "100%";
      card.style.alignItems = "center";
      card.style.display = "flex";

      stack = document.createElement("div");
      stack.classList.add("stack");
      card.appendChild(stack);
      shadowRoot.innerHTML = "";
      shadowRoot.appendChild(card);
    } else {
      stack.innerHTML = "";
    }

    this.applyLayout(stack);

    this._refCards.forEach(child => {
      if (child.updateComplete) {
        child.updateComplete.then(() => this._styleCard(child));
      } else {
        this._styleCard(child);
      }
      stack.appendChild(child);
    });

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
          const container = this.shadowRoot?.querySelector("ha-card > .stack");
          if (container) {
            container.replaceChild(newEl, element);
            if (newEl.updateComplete) {
              newEl.updateComplete.then(() => this._styleCard(newEl));
            } else {
              this._styleCard(newEl);
            }
          }
        }
      });
    }, { once: true });

    return element;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._refCards) this._refCards.forEach(c => (c.hass = hass));
  }

  /** baseline 去背景样式 */
  _styleCard(element) {
    if (!element || element.dataset.styled) return;

    const applyStyles = (haCard) => {
      haCard.style.boxShadow = "none";
      haCard.style.borderRadius = "0";
      haCard.style.border = "none";
      haCard.style.background = "none";
      if (this._config.styles) {
        Object.entries(this._config.styles).forEach(([k, v]) => {
          haCard.style.setProperty(k.replace(/_/g, "-"), v);
        });
      }
      haCard.dataset.styled = "true";
    };

    const haCard = element.shadowRoot?.querySelector("ha-card") || element.querySelector("ha-card");
    if (haCard) applyStyles(haCard);
  }

  _computeCardSize(card) {
    if (typeof card.getCardSize === "function") return card.getCardSize();
    return customElements.whenDefined(card.localName).then(() => this._computeCardSize(card)).catch(() => 1);
  }

  async getCardSize() {
    await this._cardSize.promise;
    const sizes = await Promise.all(this._refCards.map(c => this._computeCardSize(c)));
    return sizes.reduce((a, b) => a + b, 0);
  }

  getGridOptions() {
    const featuresCount = this._config?.features?.length || 0;
    const featurePosition = this._config?.feature_position || "below";
    let rows = 0;
    let min_columns;

    if (featuresCount) {
      if (featurePosition === "inline") {
        min_columns = 12;
      } else {
        rows += featuresCount;
      }
    }

    if (this._config?.vertical) {
      rows++;
      min_columns = 3;
    }

    return {
      ...(rows ? { rows, min_rows: rows } : {}),
      ...(min_columns ? { min_columns } : {})
    };
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

  static getStubConfig() { return { cards: [] }; }
}

/** 垂直堆叠 */
class VerticalStackInCard extends BaseStackInCard {
  applyLayout(container) {
    container.classList.add("stack", "vertical");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.width = "100%";
  }

  applyChildStyle(child) {
    child.style.flex = "1 1 auto";
    child.style.minHeight = 0;
    child.style.width = "100%";
  }
}

/** 水平堆叠 */
class HorizontalStackInCard extends BaseStackInCard {
  applyLayout(container) {
    container.classList.add("stack", "horizontal");
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.style.width = "100%";
  }

  applyChildStyle(child) {
    child.style.flex = "1 1 auto";
    child.style.minWidth = 0;
    child.style.minHeight = 0;
  }

  static async getConfigElement() {
    let cls = customElements.get("hui-horizontal-stack-card");
    if (!cls) {
      const helpers = await window.loadCardHelpers();
      helpers.createCardElement({ type: "horizontal-stack", cards: [] });
      await customElements.whenDefined("hui-horizontal-stack-card");
      cls = customElements.get("hui-horizontal-stack-card");
    }
    return cls.getConfigElement();
  }
}

/** 网格堆叠 */
class GridStackInCard extends BaseStackInCard {
  applyLayout(container) {
    container.classList.add("stack", "grid");
    container.style.display = "grid";
    container.style.width = "100%";

    if (this._config.gridTemplateColumns) {
      container.style.gridTemplateColumns = this._config.gridTemplateColumns;
    } else if (this._config.columns) {
      container.style.gridTemplateColumns = `repeat(${this._config.columns}, 1fr)`;
    } else {
      container.style.gridTemplateColumns = "1fr";
    }

    if (this._config.rows) {
      container.style.gridTemplateRows = `repeat(${this._config.rows}, 1fr)`;
    } else {
      const baseRowHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--masonry-view-row-height") || "50", 10
      );
      container.style.gridAutoRows = `${baseRowHeight}px`;
    }
  }

  applyChildStyle(child) {
    child.style.minWidth = 0;
    child.style.minHeight = 0;
    if (child._config?.gridArea) {
      child.style.gridArea = child._config.gridArea;
    }
    child.style.width = "100%";
  }

  static async getConfigElement() {
    let cls = customElements.get("hui-grid-card");
    if (!cls) {
      const helpers = await window.loadCardHelpers();
      helpers.createCardElement({ type: "grid", cards: [] });
      await customElements.whenDefined("hui-grid-card");
      cls = customElements.get("hui-grid-card");
    }
    return cls.getConfigElement();
  }

}

customElements.define("vertical-stack-in-card", VerticalStackInCard);
customElements.define("horizontal-stack-in-card", HorizontalStackInCard);
customElements.define("grid-stack-in-card", GridStackInCard);

window.customCards = window.customCards || [];
window.customCards.push(
  { type: "vertical-stack-in-card", name: "Vertical Stack In Card", description: "Vertical stack without extra borders, supports styles", preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" },
  { type: "horizontal-stack-in-card", name: "Horizontal Stack In Card", description: "Horizontal stack without extra borders, supports styles", preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" },
  { type: "grid-stack-in-card", name: "Grid Stack In Card", description: "Grid stack without extra borders, supports CSS grid layouts and styles", preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" }
);

);
