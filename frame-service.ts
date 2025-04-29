interface FrameInfo {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  x: number;
  y: number;
  layout?: {
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    gap?: number;
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisSizingMode?: 'FIXED' | 'AUTO';
    counterAxisSizingMode?: 'FIXED' | 'AUTO';
  };
  effects?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    offset?: {
      x: number;
      y: number;
    };
    radius?: number;
    spread?: number;
  }>;
  fills?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    gradientStops?: Array<{
      position: number;
      color: {
        r: number;
        g: number;
        b: number;
        a: number;
      };
    }>;
  }>;
  strokes?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    weight?: number;
  }>;
  text?: {
    content: string;
    fontSize: number;
    fontName: {
      family: string;
      style: string;
    };
    textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
    letterSpacing: {
      value: number;
      unit: 'PIXELS' | 'PERCENT';
    };
    lineHeight: {
      value: number;
      unit: 'PIXELS' | 'PERCENT' | 'AUTO';
    };
    textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
    textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  };
  children?: FrameInfo[];
}

export class FrameService {
  private static instance: FrameService;

  private constructor() {}

  static getInstance(): FrameService {
    if (!FrameService.instance) {
      FrameService.instance = new FrameService();
    }
    return FrameService.instance;
  }

  async getSelectedFrames(): Promise<FrameInfo[]> {
    const selection = figma.currentPage.selection;
    return selection.map(node => this.getFrameInfo(node));
  }

  private getLayoutInfo(node: SceneNode): FrameInfo['layout'] {
    if ('layoutMode' in node) {
      return {
        padding: node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft ? {
          top: node.paddingTop || 0,
          right: node.paddingRight || 0,
          bottom: node.paddingBottom || 0,
          left: node.paddingLeft || 0
        } : undefined,
        gap: node.itemSpacing || undefined,
        layoutMode: node.layoutMode,
        primaryAxisSizingMode: node.primaryAxisSizingMode,
        counterAxisSizingMode: node.counterAxisSizingMode
      };
    }
    return undefined;
  }

