import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import { repeat } from "https://unpkg.com/lit@2.8.0/directives/repeat.js?module";

const STACK_CARDS_VERSION = "1.0.2-Lit";

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
    _rowHeightAuto: { state: true },
  };

  constructor() {
    super();
    this._refCards = [];
    this._nested = false;
    this._helpers = null;
    this._rowHeightAuto = false;
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    this.config = config;
    this._nested = this._detectNestedStack();

    // 检查 autoheight
    this._rowHeightAuto = config.grid_options?.autoheight === true;

    this._renderCards();
  }

  async _renderCards() {
    if (!this.config?.cards) return;
    if (!this._helpers) this._helpers = await window.loadCardHelpers();

    this._refCards = await Promise.all(
      this.config.cards.map(async (c) => {
        const el = c.type === "divider"
          ? this._helpers.createRowElement(c)
          : this._helpers.createCardElement(c);
        el.hass = this.hass;
        return el;
      })
    );
    this.requestUpdate();
  }

  _detectNestedStack() {
    let node = this.parentNode;
    while (node) {
      if (
        node.nodeType === 1 &&
        ["vertical-stack-in-card","horizontal-stack-in-card","grid-stack-in-card"].includes(node.localName) &&
        node !== this
      ) return true;
      node = node.parentNode || (node.getRootNode?.().host) || null;
    }
    return false;
  }

  updated(changedProps) {
    if (changedProps.has("hass") && this._refCards) {
      this._refCards.forEach(c => c.hass = this.hass);
    }
  }

  _applyChildStyle(child) {
    const styleHaCard = (haCard) => {
      if (!haCard || haCard.dataset.styled) return;

      haCard.style.boxShadow = "none";
      haCard.style.border = "none";
      if (this._nested) {
        haCard.style.borderRadius = "0";
        haCard.style.background = "var(--card-background-color, rgba(0,0,0,0))";
      }

      if (this.config?.styles) {
        Object.entries(this.config.styles).forEach(([k,v]) => haCard.style.setProperty(k,v));
      }

      haCard.dataset.styled = "true";
    };

    if (child.shadowRoot) styleHaCard(child.shadowRoot.querySelector("ha-card"));
    else styleHaCard(child.querySelector("ha-card"));
  }

  async getCardSize() {
    if (!this._refCards) return 1;
    const sizes = await Promise.all(this._refCards.map(async card => {
      if (typeof card.getCardSize === "function") return card.getCardSize();
      await customElements.whenDefined(card.localName);
      return 1;
    }));
    return sizes.reduce((a,b)=>a+b,0);
  }

  _getLayoutStyle() {
    return "";
  }

  render() {
    return html`
      <ha-card
        .header=${this.config?.title}
        style="overflow:hidden; ${this._nested ? 'background:var(--card-background-color, rgba(0,0,0,0)); box-shadow:none;' : ''}"
      >
        <div style="${this._getLayoutStyle()}">
          ${repeat(this._refCards, (c,i)=>c.localName+":"+i, c => { this._applyChildStyle(c); return c; })}
        </div>
      </ha-card>
    `;
  }

  static getStubConfig() { return { cards: [] }; }
}

// 垂直堆叠
class VerticalStackInCard extends BaseStackInCard {
  _getLayoutStyle() {
    if (this._rowHeightAuto) {
      return "display:flex; flex-direction:column; height:100%;";
    }
    return "display:block;";
  }

  _applyChildStyle(child) {
    super._applyChildStyle(child);
    if (this._rowHeightAuto) {
      child.style.flex = "1 1 0";
      child.style.minHeight = 0;
      child.style.width = "100%";
    } else {
      child.style.display = "block";
      child.style.width = "100%";
    }
  }
}

// 水平堆叠
class HorizontalStackInCard extends BaseStackInCard {
  _getLayoutStyle() { return "display:flex;"; }
  _applyChildStyle(child) {
    super._applyChildStyle(child);
    child.style.flex = "1 1 0";
    child.style.minWidth = "0";
  }
}

// 网格堆叠
class GridStackInCard extends BaseStackInCard {
  _getLayoutStyle() {
    let style = "display:grid; gap:8px;";
    const cfg = this.config;
    if (cfg?.gridTemplateColumns) style += `grid-template-columns:${cfg.gridTemplateColumns};`;
    else if (cfg?.columns) style += `grid-template-columns:repeat(${cfg.columns},1fr);`;
    else style += "grid-template-columns:1fr;";

    if (this._rowHeightAuto && this.config.grid_options?.rows) {
      style += `grid-template-rows:repeat(${this.config.grid_options.rows},1fr);`;
    } else {
      const baseRowHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--masonry-view-row-height")||"50",10);
      style += `grid-auto-rows:${baseRowHeight}px;`;
    }
    return style;
  }

  _applyChildStyle(child) {
    super._applyChildStyle(child);
    child.style.minWidth = 0;
    child.style.minHeight = 0;
    child.style.width = "100%";
    if (child._config?.gridArea) child.style.gridArea = child._config.gridArea;
  }
}

customElements.define("vertical-stack-in-card", VerticalStackInCard);
customElements.define("horizontal-stack-in-card", HorizontalStackInCard);
customElements.define("grid-stack-in-card", GridStackInCard);

window.customCards = window.customCards || [];
window.customCards.push(
  { type:"vertical-stack-in-card", name:"Vertical Stack In Card", description:`Vertical stack without extra borders, v${STACK_CARDS_VERSION}`, preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" },
  { type:"horizontal-stack-in-card", name:"Horizontal Stack In Card", description:`Horizontal stack without extra borders, v${STACK_CARDS_VERSION}`, preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" },
  { type:"grid-stack-in-card", name:"Grid Stack In Card", description:`Grid stack without extra borders, supports CSS grid layouts, v${STACK_CARDS_VERSION}`, preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" }
);
