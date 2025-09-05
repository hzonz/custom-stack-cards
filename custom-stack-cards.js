console.log(
  `%cCustom Stack Cards\n%cVersion: 1.0.0`,
  "color: #1976d2; font-weight: bold;",
  ""
);

class BaseStackInCard extends HTMLElement {
  constructor() {
    super();
    this._refCards = [];
    this._config = {};
  }

  setConfig(config) {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    this._config = { ...config };
    this._cardSize = {};
    this._cardSize.promise = new Promise(
      (resolve) => (this._cardSize.resolve = resolve)
    );
    this.renderCard();
  }

  async renderCard() {
    const config = this._config;
    const promises = config.cards.map((c) => this._createCardElement(c));
    this._refCards = await Promise.all(promises);

    this._refCards.forEach((card) => {
      if (card.updateComplete) {
        card.updateComplete.then(() => this._styleCard(card));
      } else {
        this._styleCard(card);
      }
    });

    const card = document.createElement("ha-card");
    const cardContent = document.createElement("div");
    card.header = config.title;
    card.style.overflow = "hidden";

    // 由子类决定布局方式
    this.applyLayout(cardContent);

    this._refCards.forEach((child) => {
      this.applyChildStyle(child);
      cardContent.appendChild(child);
    });

    card.appendChild(cardContent);

    const shadowRoot = this.shadowRoot || this.attachShadow({ mode: "open" });
    while (shadowRoot.hasChildNodes()) shadowRoot.removeChild(shadowRoot.lastChild);
    shadowRoot.appendChild(card);

    this._cardSize.resolve();
  }

  async _createCardElement(cardConfig) {
    const helpers = await window.loadCardHelpers();
    const element =
      cardConfig.type === "divider"
        ? helpers.createRowElement(cardConfig)
        : helpers.createCardElement(cardConfig);

    element.hass = this._hass;
    element.addEventListener(
      "ll-rebuild",
      (ev) => {
        ev.stopPropagation();
        this._createCardElement(cardConfig).then(() => this.renderCard());
      },
      { once: true }
    );
    return element;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._refCards) this._refCards.forEach((c) => (c.hass = hass));
  }

  _styleCard(element) {
    const config = this._config;
    const applyStyles = (ele) => {
      ele.style.boxShadow = "none";
      ele.style.borderRadius = "0";
      ele.style.border = "none";
      if ("styles" in config) {
        Object.entries(config.styles).forEach(([k, v]) =>
          ele.style.setProperty(k, v)
        );
      }
    };

    if (element.shadowRoot) {
      const haCard = element.shadowRoot.querySelector("ha-card");
      if (haCard) applyStyles(haCard);
      else {
        let root =
          element.shadowRoot.getElementById("root") ||
          element.shadowRoot.getElementById("card");
        if (!root) return;
        root.childNodes.forEach((n) => this._styleCard(n));
      }
    } else if (typeof element.querySelector === "function") {
      const haCard = element.querySelector("ha-card");
      if (haCard) applyStyles(haCard);
      element.childNodes.forEach((n) => this._styleCard(n));
    }
  }

  _computeCardSize(card) {
    if (typeof card.getCardSize === "function") return card.getCardSize();
    return customElements
      .whenDefined(card.localName)
      .then(() => this._computeCardSize(card))
      .catch(() => 1);
  }

  async getCardSize() {
    await this._cardSize.promise;
    const sizes = await Promise.all(
      this._refCards.map((c) => this._computeCardSize(c))
    );
    return sizes.reduce((a, b) => a + b, 0);
  }

  // 子类必须实现
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
  applyLayout(container) {
    container.style.display = "block"; // 原生 vertical-stack
  }
  applyChildStyle(child) {
    child.style.display = "block";
    child.style.width = "100%";
  }
}

class HorizontalStackInCard extends BaseStackInCard {
  applyLayout(container) {
    container.style.display = "flex"; // 原生 horizontal-stack
  }
  applyChildStyle(child) {
    child.style.flex = "1 1 0";
    child.style.minWidth = 0;
  }
}

// 注册两个卡片
customElements.define("vertical-stack-in-card", VerticalStackInCard);
customElements.define("horizontal-stack-in-card", HorizontalStackInCard);

// 注册到 GUI 编辑器
window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: "vertical-stack-in-card",
    name: "Vertical Stack In Card",
    description: "Vertical stack without extra borders, supports styles:",
    preview: false,
    documentationURL: "https://github.com/hzonz/custom-stack-cards",
  },
  {
    type: "horizontal-stack-in-card",
    name: "Horizontal Stack In Card",
    description: "Horizontal stack without extra borders, supports styles:",
    preview: false,
    documentationURL: "https://github.com/hzonz/custom-stack-cards",
  }
);
