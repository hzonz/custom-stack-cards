import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";

const VERSION = "v1.0.8-lit";

console.log(
  `%cCustom Stack Cards ${VERSION}`,
  "color: #1976d2; font-weight: bold; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 4px; padding: 2px 6px;"
);

class BaseStackInCard extends LitElement {
  static properties = {
    config: { attribute: false },
    hass: { attribute: false },
    _refCards: { state: true }
  };

  static styles = css`
    :host { -webkit-tap-highlight-color: transparent; }
    ha-card { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .card-title { font-size: 1.2em; font-weight: bold; padding: 12px 16px 0; margin: 0; }
    .stack { display: flex; flex: 1; align-items: center; width: 100%; }
    .stack.vertical { flex-direction: column; }
    .stack.horizontal { flex-direction: row; }
    .stack.grid { display: grid; gap: 8px; width: 100%; }
    .stack > * { flex: 1 1 auto; min-height: 0; min-width: 0; width: 100%; }
  `;

  constructor() {
    super();
    this.config = { cards: [] };
    this._refCards = [];
    this._helpers = null;
    this._hass = null;
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    this.config = { ...config };
    this._createCards();
  }

  async _loadHelpers() {
    if (!this._helpers) this._helpers = await window.loadCardHelpers();
  }

  async _createCards() {
    await this._loadHelpers();

    const cards = this.config.cards.map(c =>
      c.type === "divider" ? this._helpers.createRowElement(c) : this._helpers.createCardElement(c)
    );

    cards.forEach(el => {
      if (this._hass) el.hass = this._hass;

      const applyStyle = () => this._applyBaselineStyle(el);
      if (el.updateComplete) el.updateComplete.then(() => applyStyle());
      else setTimeout(applyStyle, 0);

      el.addEventListener("ll-rebuild", () => this._createCards(), { once: true });
    });

    this._refCards = cards;

    await Promise.all(
      this._refCards.map(c => (c.updateComplete?.catch(() => {}) || Promise.resolve()))
    );

    this.requestUpdate();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._refCards?.length) this._refCards.forEach(c => { try { c.hass = hass; } catch(e){} });
  }
  get hass() { return this._hass; }

  _applyBaselineStyle(el) {
    try {
      const haCard = el.shadowRoot?.querySelector("ha-card") || el.querySelector?.("ha-card");
      const target = haCard || el;
      if (target && !target.dataset.styled) {
        target.style.boxShadow = "none";
        target.style.border = "none";
        target.style.background = "none";
        target.style.borderRadius = "0";
        target.dataset.styled = "true";
      }
    } catch (e) {}
  }

  _rootCardStyleString() {
    const styles = this.config?.styles?.card;
    if (!styles) return "";
    return Object.entries(styles).map(([k,v])=>`${k.replace(/_/g,"-")}:${v}`).join("; ");
  }

  _renderStack(mode) {
    const extraStyle = mode === "grid" ? this._gridStyleString?.() : "";
    return html`
      <div class="stack ${mode}" style="${extraStyle}">
        ${repeat(this._refCards || [], (c, i) => i, (c, i) => c)}
      </div>
    `;
  }

  render() {
    const mode = this._layoutMode();
    const cardStyle = this._rootCardStyleString();
    const title = this.config?.title;

    return html`
      <ha-card style="${cardStyle}">
        ${title ? html`<h1 class="card-title">${title}</h1>` : ""}
        ${this._renderStack(mode)}
      </ha-card>
    `;
  }

  async getCardSize() {
    if (!this._refCards?.length) return 1;
    const sizes = await Promise.all(this._refCards.map(c => typeof c.getCardSize === "function" ? c.getCardSize() : 1));
    return sizes.reduce((a,b)=>a+b,0);
  }

  getGridOptions() {
    const featuresCount = this.config?.features?.length || 0;
    const featurePosition = this.config?.feature_position || "below";
    let rows = 0;
    let min_columns;
    if (featuresCount) {
      if (featurePosition === "inline") min_columns = 12;
      else rows += featuresCount;
    }
    if (this.config?.vertical) { rows++; min_columns = 3; }
    return {...(rows?{rows,min_rows:rows}:{}),...(min_columns?{min_columns}:{})};
  }

  _layoutMode() { return "vertical"; }

  updated(changedProps) {
    if (changedProps.has("config")) this._refCards.forEach(c=>this._applyBaselineStyle(c));
  }

  static getStubConfig() { return { cards: [] }; }

  static async _getHelperElement(type, tag) {
    let cls = customElements.get(tag);
    if (!cls) {
      const helpers = await window.loadCardHelpers();
      helpers.createCardElement({ type, cards: [] });
      await customElements.whenDefined(tag);
      cls = customElements.get(tag);
    }
    return cls.getConfigElement?.() || document.createElement("div");
  }
}

/** Vertical Stack Card */
class VerticalStackInCard extends BaseStackInCard {
  _layoutMode() { return "vertical"; }
  static getConfigElement() {
    return this._getHelperElement("vertical-stack", "hui-vertical-stack-card");
  }
}
customElements.define("vertical-stack-in-card", VerticalStackInCard);

/** Horizontal Stack Card */
class HorizontalStackInCard extends BaseStackInCard {
  _layoutMode() { return "horizontal"; }
  static getConfigElement() {
    return this._getHelperElement("horizontal-stack", "hui-horizontal-stack-card");
  }
}
customElements.define("horizontal-stack-in-card", HorizontalStackInCard);

/** Grid Stack Card */
class GridStackInCard extends BaseStackInCard {
  _layoutMode() { return "grid"; }

  _gridStyleString() {
    const cols = this.config?.columns;
    const square = this.config?.square;
    let style = "";
    if (cols) style += `grid-template-columns: repeat(${cols}, 1fr);`;
    if (square) style += `grid-auto-rows: 1fr;`;
    return style;
  }

  static getConfigElement() {
    return this._getHelperElement("grid", "hui-grid-card");
  }
}
customElements.define("grid-stack-in-card", GridStackInCard);

/** 注册 customCards */
window.customCards = window.customCards || [];
[
  { type: "vertical-stack-in-card", name: "Vertical Stack In Card", description: "Vertical stack without extra borders, supports styles" },
  { type: "horizontal-stack-in-card", name: "Horizontal Stack In Card", description: "Horizontal stack without extra borders, supports styles" },
  { type: "grid-stack-in-card", name: "Grid Stack In Card", description: "Grid stack without extra borders, supports CSS grid layouts and styles" }
].forEach(c => window.customCards.push({ ...c, preview:false, documentationURL:"https://github.com/hzonz/custom-stack-cards" }));

