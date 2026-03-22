import React from 'react';
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
  const filteredFunctions =
    activeCategory === '鍏ㄩ儴'
      ? functions
      : functions.filter((func) => func.category === activeCategory);

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full px-4 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 rounded-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentFunction?.icon || '馃帹'}</span>
          <span className="text-sm font-medium text-slate-700">
            {currentFunction?.name || '閫夋嫨鍔熻兘'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {showFunctionSelector && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          <div className="flex flex-wrap gap-1 p-2 border-b border-slate-100">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredFunctions.map((func) => (
            <button
              key={func.id}
              type="button"
              className="w-full px-4 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors rounded-none"
              onClick={() => onFunctionSelect(func)}
            >
              <span className="text-lg">{func.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-slate-700">{func.name}</div>
                <div className="text-[10px] text-slate-400">{func.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
