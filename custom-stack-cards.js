console.log(
  `%cCustom Stack Card\n%cVersion: ${'1.1.0'}`,
  'color: #1976d2; font-weight: bold;',
  ''
);

// 公共基类
class BaseStackCard extends HTMLElement {
  constructor() {
    super();
    this._refCards = [];
    this._config = {};
    this._cardSize = {};
    this._cardSize.promise = new Promise((resolve) => (this._cardSize.resolve = resolve));
  }

  setConfig(config) {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect: "cards" must be an array');
    }
    this._config = { ...config };
    this.renderCard();
  }

  async _createCardElement(cardConfig) {
    const helpers = await window.loadCardHelpers();
    const element =
      cardConfig.type === 'divider'
        ? helpers.createRowElement(cardConfig)
        : helpers.createCardElement(cardConfig);

    element.hass = this._hass;
    element.addEventListener('ll-rebuild', (ev) => {
      ev.stopPropagation();
      this._createCardElement(cardConfig).then(() => this.renderCard());
    }, { once: true });

    return element;
  }

  _styleCard(element) {
    const applyStyles = (ele) => {
      ele.style.boxShadow = 'none';
      ele.style.borderRadius = '0';
      ele.style.border = 'none';
      if ('styles' in this._config) {
        Object.entries(this._config.styles).forEach(([k, v]) => ele.style.setProperty(k, v));
      }
    };

    const traverse = (el) => {
      if (!el) return;
      if (el.shadowRoot) {
        const haCard = el.shadowRoot.querySelector('ha-card');
        if (haCard) applyStyles(haCard);
        else (el.shadowRoot.getElementById('root') || el.shadowRoot.getElementById('card'))?.childNodes.forEach(traverse);
      } else if (el.querySelector) {
        const haCard = el.querySelector('ha-card');
        if (haCard) applyStyles(haCard);
        el.childNodes.forEach(traverse);
      }
    };

    traverse(element);
  }

  _computeCardSize(card) {
    if (typeof card.getCardSize === 'function') return card.getCardSize();
    return customElements.whenDefined(card.localName).then(() => this._computeCardSize(card)).catch(() => 1);
  }

  async getCardSize() {
    await this._cardSize.promise;
    const sizes = await Promise.all(this._refCards.map((c) => this._computeCardSize(c)));
    return sizes.reduce((a, b) => a + b, 0);
  }

  set hass(hass) {
    this._hass = hass;
    this._refCards?.forEach((c) => (c.hass = hass));
  }

  static async getConfigElement() {
    let cls = customElements.get('hui-vertical-stack-card');
    if (!cls) {
      const helpers = await window.loadCardHelpers();
      helpers.createCardElement({ type: 'vertical-stack', cards: [] });
      await customElements.whenDefined('hui-vertical-stack-card');
      cls = customElements.get('hui-vertical-stack-card');
    }
    return cls.getConfigElement();
  }

  static getStubConfig() {
    return { cards: [] };
  }
}

// 垂直堆叠
class VerticalStackInCard extends BaseStackCard {
  async renderCard() {
    this._refCards = await Promise.all(this._config.cards.map((c) => this._createCardElement(c)));
    this._refCards.forEach((card) => {
      if (card.updateComplete) card.updateComplete.then(() => this._styleCard(card));
      else this._styleCard(card);
    });

    const card = document.createElement('ha-card');
    const cardContent = document.createElement('div');
    card.header = this._config.title;
    card.style.overflow = 'hidden';
    cardContent.style.display = 'block'; // 垂直
    this._refCards.forEach((c) => cardContent.appendChild(c));
    card.appendChild(cardContent);

    const shadowRoot = this.shadowRoot || this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '';
    shadowRoot.appendChild(card);

    this._cardSize.resolve();
  }

  getGridOptions() {
    return { rows: this._config.cards.length, columns: 1 };
  }
}

// 水平堆叠
class HorizontalStackInCard extends BaseStackCard {
  async renderCard() {
    this._refCards = await Promise.all(this._config.cards.map((c) => this._createCardElement(c)));
    this._refCards.forEach((card) => {
      if (card.updateComplete) card.updateComplete.then(() => this._styleCard(card));
      else this._styleCard(card);
    });

    const card = document.createElement('ha-card');
    const cardContent = document.createElement('div');
    card.header = this._config.title;
    card.style.overflow = 'hidden';
    cardContent.style.display = 'flex'; // 水平
    this._refCards.forEach((c) => {
      c.style.flex = '1 1 0';
      c.style.minWidth = 0;
      cardContent.appendChild(c);
    });
    card.appendChild(cardContent);

    const shadowRoot = this.shadowRoot || this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '';
    shadowRoot.appendChild(card);

    this._cardSize.resolve();
  }

  getGridOptions() {
    return { rows: 1, columns: this._config.columns ?? this._config.cards.length };
  }
}

// 注册卡片
customElements.define('vertical-stack-in-card', VerticalStackInCard);
customElements.define('horizontal-stack-in-card', HorizontalStackInCard);

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'vertical-stack-in-card',
    name: 'Vertical Stack In Card',
    description: 'Fixed vertical stack of multiple cards, preserves native UI editor.',
    preview: false,
    documentationURL: 'https://github.com/hzonz/custom-stack-cards',
  },
  {
    type: 'horizontal-stack-in-card',
    name: 'Horizontal Stack In Card',
    description: 'Group multiple cards into a single horizontal card, preserves native UI editor.',
    preview: false,
    documentationURL: 'https://github.com/hzonz/custom-stack-cards',
  }
);
