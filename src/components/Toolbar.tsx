import {
    Square,
    Circle,
    Diamond,
    Forward,
    Search,
    Edit2,
    Check
} from 'lucide-react';
import { useStore, type NodeType } from '../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Toolbar = () => {
    const {
        addNode,
        edgeType,
        setEdgeType,
        edgeColor,
        setEdgeColor,
        searchQuery,
        setSearchQuery,
        isEditMode,
        toggleEditMode,
        appMode,
        toggleAppMode
    } = useStore();

    const nodeTypes: { type: NodeType; icon: any; label: string }[] = [
        { type: 'rectangle', icon: Square, label: '프로세스' },
        { type: 'circle', icon: Circle, label: '시작/종료' },
        { type: 'diamond', icon: Diamond, label: '조건' },
        { type: 'parallelogram', icon: Forward, label: '입출력' },
    ];

    // Filter nodes based on mode: In Mindmap mode, only show rectangle
    const visibleNodeTypes = appMode === 'mindmap'
        ? nodeTypes.filter(n => n.type === 'rectangle')
        : nodeTypes;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl transition-all">
            {/* Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
                <button
                    onClick={() => appMode !== 'mindmap' && toggleAppMode()}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        appMode === 'mindmap' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    마인드맵
                </button>
                <button
                    onClick={() => appMode !== 'flowchart' && toggleAppMode()}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        appMode === 'flowchart' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    순서도
                </button>
            </div>

            {/* Edit Mode Toggle */}
            <button
                onClick={toggleEditMode}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 border-l border-gray-200 ml-2 text-sm font-medium transition-all group",
                    isEditMode ? "text-blue-500" : "text-gray-400"
                )}
            >
                {isEditMode ? <Check size={16} /> : <Edit2 size={16} />}
                {isEditMode ? "수정 중" : "수정하기"}
            </button>

            {/* Search Bar */}
            <div className="relative flex items-center border-l border-gray-200 pl-4">
                <Search className="absolute left-7 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="노드 검색..."
                    className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-40 transition-all focus:w-56"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isEditMode && (
                <>
                    {/* Node Addition */}
                    <div className="flex items-center gap-1 border-l border-gray-200 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        {visibleNodeTypes.map((node) => (
                            <button
                                key={node.type}
                                onClick={() => addNode(node.type, { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 })}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                                title={node.label}
                            >
                                <node.icon size={18} className="text-gray-600 group-hover:text-blue-500" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {node.label} 추가
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Edge Settings */}
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4 animate-in fade-in slide-in-from-left-2 duration-500">
                        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                            {[
                                { id: 'bezier', label: '곡선' },
                                { id: 'straight', label: '직선' },
                                { id: 'step', label: '꺾은선' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setEdgeType(type.id)}
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                        edgeType === type.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative group flex items-center">
                            <input
                                type="color"
                                value={edgeColor}
                                onChange={(e) => setEdgeColor(e.target.value)}
                                className="w-6 h-6 rounded-lg overflow-hidden border-2 border-white shadow-sm cursor-pointer bg-transparent"
                                title="연결선 색상"
                            />
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};

export default Toolbar;
