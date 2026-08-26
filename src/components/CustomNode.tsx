import React, { memo } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from 'reactflow';
import { Globe, Plus } from 'lucide-react';
import { type NodeData, useStore } from '../store/useStore';
import { isDarkColor } from './ColorPalette';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {

    return twMerge(clsx(inputs));
}

const LinkPreview = ({ url }: { url: string }) => {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="nodrag block mt-2 w-full max-w-[192px] bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
            <div className="h-24 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                <img
                    src={`https://api.microlink.io?url=${encodeURIComponent(url)}&embed=screenshot.url`}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                <Globe size={24} className="text-gray-300 absolute" />
            </div>
            <div className="p-2 text-left">
                <p className="text-[10px] font-bold text-gray-800 truncate">{url.replace(/^https?:\/\//, '')}</p>
                <p className="text-[8px] text-gray-400 mt-1 truncate">Click to visit site</p>
            </div>
        </a>
    );
};

// SVG Shape Components
const ShapeBackground = ({ shape, color, selected }: { shape: string; color: string; selected: boolean }) => {
    const commonProps = {
        fill: color,
        stroke: selected ? '#3b82f6' : '#e2e8f0',
        strokeWidth: selected ? "3" : "1",
        className: "transition-colors duration-200"
    };

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            {shape === 'circle' && <ellipse cx="50" cy="50" rx="48" ry="48" {...commonProps} />}
            {shape === 'diamond' && <path d="M 50 2 L 98 50 L 50 98 L 2 50 Z" {...commonProps} />}
            {shape === 'parallelogram' && <path d="M 20 2 L 98 2 L 80 98 L 2 98 Z" {...commonProps} />}
            {(shape === 'rectangle' || !shape) && <rect x="1" y="1" width="98" height="98" rx="8" ry="8" {...commonProps} />}
        </svg>
    );
};

