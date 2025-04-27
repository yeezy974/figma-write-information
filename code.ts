// code.ts

// 创建说明文档的函数，支持 frame、component、group、instance
// async function createDocumentation(node: FrameNode | ComponentNode | GroupNode | InstanceNode, content: string) {
//   // 计算新文本的位置
//   const x = node.x + node.width + 50;
//   const y = node.y;
//
//   // 加载字体（PingFang SC）
//   await figma.loadFontAsync({ family: "PingFang SC", style: "Regular" });
//
//   // 创建文本节点
//   const text = figma.createText();
//   text.fontName = { family: "PingFang SC", style: "Regular" };
//   text.fontSize = 16;
//   text.characters = content || "这里将显示交互说明内容";
//   text.x = x;
//   text.y = y;
//   text.fills = [{ type: 'SOLID', color: { r: 52/255, g: 145/255, b: 250/255 } }]; // #3491FA
//
//   figma.currentPage.appendChild(text);
//   return text;
// }

// 解析HTML为段落数组，每段生成独立TextNode
function parseHtmlToParagraphs(html: string) {
  // 兼容旧环境：不使用DOMParser
  const paragraphs: { text: string; fontSize: number; fontStyle: 'Regular' | 'Medium' | 'Bold'; yOffset: number }[] = [];
  let yOffset = 0;
  // 简单正则分段（h1~h6、li、p、div）
  html = html.replace(/<br\s*\/?>(?![\r\n])/g, '\n');
  const blockRegex = /<(h[1-6]|li|p|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let lastIndex = 0;
  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    let fontSize = 16;
    let fontStyle: 'Regular' | 'Medium' | 'Bold' = 'Regular';
    if (tag === 'h1') { fontSize = 28; fontStyle = 'Bold'; }
    if (tag === 'h2') { fontSize = 24; fontStyle = 'Bold'; }
    if (tag === 'h3') { fontSize = 20; fontStyle = 'Bold'; }
    if (tag === 'h4') { fontSize = 18; fontStyle = 'Bold'; }
    if (tag === 'h5') { fontSize = 16; fontStyle = 'Bold'; }
    if (tag === 'li')  { fontSize = 16; fontStyle = 'Regular'; }
    if (tag === 'p' || tag === 'div') { fontSize = 16; fontStyle = 'Regular'; }
    if (content) {
      paragraphs.push({ text: content, fontSize, fontStyle, yOffset });
      yOffset += fontSize + 8; // 段落间距
    }
    lastIndex = blockRegex.lastIndex;
  }
  // 处理剩余纯文本
  if (lastIndex < html.length) {
    const rest = html.slice(lastIndex).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (rest) {
      paragraphs.push({ text: rest, fontSize: 16, fontStyle: 'Regular', yOffset });
    }
  }
  return paragraphs;
}

// 获取本地可用Inter字重
async function getAvailableInterStyles(): Promise<('Regular' | 'Medium' | 'Bold' | 'Italic')[]> {
  const availableFonts = await figma.listAvailableFontsAsync();
  const interFonts = availableFonts.filter(f => f.fontName.family === 'Inter');
  const styles = interFonts.map(f => f.fontName.style as 'Regular' | 'Medium' | 'Bold' | 'Italic');
  return Array.from(new Set(styles));
}

function getAvailableInterStyle(requested: 'Regular' | 'Medium' | 'Bold' | 'Italic', available: ('Regular' | 'Medium' | 'Bold' | 'Italic')[]): 'Regular' | 'Medium' | 'Bold' | 'Italic' {
  if (available.indexOf(requested) !== -1) return requested;
  if (requested === 'Bold' && available.indexOf('Medium') !== -1) return 'Medium';
  if (requested === 'Italic' && available.indexOf('Regular') !== -1) return 'Regular';
  return 'Regular';
}

