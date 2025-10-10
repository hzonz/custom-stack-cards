import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import { repeat } from "https://unpkg.com/lit@2.8.0/directives/repeat.js?module";

const STACK_CARDS_VERSION = "1.0.1";

(function logOnce() {
  const key = "custom_stack_cards_logged";
  if (!window[key]) {
    window[key] = true;
    console.log(
      `%cCustom Stack Cards\n%cVersion: ${STACK_CARDS_VERSION}`,
      "color: #1976d2; font-weight: bold; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 4px; padding: 2px 6px;",
      ""
    );
  }
})();

class BaseStackInCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _refCards: { state: true },
    _nested: { state: true },
    _helpers: { state: false }
  };

  constructor() {
    super();
    this._refCards = [];
    this._nested = false;
    this._helpers = null;
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    this.config = config;
    this._nested = this._detectNestedStack();
    this._renderCards();
  }

  static async getConfigElement() {
    let cls = customElements.get("hui-vertical-stack-card");
    if (!cls) {
      const helpers = await window.loadCardHelpers();
      helpers.createCardElement({ type: "vertical-stack", cards: [] });
      await customElements.whenDefined("hui-vertical-stack-card");
      cls = customElements.get("hui-vertical-stack-card");
    }
    if (cls?.getConfigElement) {
      return cls.getConfigElement();
    }
    return null;
  }

  _detectNestedStack() {
    let node = this.parentNode;
    while (node) {
      if (
        node.nodeType === 1 &&
        (node.localName === "vertical-stack-in-card" ||
          node.localName === "horizontal-stack-in-card") &&
        node !== this
      )
        return true;
      node =
        node.parentNode ||
        (node.getRootNode && node.getRootNode().host) ||
        null;
    }
    return false;
  }

  async _renderCards() {
    if (!this.config?.cards) return;
    if (!this._helpers) this._helpers = await window.loadCardHelpers();

    this._refCards = await Promise.all(
      this.config.cards.map(async (c) => {
        const el =
          c.type === "divider"
            ? this._helpers.createRowElement(c)
            : this._helpers.createCardElement(c);
        el.hass = this.hass;
        return el;
      })
    );
  }

  shouldUpdate(changedProps) {
    return (
      changedProps.has("hass") ||
      changedProps.has("config") ||
      changedProps.has("_refCards")
    );
  }

  updated(changedProps) {
    if (changedProps.has("hass") && this._refCards) {
      this._refCards.forEach((c) => (c.hass = this.hass));
    }
  }

  render() {
    return html`
      <ha-card
        .header=${this.config?.title}
        style="overflow:hidden; ${this._nested
          ? "background: var(--card-background-color, rgba(0,0,0,0)); box-shadow:none;"
          : ""}"
      >
        <div style="${this._getLayoutStyle()}">
          ${repeat(
            this._refCards,
            (c, i) => c.localName + ":" + i,
            (c) => {
              this._applyChildStyle(c);
              return c;
            }
          )}
        </div>
      </ha-card>
    `;
  }

  _applyChildStyle(child) {
    const styleHaCard = (haCard) => {
      if (!haCard || haCard.dataset.styled) return;

      haCard.style.boxShadow = "none";
      haCard.style.border = "none";

      if (this._nested) {
        haCard.style.borderRadius = "0";
        haCard.style.background =
          "var(--card-background-color, rgba(0,0,0,0))";
      }

      if (this.config?.styles) {
        Object.entries(this.config.styles).forEach(([k, v]) =>
          haCard.style.setProperty(k, v)
        );
      }

      haCard.dataset.styled = "true";

    if (child.shadowRoot) {
      styleHaCard(child.shadowRoot.querySelector("ha-card"));
    } else {
      styleHaCard(child.querySelector("ha-card"));
    }
  }

  async getCardSize() {
    if (!this._refCards) return 1;
    const sizes = await Promise.all(
      this._refCards.map(async (card) => {
        if (typeof card.getCardSize === "function") return card.getCardSize();
        await customElements.whenDefined(card.localName);
        return 1;
      })
    );
    return sizes.reduce((a, b) => a + b, 0);
  }

  _getLayoutStyle() {
    return "";
  }

  static getStubConfig() {
    return { cards: [] };
  }
}

// 垂直堆叠
class VerticalStackInCard extends BaseStackInCard {
  _getLayoutStyle() {
    return "display:block;";
  }
}

// 水平堆叠
class HorizontalStackInCard extends BaseStackInCard {
  _getLayoutStyle() {
    return "display:flex;";
  }
  _applyChildStyle(child) {
    super._applyChildStyle(child);
    child.style.flex = "1 1 0";
    child.style.minWidth = "0";
  }
}

customElements.define("vertical-stack-in-card", VerticalStackInCard);
customElements.define("horizontal-stack-in-card", HorizontalStackInCard);

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: "vertical-stack-in-card",
    name: "Vertical Stack In Card",
    description: `Vertical stack without extra borders, v${STACK_CARDS_VERSION}`,
    preview: true,
    documentationURL: "https://github.com/hzonz/custom-stack-cards",
  },
  {
    type: "horizontal-stack-in-card",
    name: "Horizontal Stack In Card",
    description: `Horizontal stack without extra borders, v${STACK_CARDS_VERSION}`,
    preview: true,
    documentationURL: "https://github.com/hzonz/custom-stack-cards",
  }
);
