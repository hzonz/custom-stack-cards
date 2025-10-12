> 有关中文版本，请参阅 [简体中文](README.md)

# Custom Stack Cards

**Custom Stack Cards** is a custom card library for Home Assistant, providing **Vertical Stack** and **Horizontal Stack** card types. It allows stacking multiple cards inside a single `<ha-card>`, supports custom styles, and keeps compatibility with the native UI editor. Compared to the official stack cards, it removes extra borders and shadows for a cleaner look.

---

## Features

- Vertical stack: `custom:vertical-stack-in-card`  
- Horizontal stack: `custom:horizontal-stack-in-card`
- Grid Stack: `custom:grid-stack-in-card`
- Supports `styles:` custom styling, with CSS property support 
- Full compatibility with the native UI editor  
- Removes default borders and shadows  

---

## Installation

### Using HACS (Recommended)

1. Open the HACS page in Home Assistant  
2. Click the top-right **“Custom Repository”** button  
3. Enter the repository URL:  
```yaml
https://github.com/hzonz/custom-stack-cards
```
4. Select **Dashboard** as the category, then add  
5. Search for **Custom Stack Cards** and install  

### Manual Installation

1. Download the `custom-stack-cards.js` file  
2. Place it in the `www` folder, for example:  
```yaml
www/custom-stack-cards/custom-stack-cards.js
```
3. Reference it in your Lovelace configuration:  
```yaml
resources:
  - url: /local/custom-stack-cards/custom-stack-cards.js
    type: module
```

---

## Configuration Options

| Parameter     | Type   | Default | Description                                                          |
| ------------- | ------ | ------- | -------------------------------------------------------------------- |
| type          | string | —       | `custom:vertical-stack-in-card` or `custom:horizontal-stack-in-card` |
| title         | string | —       | Card title                                                           |
| cards         | array  | —       | Array of cards to stack                                              |
| grid\_options | object | —       | Layout options, supports `columns` and `rows` and `autoheight`       |
| styles        | object | —       | Custom styles (⚠️ YAML only, not supported in the visual editor)     |

---

## Examples

### Stack
```yaml
type: custom:vertical-stack-in-card  # 或 custom:horizontal-stack-in-card / custom:grid-stack-in-card
title: My Stack
cards:
  - type: sensor
    entity: sensor.time
  - type: sensor
    entity: sensor.date
```

### Unified Card Background
```yaml
type: custom:vertical-stack-in-card
cards:
  - type: sensor
    entity: sensor.time
  - type: sensor
    entity: sensor.date
styles:
  background: rgba(0,0,0,0.3)
  box-shadow: none
```

### Auto Height (autoheight: true)
- Allows stack cards to automatically stretch child cards to fill the available vertical space.
- Supports child card content adaptation, so even if a child card exceeds the stack height, it will still display and stretch properly.
#### Supported Card Types:
- Vertical Stack (vertical-stack-in-card)
- Grid Stack (grid-stack-in-card)
```yaml
type: custom:vertical-stack-in-card
cards:
  - type: tile
    entity: sensor.home_assistant_supervisor_cpu_percent
    features_position: bottom
    vertical: false
  - type: tile
    entity: sensor.home_assistant_supervisor_cpu_percent
    features_position: bottom
    vertical: false
grid_options:
  columns: 6
  rows: 2
  autoheight: true
```

---

## Notes
`styles:` only applies to the root card; for child cards, please use `card_mod`.

## Links
- Repository：[hzonz/custom-stack-cards](https://github.com/hzonz/custom-stack-cards)
- Original project:[ofekashery/vertical-stack-in-card ](https://github.com/ofekashery/vertical-stack-in-card) —— Thanks to the original author [ofekasher](https://github.com/ofekasher) for the open-source contribution.