// 新建：每段生成独立TextNode，自动纵向排列，自动降级字重，全部用Inter
async function createParagraphTextNodes(node: FrameNode | ComponentNode | GroupNode | InstanceNode, html: string) {
  const x = node.x + node.width + 50;
  const y = node.y;
  const paragraphs = parseHtmlToParagraphs(html);
  // 检查本地可用Inter字重
  const availableStyles = await getAvailableInterStyles();
  // 预先加载所有常用Inter字重
  for (const style of ['Regular', 'Bold', 'Medium', 'Italic'] as const) {
    if (availableStyles.indexOf(style) !== -1) {
      await figma.loadFontAsync({ family: 'Inter', style });
    }
  }
  const createdNodes: TextNode[] = [];
  for (const para of paragraphs) {
    // Inter 只用 Regular/Bold/Medium/Italic
    let style: 'Regular' | 'Medium' | 'Bold' | 'Italic' = para.fontStyle as 'Regular' | 'Medium' | 'Bold' | 'Italic';
    style = getAvailableInterStyle(style, availableStyles);
    const textNode = figma.createText();
    textNode.fontName = { family: 'Inter', style };
    textNode.fontSize = para.fontSize;
    textNode.characters = para.text;
    textNode.x = x;
    textNode.y = y + para.yOffset;
    textNode.fills = [{ type: 'SOLID', color: { r: 52/255, g: 145/255, b: 250/255 } }];
    figma.currentPage.appendChild(textNode);
    createdNodes.push(textNode);
  }
  return createdNodes;
}

async function handleMessage(msg: {type: string, content?: string, height?: number}) {
  try {
    if (msg.type === 'resize' && msg.height) {
      figma.ui.resize(440, msg.height);
      return;
    }

    if (msg.type === 'create-documentation') {
      const selection = figma.currentPage.selection;
      if (
        selection.length > 0 &&
        (selection[0].type === 'FRAME' || selection[0].type === 'COMPONENT' || selection[0].type === 'GROUP' || selection[0].type === 'INSTANCE')
      ) {
        try {
          const docTexts = await createParagraphTextNodes(selection[0] as FrameNode | ComponentNode | GroupNode | InstanceNode, msg.content || '');
          if (docTexts.length > 0) {
            figma.viewport.scrollAndZoomIntoView([docTexts[0]]);
          }
          figma.notify('说明文档创建成功！');
        } catch (error: unknown) {
          figma.notify('创建说明文档时出错：' + (error instanceof Error ? error.message : String(error)));
        }
      } else {
        figma.notify('请选择一个画框（frame）、组件（component/instance）或分组（group）来创建说明文档');
      }
    }

    if (msg.type === 'cancel') {
      figma.closePlugin();
    }
  } catch (error: unknown) {
    figma.notify('发生错误：' + (error instanceof Error ? error.message : String(error)));
  }
}

figma.showUI(__html__, { 
  width: 440,
  height: 600,
  themeColors: true,
  visible: true,
  title: "交互说明文档生成器"
});
figma.ui.onmessage = handleMessage;

if (figma.editorType === 'figjam') {
  figma.showUI(__html__,{
    width: 440,
    height: 600,
    themeColors: true,
    visible: true,
    title: "交互说明文档生成器"
  });

  figma.ui.onmessage = async (msg: {type: string, count?: number}) => {
    try {
      if (msg.type === 'create-shapes') {
        const numberOfShapes = msg.count || 5;
        const nodes: SceneNode[] = [];

        for (let i = 0; i < numberOfShapes; i++) {
          const shape = figma.createShapeWithText();
          shape.shapeType = 'ROUNDED_RECTANGLE';
          shape.x = i * (shape.width + 200);
          shape.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
          figma.currentPage.appendChild(shape);
          nodes.push(shape);
        }

        for (let i = 0; i < numberOfShapes - 1; i++) {
          const connector = figma.createConnector();
          connector.strokeWeight = 8;
          connector.connectorStart = {
            endpointNodeId: nodes[i].id,
            magnet: 'AUTO',
          };
          connector.connectorEnd = {
            endpointNodeId: nodes[i + 1].id,
            magnet: 'AUTO',
          };
        }

        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        figma.closePlugin();
      }

      if (msg.type === 'create-documentation') {
        const selection = figma.currentPage.selection;
        if (selection.length > 0 && selection[0].type === 'FRAME') {
          try {
            const docFrame = await createParagraphTextNodes(selection[0] as FrameNode, '');
            if (Array.isArray(docFrame) && docFrame.length > 0) {
              figma.viewport.scrollAndZoomIntoView([docFrame[0]]);
            }
            figma.notify('说明文档创建成功！');
          } catch (error: unknown) {
            figma.notify('创建说明文档时出错：' + (error instanceof Error ? error.message : String(error)));
          }
        } else {
          figma.notify('请选择一个框架来创建说明文档');
        }
      }

      if (msg.type === 'cancel') {
        figma.closePlugin();
      }
    } catch (error: unknown) {
      figma.notify('发生错误：' + (error instanceof Error ? error.message : String(error)));
    }
  };
}
