import { 
  PanelLeftClose, 
  PanelLeft, 
  Image, 
  Video, 
  Wand2, 
  Film, 
  Eye, 
  HardDrive,
  Layers,
  FileText,
  Users,
  Mountain,
  Clapperboard,
  GitCompare,
  Sparkles,
  BookOpen,
  Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../App';
import type { NodeType } from '../../stores/canvasStore';

interface SidebarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddNode?: (type: NodeType) => void;
}

interface NodeCategory {
  name: string;
  nameKey: string;
  items: { type: NodeType; labelKey: string; icon: React.ReactNode }[];
}

const nodeCategories: NodeCategory[] = [
  {
    name: 'Input',
    nameKey: 'nodes.category.input',
    items: [
      { type: 'imageInput', labelKey: 'nodes.imageInput', icon: <Image className="w-4 h-4" /> },
      { type: 'videoInput', labelKey: 'nodes.videoInput', icon: <Video className="w-4 h-4" /> },
      { type: 'textNode', labelKey: 'nodes.textNode', icon: <FileText className="w-4 h-4" /> },
      { type: 'novelInput', labelKey: 'nodes.novelInput', icon: <BookOpen className="w-4 h-4" /> },
    ],
  },
  {
    name: 'AI Generation',
    nameKey: 'nodes.category.ai',
    items: [
      { type: 'aiImage', labelKey: 'nodes.aiImage', icon: <Wand2 className="w-4 h-4" /> },
      { type: 'aiVideo', labelKey: 'nodes.aiVideo', icon: <Film className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Storyboard',
    nameKey: 'nodes.category.storyboard',
    items: [
      { type: 'storyboardNode', labelKey: 'nodes.storyboardNode', icon: <Clapperboard className="w-4 h-4" /> },
      { type: 'videoAnalyze', labelKey: 'nodes.videoAnalyze', icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Character/Scene',
    nameKey: 'nodes.category.character',
    items: [
      { type: 'characterDescription', labelKey: 'nodes.characterDescription', icon: <Users className="w-4 h-4" /> },
      { type: 'sceneDescription', labelKey: 'nodes.sceneDescription', icon: <Mountain className="w-4 h-4" /> },
      { type: 'createCharacter', labelKey: 'nodes.createCharacter', icon: <Users className="w-4 h-4" /> },
      { type: 'createScene', labelKey: 'nodes.createScene', icon: <Mountain className="w-4 h-4" /> },
    ],
  },
  {
    name: 'Tools',
    nameKey: 'nodes.category.tools',
    items: [
      { type: 'imageCompare', labelKey: 'nodes.imageCompare', icon: <GitCompare className="w-4 h-4" /> },
      { type: 'preview', labelKey: 'nodes.preview', icon: <Eye className="w-4 h-4" /> },
      { type: 'saveLocal', labelKey: 'nodes.saveLocal', icon: <HardDrive className="w-4 h-4" /> },
    ],
  },
];

export default function Sidebar({ 
  viewMode, 
  onViewChange, 
  collapsed, 
  onToggleCollapse,
  onAddNode 
}: SidebarProps) {
  const { t } = useTranslation();

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = (e: React.MouseEvent, nodeType: NodeType) => {
    e.preventDefault();
    if (onAddNode) {
      onAddNode(nodeType);
    }
  };

  return (
    <aside 
      className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-200 ${
        collapsed ? 'w-12' : 'w-64'
      }`}
    >
      <div className="p-2 flex justify-end">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          {nodeCategories.map((category) => (
            <div key={category.name} className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                <Layers className="w-3 h-3" />
                {t(category.nameKey)}
              </div>
              
              <div className="mt-2 space-y-1">
                {category.items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    onClick={(e) => handleClick(e, item.type)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600
                             rounded-md cursor-grab text-sm text-gray-300 hover:text-white
                             transition-colors"
                  >
                    {item.icon}
                    <span>{t(item.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
