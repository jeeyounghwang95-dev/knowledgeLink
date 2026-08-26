import {
    Square,
    Circle,
    Diamond,
    Forward,
    Search,
    Edit2,
    Check
} from 'lucide-react';
import { useReactFlow } from 'reactflow';
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
    const { screenToFlowPosition } = useReactFlow();

    /**
     * 새 노드는 지금 보고 있는 화면 한가운데에 놓는다.
     *
     * 예전에는 flow 좌표에 상수를 박아뒀는데, 그 좌표는 화면이 아니라 캔버스
     * 원점 기준이다. 그래서 사용자가 캔버스를 옮기거나 확대해 두면 새 노드가
     * 보이지 않는 엉뚱한 곳에 생겼다. 화면 중앙의 픽셀 좌표를 flow 좌표로
     * 변환해서 쓰면 확대/이동 상태와 무관하게 항상 보이는 곳에 생긴다.
     *
     * 캔버스 영역은 툴바 아래쪽이라 window 중앙과 다르다. 실제 pane의
     * 사각형을 재서 그 중앙을 쓴다.
     */
    const addNodeAtViewportCenter = (shape: NodeType) => {
        const pane = document.querySelector('.react-flow__renderer') ?? document.querySelector('.react-flow');
        const rect = pane?.getBoundingClientRect();
        const screenCenter = rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const center = screenToFlowPosition(screenCenter);

        // position 은 노드의 좌상단이다. 기본 크기의 절반만큼 당겨야
        // 노드가 중앙에 놓인 것처럼 보인다.
        const HALF_W = 110;
        const HALF_H = 40;

        // 연달아 추가할 때 완전히 겹쳐 한 개처럼 보이지 않도록 살짝 흩는다.
        const jitter = () => (Math.random() - 0.5) * 48;

        addNode(shape, {
            x: center.x - HALF_W + jitter(),
            y: center.y - HALF_H + jitter(),
        });
    };

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
                                onClick={() => addNodeAtViewportCenter(node.type)}
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
