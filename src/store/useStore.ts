import { create } from 'zustand';
import {
    type Connection,
    type Edge,
    type EdgeChange,
    type Node,
    type NodeChange,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type NodeType = 'rectangle' | 'circle' | 'diamond' | 'parallelogram';
export type AppMode = 'mindmap' | 'flowchart';

export interface NodeData {
    title: string;
    content: string;
    shape: NodeType;
    color: string;
    url?: string;
    textAlign?: 'left' | 'center' | 'right';
}

interface MindMapState {
    nodes: Node<NodeData>[];
    edges: Edge[];
    isEditMode: boolean;
    appMode: AppMode;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (shape: NodeType, position: { x: number; y: number }) => void;
    updateNode: (id: string, data: Partial<NodeData>) => void;
    setNodes: (nodes: Node<NodeData>[]) => void;
    setEdges: (edges: Edge[]) => void;
    toggleEditMode: () => void;
    toggleAppMode: () => void;
    setEdgeType: (type: string) => void;
    edgeType: string;
    edgeColor: string;
    setEdgeColor: (color: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Auth States
    user: User | null;
    session: Session | null;
    initializeAuth: () => void;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;

    // Data States
    folders: any[];
    mindmaps: any[];
    currentMindmapId: string | null;
    fetchFolders: () => Promise<void>;
    fetchMindmaps: (folderId?: string | null) => Promise<void>;
    saveMindmap: (title: string, folderId?: string | null) => Promise<void>;
    loadMindmap: (id: string) => Promise<void>;
}

export const useStore = create<MindMapState>((set, get) => ({
    nodes: [
        {
            id: '1',
            type: 'custom',
            data: { title: '메인 아이디어', content: '설명을 입력하세요', shape: 'rectangle', color: '#ffffff', textAlign: 'left' },
            position: { x: 250, y: 50 },
        },
    ],
    edges: [],
    edgeType: 'bezier',
    edgeColor: '#b1b1b7',
    searchQuery: '',
    isEditMode: true,
    appMode: 'mindmap',

    user: null,
    session: null,
    folders: [],
    mindmaps: [],
    currentMindmapId: null,

    onNodesChange: (changes: NodeChange[]) => {
        if (!get().isEditMode) return;
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        if (!get().isEditMode) return;
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        if (!get().isEditMode) return;
        const { edgeColor, edgeType } = get();
        set({
            edges: addEdge(
                {
                    ...connection,
                    type: 'custom',
                    data: { pathType: edgeType },
                    style: { stroke: edgeColor }
                },
                get().edges
            ),
        });
    },
    addNode: (shape: NodeType, position: { x: number; y: number }) => {
        const id = Math.random().toString(36).substring(7);
        const newNode: Node<NodeData> = {
            id,
            type: 'custom',
            data: { title: '새 노드', content: '', shape, color: '#ffffff', textAlign: 'center' },
            position,
        };
        set({ nodes: [...get().nodes, newNode] });
    },
    updateNode: (id: string, data: Partial<NodeData>) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
        });
    },
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    toggleEditMode: () => set({ isEditMode: !get().isEditMode }),
    toggleAppMode: () => set({ appMode: get().appMode === 'mindmap' ? 'flowchart' : 'mindmap' }),
    setEdgeType: (type: string) => set({ edgeType: type }),
    setEdgeColor: (color: string) => set({ edgeColor: color }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),

    // Auth Actions
    initializeAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        set({ session, user: session?.user ?? null });

        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null });
        });
    },
    signInWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, currentMindmapId: null, nodes: [], edges: [] });
    },

    // Data Actions
    fetchFolders: async () => {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) set({ folders: data });
    },
    fetchMindmaps: async (folderId = null) => {
        let query = supabase.from('mindmaps').select('*').order('updated_at', { ascending: false });
        if (folderId) query = query.eq('folder_id', folderId);
        else query = query.is('folder_id', null);

        const { data, error } = await query;
        if (!error) set({ mindmaps: data });
    },
    saveMindmap: async (title, folderId = null) => {
        const { nodes, edges, currentMindmapId, user } = get();
        if (!user) return;

        const payload = {
            user_id: user.id,
            title,
            folder_id: folderId,
            nodes,
            edges,
            updated_at: new Date().toISOString()
        };

        if (currentMindmapId) {
            const { error } = await supabase
                .from('mindmaps')
                .update(payload)
                .eq('id', currentMindmapId);
            if (error) console.error('Error updating mindmap:', error);
        } else {
            const { data, error } = await supabase
                .from('mindmaps')
                .insert(payload)
                .select()
                .single();
            if (error) console.error('Error inserting mindmap:', error);
            else if (data) set({ currentMindmapId: data.id });
        }
    },
    loadMindmap: async (id) => {
        const { data, error } = await supabase
            .from('mindmaps')
            .select('*')
            .eq('id', id)
            .single();

        if (!error && data) {
            set({
                currentMindmapId: data.id,
                nodes: data.nodes as Node<NodeData>[],
                edges: data.edges as Edge[]
            });
        }
    }
}));
