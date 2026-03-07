import { useState } from 'react';
import { X, Users, Plus, Search, Image, Video, Trash2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
}

export default function CharactersPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCharacters = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <div className="h-12 border-b border-gray-700 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">资产库</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-white rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索角色..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-7 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 border-b border-gray-700 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors">
          <Plus size={12} />
          <span>添加角色</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
          <Image size={12} />
          <span>导入</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCharacters.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">暂无角色</p>
            <p className="text-[10px] text-gray-600 mt-1">点击上方按钮添加角色</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCharacters.map((character) => (
              <div
                key={character.id}
                className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-600 rounded overflow-hidden shrink-0">
                  {character.imageUrl ? (
                    <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{character.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{character.description || '暂无描述'}</p>
                </div>
                <div className="flex gap-1">
                  {character.videoUrl && (
                    <Video size={12} className="text-gray-500" />
                  )}
                  <button className="p-1 text-gray-500 hover:text-blue-400">
                    <Edit size={12} />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="h-8 border-t border-gray-700 flex items-center justify-between px-3 text-[10px] text-gray-500">
        <span>角色: {characters.length}</span>
        <span>图片: 0</span>
        <span>视频: 0</span>
      </div>
    </div>
  );
}
