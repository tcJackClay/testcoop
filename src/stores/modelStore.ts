import { create } from 'zustand';

export interface Model {
  id: string;
  name: string;
  type: 'image' | 'video';
  provider: string;
  modelId: string;
  baseUrl: string;
  apiKey: string;
}

interface ModelState {
  models: Model[];
  addModel: (model: Omit<Model, 'id'>) => void;
  updateModel: (id: string, data: Partial<Model>) => void;
  deleteModel: (id: string) => void;
  testModel: (id: string) => Promise<boolean>;
}

let modelIdCounter = 0;
const generateModelId = () => `model_${++modelIdCounter}`;

export const useModelStore = create<ModelState>((set, get) => ({
  models: [
    {
      id: 'default-gpt4',
      name: 'GPT-4 Vision',
      type: 'image',
      provider: 'OpenAI',
      modelId: 'gpt-4-vision-preview',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
    },
    {
      id: 'default-sdxl',
      name: 'Stable Diffusion XL',
      type: 'image',
      provider: 'Stability AI',
      modelId: 'stable-diffusion-xl-1024-v1-0',
      baseUrl: 'https://api.stability.ai',
      apiKey: '',
    },
  ],

  addModel: (model) => {
    const newModel: Model = {
      ...model,
      id: generateModelId(),
    };
    set((state) => ({ models: [...state.models, newModel] }));
  },

  updateModel: (id, data) => {
    set((state) => ({
      models: state.models.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
  },

  deleteModel: (id) => {
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
    }));
  },

  testModel: async (id) => {
    const model = get().models.find((m) => m.id === id);
    if (!model || !model.apiKey) {
      return false;
    }

    // Simple test - try to call the API
    try {
      const response = await fetch(`${model.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
}));
