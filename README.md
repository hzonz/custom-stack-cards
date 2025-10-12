> For English version, see [English](README.en.md)

# Custom Stack Cards

**Custom Stack Cards** 是 Home Assistant 的自定义卡片库，提供 **Vertical Stack** 和 **Horizontal Stack** 两种卡片类型。它允许在单个 `<ha-card>` 内堆叠多个卡片，支持自定义样式，并保留原生 UI 编辑器功能。相比官方堆叠卡片，它去掉了多余的边框与阴影，让界面更简洁。

---

## 特性

- 垂直堆叠：`custom:vertical-stack-in-card`  
- 水平堆叠：`custom:horizontal-stack-in-card`
- 网格堆叠：`custom:grid-stack-in-card`
- 支持 `styles: ` 自定义样式, 支持CSS属性  
- 保留原生 UI 编辑器兼容性  
- 去除默认边框和阴影  

---

## 安装

### 使用 HACS（推荐）

1. 打开 Home Assistant 的 HACS 页面  
2. 点击右上角 **“添加存储库 (Custom Repository)”**  
3. 填入仓库 URL:  
```yaml
https://github.com/hzonz/custom-stack-cards
```
4. 类型选择 **Dashboard**，然后添加  
5. 搜索 **Custom Stack Cards** 并安装  

### 手动安装

1. 下载 `custom-stack-cards.js` 文件  
2. 放到 `www` 文件夹下，例如：  
```yaml
www/custom-stack-cards/custom-stack-cards.js
```
3. 在 Lovelace 配置中引用：  
```yaml
resources:
  - url: /local/custom-stack-cards/custom-stack-cards.js
    type: module
```

---

## 配置参数

| 参数            | 类型     | 默认值 | 说明                                                                  |
| ------------- | ------ | --- | ------------------------------------------------------------------- |
| type          | string | —   | `custom:vertical-stack-in-card` 或 `custom:horizontal-stack-in-card` |
| title         | string | —   | 卡片标题                                                                |
| cards         | array  | —   | 要堆叠的卡片数组                                                            |
| grid\_options | object | —   | 布局选项，支持 columns 和 rows 和 autoheight                                              |
| styles        | object | —   | 自定义样式（⚠️ 仅 YAML 配置，不支持可视化编辑器）                             |

---

## 使用示例

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

### 统一卡片背景
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

### 自动拉伸（autoheight: true）
- 允许堆叠卡片自动拉伸子卡片，使其填满可用的垂直空间。
- 支持子卡片自适应高度，即使子卡片内容超过堆叠高度，也能正常显示和拉伸。
#### 支持的卡片类型：
- 垂直堆叠 (vertical-stack-in-card)
- 网格堆叠 (grid-stack-in-card)
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

## 注意事项
`styles: `只支持根卡片，子卡片请使用`card_mod`。

## 链接
- 仓库地址：[hzonz/custom-stack-cards](https://github.com/hzonz/custom-stack-cards)
- 原始项目：[ofekashery/vertical-stack-in-card ](https://github.com/ofekashery/vertical-stack-in-card) —— 感谢原作者 [ofekasher](https://github.com/ofekasher) 的开源贡献
