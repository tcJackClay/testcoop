import React from 'react';
import { Button } from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import type { RunningHubFunction } from '../../api/runningHub/index';

interface FunctionSelectorProps {
  currentFunction: RunningHubFunction | undefined;
  showFunctionSelector: boolean;
  onToggle: () => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  functions: RunningHubFunction[];
  onFunctionSelect: (func: RunningHubFunction) => void;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  currentFunction,
  showFunctionSelector,
  onToggle,
  categories,
  activeCategory,
  onCategoryChange,
  functions,
  onFunctionSelect,
}) => {
  const filteredFunctions = activeCategory === '全部'
    ? functions
    : functions.filter(f => f.category === activeCategory);

  return (
    <div className="relative">
      <Button
        variant="flat"
        className="w-full px-4 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 rounded-none"
        onPress={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentFunction?.icon || '🎨'}</span>
          <span className="text-sm font-medium text-slate-700">{currentFunction?.name || '选择功能'}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </Button>

      {showFunctionSelector && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          <div className="flex flex-wrap gap-1 p-2 border-b border-slate-100">
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={activeCategory === cat ? "solid" : "flat"}
                color={activeCategory === cat ? "primary" : "default"}
                onPress={() => onCategoryChange(cat)}
                className="px-2 py-1 text-xs rounded-lg transition-colors"
              >
                {cat}
              </Button>
            ))}
          </div>
          {filteredFunctions.map(func => (
            <Button
              key={func.id}
              variant="flat"
              className="w-full px-4 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors rounded-none"
              onPress={() => onFunctionSelect(func)}
            >
              <span className="text-lg">{func.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-slate-700">{func.name}</div>
                <div className="text-[10px] text-slate-400">{func.description}</div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
