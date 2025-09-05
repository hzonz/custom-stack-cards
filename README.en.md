> 有关中文版本，请参阅 [简体中文](README.md)

# Custom Stack Cards

**Custom Stack Cards** is a Home Assistant custom card library that provides **Vertical Stack** and **Horizontal Stack** cards. These cards allow stacking multiple cards within a single `<ha-card>` while supporting custom styles. It preserves the native UI editor, removes extra borders and shadows, and keeps the interface clean.

> ⚠️ Note: `styles` is not supported in the visual editor and must be used in YAML configuration.

## Acknowledgements & License

This library includes parts of code from [ofekasher/vertical-stack-in-card](https://github.com/ofekashery/vertical-stack-in-card) for the Vertical Stack implementation.  
Thanks to the original author [ofekasher](https://github.com/ofekashery) for the open-source contribution.

This project enhances the original by adding:
- Horizontal stacking (`horizontal-stack-in-card`)
- Custom styles (`styles`) support
- Removal of default borders and shadows
- Compatibility with the official UI editor

## Features

- Supports vertical stacking (`vertical-stack-in-card`)  
- Supports horizontal stacking (`horizontal-stack-in-card`)  
- Supports `styles: ha-card:` for custom card styling  
- Preserves native UI editor compatibility  

## Installation

### Using HACS (Recommended)

1. Open the Home Assistant HACS page  
2. Click the top-right "Add Custom Repository"  
3. Enter the repository URL: `https://github.com/hzonz/custom-stack-cards`  
4. Select type **Dashboard**, then add  
5. Search for **Custom Stack Cards** and install

### Manual Installation

1. Download the `custom-stack-cards.js` file  
2. Place it in the `www` folder, e.g.: `www/custom-stack-cards/custom-stack-cards.js`  
3. Reference it in Lovelace resources:
```yaml
resources:
  - url: /local/custom-stack-cards/custom-stack-cards.js
    type: module
```
## Examples

### Vertical Stack
```yaml
type: custom:vertical-stack-in-card
title: Vertical Stack
cards:
  - type: sensor
    entity: sensor.time
  - type: sensor
    entity: sensor.date
```

### Horizontal Stack
```yaml
type: custom:horizontal-stack-in-card
title: Horizontal Stack
cards:
  - type: sensor
    entity: sensor.temperature
  - type: sensor
    entity: sensor.humidity
```

### Full Height with card_mod
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
card_mod:
  style: |
    ha-card {
      height: 100%;
    }
grid_options:
  columns: 6
  rows: 2
```

## Configuration Options
| Parameter     | Type   | Default | Description                                                          |
| ------------- | ------ | ------- | -------------------------------------------------------------------- |
| type          | string | —       | `custom:vertical-stack-in-card` or `custom:horizontal-stack-in-card` |
| title         | string | —       | Card title                                                           |
| cards         | array  | —       | Array of cards to stack                                              |
| grid\_options | object | —       | Layout options, supports `columns` and `rows`                        |
| styles        | object | —       | Custom styles, only effective in YAML                                |
| card\_mod     | object | —       | Can use `card_mod` to force child card height or layout              |

## Notes
styles is not supported in the official visual editor and must be used in YAML
grid_options.rows will not automatically stretch child cards; use card_mod to fill row height if needed
Preserves original vertical / horizontal stack layout behavior

## Links
Repository: https://github.com/hzonz/custom-stack-cards
Original Vertical Stack project: https://github.com/ofekashery/vertical-stack-in-card
HACS installation supports official custom card management

# Special Note
This library and parts of the documentation were assisted and organized with **ChatGPT**.

