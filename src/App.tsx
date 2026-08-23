import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useStore } from './store/useStore';
import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import Toolbar from './components/Toolbar';
import NodeSettings from './components/NodeSettings';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { Save, Home } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const Flow = ({ onBack }: { onBack: () => void }) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    searchQuery,
    isEditMode,
    saveMindmap,
    currentMindmapId,
    mindmaps,
    user
  } = useStore();

  const { setCenter } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const currentMap = mindmaps.find(m => m.id === currentMindmapId);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    const { x, y } = node.position;
    setCenter(x + 100, y + 60, { zoom: 1.5, duration: 800 });
  }, [setCenter]);

  useEffect(() => {
    if (searchQuery) {
      const match = nodes.find(n =>
        n.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.data.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (match) {
        setCenter(match.position.x + 100, match.position.y + 60, { zoom: 1.2, duration: 800 });
      }
    }
  }, [searchQuery, nodes, setCenter]);

  const handleSave = async () => {
    const title = currentMap?.title || prompt('저장할 제목을 입력하세요:')?.trim();
    if (!title) return;

    const saved = await saveMindmap(title);
    alert(saved
      ? '저장되었습니다.'
      : '저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
  };

  return (
    <div className="w-screen h-screen bg-white font-sans overflow-hidden flex flex-col">
      {/* Top Bar Navigation */}
      <header className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onBack}
            className="bg-white border border-gray-100 p-3 rounded-2xl shadow-xl hover:scale-105 transition-all text-gray-400 hover:text-blue-600"
            title="대시보드로 돌아가기"
          >
            <Home size={20} />
          </button>
          <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-xl">
            <h1 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {currentMap?.title || '신규 프로젝트'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-100"
          >
            <Save size={18} />
            저장하기
          </button>
          <div className="hidden sm:flex items-center gap-3 bg-white border border-gray-100 p-1 rounded-2xl shadow-xl">
            <img
              src={user?.user_metadata.avatar_url}
              alt="avatar"
              className="w-9 h-9 rounded-xl shadow-sm"
            />
            <div className="pr-4">
              <p className="text-xs font-black text-gray-900 leading-none">{user?.user_metadata.full_name?.split(' ')[0]}</p>
            </div>
          </div>
        </div>
      </header>

      <Toolbar />
      <NodeSettings selectedNode={selectedNode} />

      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid={true}
          snapGrid={[20, 20]}
          nodesDraggable={isEditMode}
          nodesConnectable={isEditMode}
          elementsSelectable={isEditMode}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#f1f5f9" />
          <Controls className="!bg-white !border-gray-100 !rounded-xl !shadow-lg" />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            maskColor="rgba(255, 255, 255, 0.4)"
            style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, initializeAuth, loadMindmap, resetMindmap } = useStore();
  const [view, setView] = useState<'dashboard' | 'flow'>('dashboard');

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        loadMindmap(id);
        setView('flow');
      }
    }
  }, [user, loadMindmap]);

  if (!user) return <Auth />;

  if (view === 'dashboard') {
    return <Dashboard onSelectMindmap={(id) => {
      loadMindmap(id);
      setView('flow');
    }} />;
  }

  // 대시보드로 나갈 때 편집 세션을 비운다. currentMindmapId가 남아 있으면
  // 다음 저장이 엉뚱한 마인드맵을 덮어쓴다.
  return <Flow onBack={() => { resetMindmap(); setView('dashboard'); }} />;
};

export default function App() {
  return (
    <ReactFlowProvider>
      <MainApp />
    </ReactFlowProvider>
  );
}
