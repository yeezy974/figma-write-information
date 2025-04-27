"use strict";
(() => {
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
  async function handleMessage(msg) {
    try {
      if (msg.type === "resize" && msg.height) {
        figma.ui.resize(440, msg.height);
        return;
      }
      if (msg.type === "create-documentation") {
        const selection = figma.currentPage.selection;
        if (selection.length > 0 && (selection[0].type === "FRAME" || selection[0].type === "COMPONENT" || selection[0].type === "GROUP" || selection[0].type === "INSTANCE")) {
          try {
            const docTexts = await createParagraphTextNodes(selection[0], msg.content || "");
            if (docTexts.length > 0) {
              figma.viewport.scrollAndZoomIntoView([docTexts[0]]);
            }
            figma.notify("\u8BF4\u660E\u6587\u6863\u521B\u5EFA\u6210\u529F\uFF01");
          } catch (error) {
            figma.notify("\u521B\u5EFA\u8BF4\u660E\u6587\u6863\u65F6\u51FA\u9519\uFF1A" + (error instanceof Error ? error.message : String(error)));
          }
        } else {
          figma.notify("\u8BF7\u9009\u62E9\u4E00\u4E2A\u753B\u6846\uFF08frame\uFF09\u3001\u7EC4\u4EF6\uFF08component/instance\uFF09\u6216\u5206\u7EC4\uFF08group\uFF09\u6765\u521B\u5EFA\u8BF4\u660E\u6587\u6863");
        }
      }
      if (msg.type === "cancel") {
        figma.closePlugin();
      }
    } catch (error) {
      figma.notify("\u53D1\u751F\u9519\u8BEF\uFF1A" + (error instanceof Error ? error.message : String(error)));
    }
  }
  figma.showUI(__html__, {
    width: 440,
    height: 600,
    themeColors: true,
    visible: true,
    title: "\u4EA4\u4E92\u8BF4\u660E\u6587\u6863\u751F\u6210\u5668"
  });
  figma.ui.onmessage = handleMessage;
  if (figma.editorType === "figjam") {
    figma.showUI(__html__, {
      width: 440,
      height: 600,
      themeColors: true,
      visible: true,
      title: "\u4EA4\u4E92\u8BF4\u660E\u6587\u6863\u751F\u6210\u5668"
    });
    figma.ui.onmessage = async (msg) => {
      try {
        if (msg.type === "create-shapes") {
          const numberOfShapes = msg.count || 5;
          const nodes = [];
          for (let i = 0; i < numberOfShapes; i++) {
            const shape = figma.createShapeWithText();
            shape.shapeType = "ROUNDED_RECTANGLE";
            shape.x = i * (shape.width + 200);
            shape.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
            figma.currentPage.appendChild(shape);
            nodes.push(shape);
          }
          for (let i = 0; i < numberOfShapes - 1; i++) {
            const connector = figma.createConnector();
            connector.strokeWeight = 8;
            connector.connectorStart = {
              endpointNodeId: nodes[i].id,
              magnet: "AUTO"
            };
            connector.connectorEnd = {
              endpointNodeId: nodes[i + 1].id,
              magnet: "AUTO"
            };
          }
          figma.currentPage.selection = nodes;
          figma.viewport.scrollAndZoomIntoView(nodes);
          figma.closePlugin();
        }
        if (msg.type === "create-documentation") {
          const selection = figma.currentPage.selection;
          if (selection.length > 0 && selection[0].type === "FRAME") {
            try {
              const docFrame = await createParagraphTextNodes(selection[0], "");
              if (Array.isArray(docFrame) && docFrame.length > 0) {
                figma.viewport.scrollAndZoomIntoView([docFrame[0]]);
              }
              figma.notify("\u8BF4\u660E\u6587\u6863\u521B\u5EFA\u6210\u529F\uFF01");
            } catch (error) {
              figma.notify("\u521B\u5EFA\u8BF4\u660E\u6587\u6863\u65F6\u51FA\u9519\uFF1A" + (error instanceof Error ? error.message : String(error)));
            }
          } else {
            figma.notify("\u8BF7\u9009\u62E9\u4E00\u4E2A\u6846\u67B6\u6765\u521B\u5EFA\u8BF4\u660E\u6587\u6863");
          }
        }
        if (msg.type === "cancel") {
          figma.closePlugin();
        }
      } catch (error) {
        figma.notify("\u53D1\u751F\u9519\u8BEF\uFF1A" + (error instanceof Error ? error.message : String(error)));
      }
    };
  }
})();
