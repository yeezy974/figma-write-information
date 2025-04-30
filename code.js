"use strict";
(() => {
  // frame-service.ts
  var FrameService = class _FrameService {
    constructor() {
    }
    static getInstance() {
      if (!_FrameService.instance) {
        _FrameService.instance = new _FrameService();
      }
      return _FrameService.instance;
    }
    async getSelectedFrames() {
      const selection = figma.currentPage.selection;
      return selection.map((node) => this.getFrameInfo(node));
    }
    getLayoutInfo(node) {
      if ("layoutMode" in node) {
        return {
          padding: node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft ? {
            top: node.paddingTop || 0,
            right: node.paddingRight || 0,
            bottom: node.paddingBottom || 0,
            left: node.paddingLeft || 0
          } : void 0,
          gap: node.itemSpacing || void 0,
          layoutMode: node.layoutMode,
          primaryAxisSizingMode: node.primaryAxisSizingMode,
          counterAxisSizingMode: node.counterAxisSizingMode
        };
      }
      return void 0;
    }
    getEffectsInfo(node) {
      if ("effects" in node && Array.isArray(node.effects)) {
        return node.effects.map((effect) => {
          if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
            return {
              type: effect.type,
              color: effect.color,
              offset: effect.offset,
              radius: effect.radius,
              spread: effect.spread
            };
          }
          return {
            type: effect.type
          };
        });
      }
      return void 0;
    }
    getFillsInfo(node) {
      if ("fills" in node && Array.isArray(node.fills)) {
        return node.fills.map((fill) => {
          if (fill.type === "SOLID") {
            return {
              type: fill.type,
              color: {
                r: fill.color.r,
                g: fill.color.g,
                b: fill.color.b,
                a: fill.opacity || 1
              }
            };
          } else if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_DIAMOND") {
            return {
              type: fill.type,
              gradientStops: fill.gradientStops.map((stop) => ({
                position: stop.position,
                color: {
                  r: stop.color.r,
                  g: stop.color.g,
                  b: stop.color.b,
                  a: stop.color.a
                }
              }))
            };
          }
          return { type: fill.type };
        });
      }
      return void 0;
    }
    getStrokesInfo(node) {
      if ("strokes" in node && Array.isArray(node.strokes)) {
        return node.strokes.map((stroke) => {
          if (stroke.type === "SOLID") {
            return {
              type: stroke.type,
              color: {
                r: stroke.color.r,
                g: stroke.color.g,
                b: stroke.color.b,
                a: stroke.opacity || 1
              },
              weight: typeof node.strokeWeight === "number" ? node.strokeWeight : void 0
            };
          }
          return { type: stroke.type };
        });
      }
      return void 0;
    }
    getTextInfo(node) {
      if (node.type === "TEXT") {
        const textNode = node;
        const fontName = textNode.fontName;
        const letterSpacing = textNode.letterSpacing;
        const lineHeight = textNode.lineHeight;
        const textCase = typeof textNode.textCase === "string" ? ["ORIGINAL", "UPPER", "LOWER", "TITLE"].indexOf(textNode.textCase) !== -1 ? textNode.textCase : "ORIGINAL" : "ORIGINAL";
        return {
          content: textNode.characters,
          fontSize: typeof textNode.fontSize === "number" ? textNode.fontSize : 16,
          fontName: {
            family: typeof fontName.family === "string" ? fontName.family : "Unknown",
            style: typeof fontName.style === "string" ? fontName.style : "Regular"
          },
          textAlignHorizontal: textNode.textAlignHorizontal,
          textAlignVertical: textNode.textAlignVertical,
          letterSpacing: {
            value: typeof letterSpacing.value === "number" ? letterSpacing.value : 0,
            unit: letterSpacing.unit
          },
          lineHeight: {
            value: typeof lineHeight === "object" && "value" in lineHeight ? lineHeight.value : 0,
            unit: typeof lineHeight === "object" && "unit" in lineHeight ? lineHeight.unit : "AUTO"
          },
          textCase,
          textDecoration: typeof textNode.textDecoration === "string" ? textNode.textDecoration : "NONE"
        };
      }
      return void 0;
    }
    getFrameInfo(node) {
      const info = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        layout: this.getLayoutInfo(node),
        effects: this.getEffectsInfo(node),
        fills: this.getFillsInfo(node),
        strokes: this.getStrokesInfo(node),
        text: this.getTextInfo(node)
      };
      if ("children" in node) {
        info.children = node.children.map((child) => this.getFrameInfo(child));
      }
      return info;
    }
    formatFrameInfo(frames) {
      const formatNodeInfo = (frame, indent = "") => {
        let info = `${indent}Frame: ${frame.name}
`;
        info += `${indent}Type: ${frame.type}
`;
        info += `${indent}Size: ${frame.width}x${frame.height}
`;
        info += `${indent}Position: (${frame.x}, ${frame.y})
`;
        if (frame.layout) {
          info += `${indent}Layout:
`;
          if (frame.layout.padding) {
            info += `${indent}  Padding: ${frame.layout.padding.top}/${frame.layout.padding.right}/${frame.layout.padding.bottom}/${frame.layout.padding.left}
`;
          }
          if (frame.layout.gap !== void 0) {
            info += `${indent}  Gap: ${frame.layout.gap}
`;
          }
          if (frame.layout.layoutMode) {
            info += `${indent}  Layout Mode: ${frame.layout.layoutMode}
`;
          }
          if (frame.layout.primaryAxisSizingMode) {
            info += `${indent}  Primary Axis Sizing: ${frame.layout.primaryAxisSizingMode}
`;
          }
          if (frame.layout.counterAxisSizingMode) {
            info += `${indent}  Counter Axis Sizing: ${frame.layout.counterAxisSizingMode}
`;
          }
        }
        if (frame.effects && frame.effects.length > 0) {
          info += `${indent}Effects:
`;
          frame.effects.forEach((effect) => {
            info += `${indent}  - ${effect.type}`;
            if (effect.color) {
              info += ` (${Math.round(effect.color.r * 255)}, ${Math.round(effect.color.g * 255)}, ${Math.round(effect.color.b * 255)}, ${effect.color.a})`;
            }
            if (effect.offset) {
              info += ` Offset: (${effect.offset.x}, ${effect.offset.y})`;
            }
            if (effect.radius !== void 0) {
              info += ` Radius: ${effect.radius}`;
            }
            if (effect.spread !== void 0) {
              info += ` Spread: ${effect.spread}`;
            }
            info += "\n";
          });
        }
        if (frame.fills && frame.fills.length > 0) {
          info += `${indent}Fills:
`;
          frame.fills.forEach((fill) => {
            info += `${indent}  - ${fill.type}`;
            if (fill.color) {
              info += ` (${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a})`;
            }
            if (fill.gradientStops) {
              info += ` Gradient Stops: ${fill.gradientStops.length}`;
            }
            info += "\n";
          });
        }
        if (frame.strokes && frame.strokes.length > 0) {
          info += `${indent}Strokes:
`;
          frame.strokes.forEach((stroke) => {
            info += `${indent}  - ${stroke.type}`;
            if (stroke.color) {
              info += ` (${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)}, ${stroke.color.a})`;
            }
            if (stroke.weight !== void 0) {
              info += ` Weight: ${stroke.weight}`;
            }
            info += "\n";
          });
        }
        if (frame.text) {
          info += `${indent}Text:
`;
          info += `${indent}  Content: ${frame.text.content}
`;
          info += `${indent}  Font: ${frame.text.fontName.family} ${frame.text.fontName.style}
`;
          info += `${indent}  Size: ${frame.text.fontSize}
`;
          info += `${indent}  Alignment: ${frame.text.textAlignHorizontal} ${frame.text.textAlignVertical}
`;
          info += `${indent}  Letter Spacing: ${frame.text.letterSpacing.value}${frame.text.letterSpacing.unit}
`;
          info += `${indent}  Line Height: ${frame.text.lineHeight.value}${frame.text.lineHeight.unit}
`;
          if (frame.text.textCase !== "ORIGINAL") {
            info += `${indent}  Text Case: ${frame.text.textCase}
`;
          }
          if (frame.text.textDecoration !== "NONE") {
            info += `${indent}  Decoration: ${frame.text.textDecoration}
`;
          }
        }
        if (frame.children && frame.children.length > 0) {
          info += `${indent}Children:
`;
          frame.children.forEach((child) => {
            info += formatNodeInfo(child, indent + "  ");
          });
        }
        return info;
      };
      return frames.map((frame) => formatNodeInfo(frame)).join("\n");
    }
  };

  // ai-service.ts
  var AIService = class _AIService {
    constructor() {
      this.apiKey = "";
      this.apiUrl = "https://api.deepseek.com/v1/chat/completions";
    }
    static getInstance() {
      if (!_AIService.instance) {
        _AIService.instance = new _AIService();
      }
      return _AIService.instance;
    }
    setApiKey(key) {
      if (!key) {
        throw new Error("API Key \u4E0D\u80FD\u4E3A\u7A7A");
      }
      if (!key.startsWith("sk-")) {
        throw new Error("API Key \u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u5E94\u8BE5\u4EE5 sk- \u5F00\u5934");
      }
      this.apiKey = key;
    }
    async makeRequest(prompt) {
      if (!this.apiKey) {
        throw new Error("API Key \u672A\u8BBE\u7F6E");
      }
      const requestBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u8BBE\u8BA1\u6587\u6863\u5206\u6790\u52A9\u624B\uFF0C\u64C5\u957F\u6839\u636E\u8BBE\u8BA1\u89C4\u8303\u5206\u6790\u8BBE\u8BA1\u7A3F\u5E76\u63D0\u4F9B\u4E13\u4E1A\u7684\u8BF4\u660E\u6587\u6863\u3002"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2e3
      };
      try {
        console.log("\u5F00\u59CB\u53D1\u9001\u8BF7\u6C42\u5230 AI \u670D\u52A1...");
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "Accept": "application/json"
          },
          body: JSON.stringify(requestBody)
        });
        console.log("\u8BF7\u6C42\u5DF2\u53D1\u9001\uFF0C\u7B49\u5F85\u54CD\u5E94...");
        console.log("\u54CD\u5E94\u72B6\u6001:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("\u9519\u8BEF\u54CD\u5E94\u5185\u5BB9:", errorText);
          throw new Error(`API \u8BF7\u6C42\u5931\u8D25: ${response.status} ${response.statusText}
${errorText}`);
        }
        const data = await response.json();
        console.log("\u6210\u529F\u83B7\u53D6\u54CD\u5E94\u6570\u636E");
        return data;
      } catch (error) {
        console.error("\u8BF7\u6C42\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch")) {
            throw new Error("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8BBE\u7F6E\u6216 API \u7AEF\u70B9\u662F\u5426\u6B63\u786E");
          }
          if (error.message.includes("Unexpected token")) {
            throw new Error("API \u54CD\u5E94\u683C\u5F0F\u9519\u8BEF");
          }
          if (error.message.includes("ERR_CONNECTION_CLOSED")) {
            throw new Error("\u8FDE\u63A5\u88AB\u5173\u95ED\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u6216 API \u7AEF\u70B9\u662F\u5426\u6B63\u786E");
          }
        }
        throw error;
      }
    }
    async analyzeFrame(frameInfo, prompt) {
      try {
        console.log("\u5F00\u59CB\u5206\u6790 Frame...");
        console.log("Frame \u4FE1\u606F:", frameInfo);
        console.log("\u7528\u6237\u63D0\u793A:", prompt);
        const fullPrompt = `Frame \u4FE1\u606F\uFF1A
${frameInfo}

\u7528\u6237\u63D0\u793A\uFF1A${prompt}`;
        console.log("\u51C6\u5907\u53D1\u9001\u8BF7\u6C42...");
        const data = await this.makeRequest(fullPrompt);
        console.log("API \u54CD\u5E94:", data);
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error("\u54CD\u5E94\u6570\u636E\u683C\u5F0F\u4E0D\u6B63\u786E:", data);
          throw new Error("API \u54CD\u5E94\u683C\u5F0F\u4E0D\u6B63\u786E");
        }
        return {
          success: true,
          data: data.choices[0].message.content
        };
      } catch (error) {
        console.error("\u5206\u6790\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
        if (error instanceof Error) {
          return {
            success: false,
            error: error.message
          };
        }
        return {
          success: false,
          error: "\u53D1\u751F\u672A\u77E5\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u63A7\u5236\u53F0\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F"
        };
      }
    }
  };

  // code.ts
  function parseHtmlToParagraphs(html) {
    const paragraphs = [];
    let yOffset = 0;
    html = html.replace(/<br\s*\/?>(?![\r\n])/g, "\n");
    const blockRegex = /<(h[1-6]|li|p|div)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    let lastIndex = 0;
    while ((match = blockRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const content = match[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      let fontSize = 16;
      let fontStyle = "Regular";
      if (tag === "h1") {
        fontSize = 28;
        fontStyle = "Bold";
      }
      if (tag === "h2") {
        fontSize = 24;
        fontStyle = "Bold";
      }
      if (tag === "h3") {
        fontSize = 20;
        fontStyle = "Bold";
      }
      if (tag === "h4") {
        fontSize = 18;
        fontStyle = "Bold";
      }
      if (tag === "h5") {
        fontSize = 16;
        fontStyle = "Bold";
      }
      if (tag === "li") {
        fontSize = 16;
        fontStyle = "Regular";
      }
      if (tag === "p" || tag === "div") {
        fontSize = 16;
        fontStyle = "Regular";
      }
      if (content) {
        paragraphs.push({ text: content, fontSize, fontStyle, yOffset });
        yOffset += fontSize + 8;
      }
      lastIndex = blockRegex.lastIndex;
    }
    if (lastIndex < html.length) {
      const rest = html.slice(lastIndex).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      if (rest) {
        paragraphs.push({ text: rest, fontSize: 16, fontStyle: "Regular", yOffset });
      }
    }
    return paragraphs;
  }
  async function getAvailableInterStyles() {
    const availableFonts = await figma.listAvailableFontsAsync();
    const interFonts = availableFonts.filter((f) => f.fontName.family === "Inter");
    const styles = interFonts.map((f) => f.fontName.style);
    return Array.from(new Set(styles));
  }
  function getAvailableInterStyle(requested, available) {
    if (available.indexOf(requested) !== -1)
      return requested;
    if (requested === "Bold" && available.indexOf("Medium") !== -1)
      return "Medium";
    if (requested === "Italic" && available.indexOf("Regular") !== -1)
      return "Regular";
    return "Regular";
  }
  async function createParagraphTextNodes(node, html) {
    const x = node.x + node.width + 50;
    const y = node.y;
    const paragraphs = parseHtmlToParagraphs(html);
    const availableStyles = await getAvailableInterStyles();
    for (const style of ["Regular", "Bold", "Medium", "Italic"]) {
      if (availableStyles.indexOf(style) !== -1) {
        await figma.loadFontAsync({ family: "Inter", style });
      }
    }
    const createdNodes = [];
    for (const para of paragraphs) {
      let style = para.fontStyle;
      style = getAvailableInterStyle(style, availableStyles);
      const textNode = figma.createText();
      textNode.fontName = { family: "Inter", style };
      textNode.fontSize = para.fontSize;
      textNode.characters = para.text;
      textNode.x = x;
      textNode.y = y + para.yOffset;
      textNode.fills = [{ type: "SOLID", color: { r: 52 / 255, g: 145 / 255, b: 250 / 255 } }];
      figma.currentPage.appendChild(textNode);
      createdNodes.push(textNode);
    }
    return createdNodes;
  }
  var frameService = FrameService.getInstance();
  var aiService = AIService.getInstance();
  aiService.setApiKey("sk-229c2d52c43446ff890877402ea1772d");
  async function createDocumentation(node, content) {
    const absoluteBounds = node.absoluteBoundingBox;
    if (!absoluteBounds) {
      figma.notify("\u65E0\u6CD5\u83B7\u53D6\u5143\u7D20\u4F4D\u7F6E\u4FE1\u606F");
      return null;
    }
    const x = absoluteBounds.x + absoluteBounds.width + 50;
    const y = absoluteBounds.y;
    await figma.loadFontAsync({ family: "PingFang SC", style: "Regular" });
    const text = figma.createText();
    text.fontName = { family: "PingFang SC", style: "Regular" };
    text.fontSize = 16;
    text.characters = content || "\u8FD9\u91CC\u5C06\u663E\u793A\u4EA4\u4E92\u8BF4\u660E\u5185\u5BB9";
    text.x = x;
    text.y = y;
    text.fills = [{ type: "SOLID", color: { r: 52 / 255, g: 145 / 255, b: 250 / 255 } }];
    text.textAlignHorizontal = "LEFT";
    text.textAlignVertical = "TOP";
    text.letterSpacing = { value: 0, unit: "PIXELS" };
    text.lineHeight = { value: 24, unit: "PIXELS" };
    text.textCase = "ORIGINAL";
    text.textDecoration = "NONE";
    text.textAutoResize = "HEIGHT";
    text.resize(400, text.height);
    figma.currentPage.appendChild(text);
    return text;
  }
  figma.showUI(__html__, {
    width: 440,
    height: 600,
    themeColors: true,
    visible: true,
    title: "\u4EA4\u4E92\u8BF4\u660E\u6587\u6863\u751F\u6210\u5668"
  });

  // 统一的消息处理程序
  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === 'get-icon') {
        try {
          const image = await figma.createImageAsync('images/icon.png');
          const imageData = await image.getBytesAsync();
          const base64 = figma.base64Encode(imageData);
          figma.ui.postMessage({
            type: 'icon-data',
            data: `data:image/png;base64,${base64}`
          });
        } catch (error) {
          console.error('Failed to load icon:', error);
          // 如果加载失败，发送一个默认的图标
          figma.ui.postMessage({
            type: 'icon-data',
            data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjMThBMEZCIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGQ9Ik0xNCAxNkMxNCAxNC44OTU0IDE0Ljg5NTQgMTQgMTYgMTRIMzJDMzMuMTA0NiAxNCAzNCAxNC44OTU0IDM0IDE2VjMyQzM0IDMzLjEwNDYgMzMuMTA0NiAzNCAzMiAzNEgxNkMxNC44OTU0IDM0IDE0IDMzLjEwNDYgMTQgMzJWMTZaIiBzdHJva2U9IiMxOEEwRkIiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xOSAyMUgyOSIgc3Ryb2tlPSIjMThBMEZCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xOSAyN0gyNSIgc3Ryb2tlPSIjMThBMEZCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjM0IiBjeT0iMTQiIHI9IjYiIGZpbGw9IiMxOEEwRkIiLz48cGF0aCBkPSJNMzIuNSAxNEwzMy41IDE1TDM1LjUgMTMiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4='
          });
        }
      } else if (msg.type === "analyze") {
        const selectedFrames = await frameService.getSelectedFrames();
        if (selectedFrames.length === 0) {
          figma.ui.postMessage({
            type: "error",
            data: "\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A Frame\u3001Instance \u6216 Group"
          });
          return;
        }
        const frameInfo = frameService.formatFrameInfo(selectedFrames);
        const fullPrompt = `\u8BF7\u5206\u6790\u4EE5\u4E0B\u8BBE\u8BA1\u7A3F\u7684\u4EA4\u4E92\u8BF4\u660E\uFF0C\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\uFF1A
1. \u9875\u9762\u6574\u4F53\u5E03\u5C40\u548C\u7ED3\u6784
2. \u4E3B\u8981\u529F\u80FD\u533A\u57DF\u5212\u5206
3. \u4EA4\u4E92\u5143\u7D20\uFF08\u6309\u94AE\u3001\u8F93\u5165\u6846\u7B49\uFF09\u7684\u72B6\u6001\u548C\u53D8\u5316
4. \u7528\u6237\u64CD\u4F5C\u6D41\u7A0B
5. \u89C6\u89C9\u5C42\u6B21\u548C\u91CD\u70B9

\u8BBE\u8BA1\u7A3F\u4FE1\u606F\uFF1A
${frameInfo}

\u7528\u6237\u63D0\u793A\uFF1A${msg.prompt}`;
        const response = await aiService.analyzeFrame(frameInfo, fullPrompt);
        if (response.success && response.data) {
          figma.ui.postMessage({
            type: "result",
            data: response.data
          });
        } else {
          figma.ui.postMessage({
            type: "error",
            data: response.error || "AI \u670D\u52A1\u8C03\u7528\u5931\u8D25"
          });
        }
      } else if (msg.type === "create-documentation") {
        const selection = figma.currentPage.selection;
        if (selection.length > 0 && (selection[0].type === "FRAME" || selection[0].type === "COMPONENT" || selection[0].type === "GROUP" || selection[0].type === "INSTANCE")) {
          const docText = await createDocumentation(selection[0], msg.content);
          if (docText) {
            figma.viewport.scrollAndZoomIntoView([docText]);
            figma.notify("\u8BF4\u660E\u6587\u6863\u521B\u5EFA\u6210\u529F\uFF01");
          }
        } else {
          figma.notify("\u8BF7\u9009\u62E9\u4E00\u4E2A\u753B\u6846\uFF08frame\uFF09\u3001\u7EC4\u4EF6\uFF08component/instance\uFF09\u6216\u5206\u7EC4\uFF08group\uFF09\u6765\u521B\u5EFA\u8BF4\u660E\u6587\u6863");
        }
      }
    } catch (error) {
      figma.notify("\u53D1\u751F\u9519\u8BEF\uFF1A" + (error instanceof Error ? error.message : String(error)));
    }
  };
})();
