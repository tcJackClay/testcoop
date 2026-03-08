import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import type { Image } from '../../api/image';

interface Variant {
  id: number;
  name?: string;
  resourceName?: string;
  url?: string;
  resourceContent?: string;
}

interface VariantDetailViewProps {
  selectedPrimaryAsset: Image;
  variants: Variant[];
  onBack: () => void;
}

export default function VariantDetailView({ selectedPrimaryAsset, variants, onBack }: VariantDetailViewProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Back button and title */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 rounded hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft size={14} />
          <span>返回资产库</span>
        </button>
      </div>

      {/* Primary asset display */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-white mb-2">
          {selectedPrimaryAsset.name || selectedPrimaryAsset.resourceName}
        </h3>
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
          {selectedPrimaryAsset.url || selectedPrimaryAsset.resourceContent ? (
            <img
              src={selectedPrimaryAsset.url || selectedPrimaryAsset.resourceContent}
              alt={selectedPrimaryAsset.name || selectedPrimaryAsset.resourceName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={32} className="text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Variants section */}
      {variants.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-[10px] text-gray-400 mb-2">变体 ({variants.length})</h4>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => (
              <div key={variant.id} className="flex flex-col gap-1">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
                  {variant.url || variant.resourceContent ? (
                    <img
                      src={variant.url || variant.resourceContent}
                      alt={variant.name || variant.resourceName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 text-center truncate">
                  {variant.name || variant.resourceName || '变体'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