  private getEffectsInfo(node: SceneNode): FrameInfo['effects'] {
    if ('effects' in node && Array.isArray(node.effects)) {
      return node.effects.map(effect => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
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
    return undefined;
  }

  private getFillsInfo(node: SceneNode): FrameInfo['fills'] {
    if ('fills' in node && Array.isArray(node.fills)) {
      return node.fills.map((fill: Paint) => {
        if (fill.type === 'SOLID') {
          return {
            type: fill.type,
            color: {
              r: fill.color.r,
              g: fill.color.g,
              b: fill.color.b,
              a: fill.opacity || 1
            }
          };
        } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' || fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
          return {
            type: fill.type,
            gradientStops: fill.gradientStops.map(stop => ({
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
    return undefined;
  }

  private getStrokesInfo(node: SceneNode): FrameInfo['strokes'] {
    if ('strokes' in node && Array.isArray(node.strokes)) {
      return node.strokes.map((stroke: Paint) => {
        if (stroke.type === 'SOLID') {
          return {
            type: stroke.type,
            color: {
              r: stroke.color.r,
              g: stroke.color.g,
              b: stroke.color.b,
              a: stroke.opacity || 1
            },
            weight: typeof node.strokeWeight === 'number' ? node.strokeWeight : undefined
          };
        }
        return { type: stroke.type };
      });
    }
    return undefined;
  }

  private getTextInfo(node: SceneNode): FrameInfo['text'] {
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      const fontName = textNode.fontName as FontName;
      const letterSpacing = textNode.letterSpacing as LetterSpacing;
      const lineHeight = textNode.lineHeight as { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
      
      return {
        content: textNode.characters,
        fontSize: textNode.fontSize as number,
        fontName: {
          family: fontName.family,
          style: fontName.style
        },
        textAlignHorizontal: textNode.textAlignHorizontal,
        textAlignVertical: textNode.textAlignVertical,
        letterSpacing: {
          value: letterSpacing.value as number,
          unit: letterSpacing.unit
        },
        lineHeight: {
          value: lineHeight.value,
          unit: lineHeight.unit
        },
        textCase: textNode.textCase as 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE',
        textDecoration: textNode.textDecoration as 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'
      };
    }
    return undefined;
  }

  private getFrameInfo(node: SceneNode): FrameInfo {
    const info: FrameInfo = {
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

    if ('children' in node) {
      info.children = node.children.map(child => this.getFrameInfo(child));
    }

    return info;
  }

  formatFrameInfo(frames: FrameInfo[]): string {
    const formatNodeInfo = (frame: FrameInfo, indent: string = ''): string => {
      let info = `${indent}Frame: ${frame.name}\n`;
      info += `${indent}Type: ${frame.type}\n`;
      info += `${indent}Size: ${frame.width}x${frame.height}\n`;
      info += `${indent}Position: (${frame.x}, ${frame.y})\n`;
      
      if (frame.layout) {
        info += `${indent}Layout:\n`;
        if (frame.layout.padding) {
          info += `${indent}  Padding: ${frame.layout.padding.top}/${frame.layout.padding.right}/${frame.layout.padding.bottom}/${frame.layout.padding.left}\n`;
        }
        if (frame.layout.gap !== undefined) {
          info += `${indent}  Gap: ${frame.layout.gap}\n`;
        }
        if (frame.layout.layoutMode) {
          info += `${indent}  Layout Mode: ${frame.layout.layoutMode}\n`;
        }
        if (frame.layout.primaryAxisSizingMode) {
          info += `${indent}  Primary Axis Sizing: ${frame.layout.primaryAxisSizingMode}\n`;
        }
        if (frame.layout.counterAxisSizingMode) {
          info += `${indent}  Counter Axis Sizing: ${frame.layout.counterAxisSizingMode}\n`;
        }
      }

      if (frame.effects && frame.effects.length > 0) {
        info += `${indent}Effects:\n`;
        frame.effects.forEach(effect => {
          info += `${indent}  - ${effect.type}`;
          if (effect.color) {
            info += ` (${Math.round(effect.color.r * 255)}, ${Math.round(effect.color.g * 255)}, ${Math.round(effect.color.b * 255)}, ${effect.color.a})`;
          }
          if (effect.offset) {
            info += ` Offset: (${effect.offset.x}, ${effect.offset.y})`;
          }
          if (effect.radius !== undefined) {
            info += ` Radius: ${effect.radius}`;
          }
          if (effect.spread !== undefined) {
            info += ` Spread: ${effect.spread}`;
          }
          info += '\n';
        });
      }

      if (frame.fills && frame.fills.length > 0) {
        info += `${indent}Fills:\n`;
        frame.fills.forEach(fill => {
          info += `${indent}  - ${fill.type}`;
          if (fill.color) {
            info += ` (${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a})`;
          }
          if (fill.gradientStops) {
            info += ` Gradient Stops: ${fill.gradientStops.length}`;
          }
          info += '\n';
        });
      }

      if (frame.strokes && frame.strokes.length > 0) {
        info += `${indent}Strokes:\n`;
        frame.strokes.forEach(stroke => {
          info += `${indent}  - ${stroke.type}`;
          if (stroke.color) {
            info += ` (${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)}, ${stroke.color.a})`;
          }
          if (stroke.weight !== undefined) {
            info += ` Weight: ${stroke.weight}`;
          }
          info += '\n';
        });
      }

      if (frame.text) {
        info += `${indent}Text:\n`;
        info += `${indent}  Content: ${frame.text.content}\n`;
        info += `${indent}  Font: ${frame.text.fontName.family} ${frame.text.fontName.style}\n`;
        info += `${indent}  Size: ${frame.text.fontSize}\n`;
        info += `${indent}  Alignment: ${frame.text.textAlignHorizontal} ${frame.text.textAlignVertical}\n`;
        info += `${indent}  Letter Spacing: ${frame.text.letterSpacing.value}${frame.text.letterSpacing.unit}\n`;
        info += `${indent}  Line Height: ${frame.text.lineHeight.value}${frame.text.lineHeight.unit}\n`;
        if (frame.text.textCase !== 'ORIGINAL') {
          info += `${indent}  Text Case: ${frame.text.textCase}\n`;
        }
        if (frame.text.textDecoration !== 'NONE') {
          info += `${indent}  Decoration: ${frame.text.textDecoration}\n`;
        }
      }
      
      if (frame.children && frame.children.length > 0) {
        info += `${indent}Children:\n`;
        frame.children.forEach(child => {
          info += formatNodeInfo(child, indent + '  ');
        });
      }
      
      return info;
    };

    return frames.map(frame => formatNodeInfo(frame)).join('\n');
  }
} 