const CustomNode = ({ id, data, selected }: { data: NodeData; id: string; selected: boolean }) => {
    const { searchQuery, isEditMode, updateNode, setNodeSize, addNode, appMode } = useStore();
    const reactFlowInstance = useReactFlow();

    const isHighlighted = searchQuery && (
        data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onQuickConnect = (e: React.MouseEvent) => {
        e.stopPropagation();
        const node = reactFlowInstance.getNode(id);
        if (node) {
            const { x, y } = node.position;
            addNode('rectangle', { x: x + 250, y: y });
        }
    };

    const showTitle = appMode === 'mindmap' && data.shape === 'rectangle';

    // 크기를 직접 정한 노드는 그 상자를 꽉 채우고, 아니면 내용에 맞춰 늘어난다.
    // 폭이 정해지면 본문은 그 폭에서 줄바꿈되고, 높이가 정해지면 넘치는 만큼 잘린다.
    const hasFixedWidth = typeof data.width === 'number';
    const hasFixedHeight = typeof data.height === 'number';
    const isDarkBg = isDarkColor(data.color || '#ffffff');

    return (
        <div
            className={cn(
                "flex flex-col p-6 relative group/node",
                // 자동 크기일 때만 폭/높이 한계를 건다. 직접 정한 크기가 이기게 둔다.
                !hasFixedWidth && "min-w-[200px] max-w-[320px]",
                !hasFixedHeight && "min-h-[80px]",
                hasFixedHeight && "overflow-hidden",
                !isEditMode && 'cursor-default',
                isHighlighted && 'ring-4 ring-yellow-300 rounded-xl'
            )}
            style={{
                width: hasFixedWidth || appMode === 'flowchart' ? '100%' : 'auto',
                height: hasFixedHeight || appMode === 'flowchart' ? '100%' : 'auto'
            }}
        >
            {/* 크기 조절 핸들. 마인드맵과 순서도 모두에서 쓴다. */}
            {isEditMode && (
                <NodeResizer
                    isVisible={selected}
                    minWidth={120}
                    minHeight={60}
                    onResize={(_, params) => setNodeSize(id, {
                        width: Math.round(params.width),
                        height: Math.round(params.height),
                    })}
                    handleClassName="!bg-blue-500 !border-white !w-2.5 !h-2.5 !rounded-sm"
                    lineClassName="!border-blue-400"
                />
            )}

            {/* Shape Background */}
            <ShapeBackground shape={data.shape} color={data.color} selected={selected} />

            {/* 4-Way Handles */}
            {isEditMode && (
                <>
                    {/* Top Handles */}
                    <Handle type="target" position={Position.Top} id="t-t" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    <Handle type="source" position={Position.Top} id="t-s" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />

                    {/* Bottom Handles */}
                    <Handle type="target" position={Position.Bottom} id="b-t" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    <Handle type="source" position={Position.Bottom} id="b-s" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />

                    {/* Left Handles */}
                    <Handle type="target" position={Position.Left} id="l-t" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    <Handle type="source" position={Position.Left} id="l-s" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />

                    {/* Right Handles */}
                    <Handle type="target" position={Position.Right} id="r-t" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    <Handle type="source" position={Position.Right} id="r-s" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !z-50 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                </>
            )}

            {/* Quick Connect Button */}
            {isEditMode && selected && (
                <button
                    onClick={onQuickConnect}
                    className="absolute -right-12 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 opacity-0 group-hover/node:opacity-100 animate-in fade-in"
                    title="신규 노드 연결"
                >
                    <Plus size={18} />
                </button>
            )}

            <div
                className={cn(
                    "flex flex-col w-full min-h-0 relative z-20 pointer-events-none",
                    hasFixedHeight && "overflow-hidden",
                    !showTitle && "justify-center items-center"
                )}
                // 진한 배경을 고르면 기본 회색 글씨가 묻힌다. 밝은 글씨로 뒤집는다.
                style={isDarkBg ? { color: '#f8fafc' } : undefined}
            >
                {showTitle && (
                    <div className="w-full pointer-events-auto mt-1">
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => updateNode(id, { title: e.target.value })}
                            readOnly={!isEditMode}
                            className={cn(
                                "w-full bg-transparent border-none focus:outline-none font-bold text-lg placeholder-gray-300 mb-0.5 px-1",
                                isDarkBg ? "text-slate-50" : "text-gray-800",
                                !isEditMode && "cursor-default"
                            )}
                            style={{ textAlign: data.textAlign as any || 'center' }}
                            placeholder="제목"
                        />

                        <hr className={cn("mb-2", isDarkBg ? "border-white/25" : "border-gray-200/50")} />
                    </div>
                )}


                <div
                    className="nodrag nowheel w-full pointer-events-auto flex flex-col node-quill-container"
                    style={{ textAlign: data.textAlign as any || 'center' }}
                >
                    {/*
                        여기는 블록 레이아웃이어야 한다.
                        - flex 컨테이너 안에서는 인라인 레이아웃이 일어나지 않아
                          <br>이 무시되고 빈 문단이 0px로 눌린다.
                        - ql-snow는 툴바/툴팁 스킨용 클래스라 본문 서식이 붙지 않는다.
                          문단 여백은 index.css의 .node-text-content 규칙이 담당한다.
                        가로 정렬은 상위 컨테이너의 text-align이 처리한다.
                    */}
                    <div
                        className={cn(
                            "w-full bg-transparent border-none text-sm node-text-content whitespace-pre-wrap break-words",
                            !isEditMode && "read-only-editor"
                        )}
                        // 폭은 항상 노드 폭을 따른다. 노드를 줄이면 그 폭에서 다시 접힌다.
                        style={{ padding: 0, textAlign: 'inherit', color: 'inherit' }}
                        dangerouslySetInnerHTML={{ __html: data.content || '<p><br></p>' }}
                    />
                </div>



                {data.url && <div className="pointer-events-auto"><LinkPreview url={data.url} /></div>}
            </div>
        </div>

    );
};

export default memo(CustomNode);
