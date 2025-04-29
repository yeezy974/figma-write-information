interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private static instance: AIService;
  private apiKey: string = '';
  private apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setApiKey(key: string) {
    if (!key) {
      throw new Error('API Key 不能为空');
    }
    if (!key.startsWith('sk-')) {
      throw new Error('API Key 格式不正确，应该以 sk- 开头');
    }
    this.apiKey = key;
  }

  private async makeRequest(prompt: string): Promise<DeepseekResponse> {
    if (!this.apiKey) {
      throw new Error('API Key 未设置');
    }

    const requestBody = {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你是一个专业的设计文档分析助手，擅长根据设计规范分析设计稿并提供专业的说明文档。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    try {
      console.log('准备发送请求到:', this.apiUrl);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('请求已发送，等待响应...');
      console.log('响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('错误响应内容:', errorText);
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('成功获取响应数据');
      return data;
    } catch (error) {
      console.error('请求过程中发生错误:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('网络连接失败，请检查网络设置或 API 端点是否正确');
        }
        if (error.message.includes('Unexpected token')) {
          throw new Error('API 响应格式错误');
        }
        if (error.message.includes('ERR_CONNECTION_CLOSED')) {
          throw new Error('连接被关闭，请检查网络连接或 API 端点是否正确');
        }
      }
      throw error;
    }
  }

  async analyzeFrame(frameInfo: string, prompt: string): Promise<AIResponse> {
    try {
      console.log('开始分析 Frame...');
      console.log('Frame 信息:', frameInfo);
      console.log('用户提示:', prompt);

      const fullPrompt = `Frame 信息：\n${frameInfo}\n\n用户提示：${prompt}`;
      
      console.log('准备发送请求...');
      const data = await this.makeRequest(fullPrompt);
      console.log('API 响应:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('响应数据格式不正确:', data);
        throw new Error('API 响应格式不正确');
      }

      return {
        success: true,
        data: data.choices[0].message.content
      };
    } catch (error) {
      console.error('分析过程中发生错误:', error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        };
      }
      return {
        success: false,
        error: '发生未知错误，请检查控制台获取详细信息'
      };
    }
  }
} 