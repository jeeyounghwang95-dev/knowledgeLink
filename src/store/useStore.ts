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

/** 휴지통 보관 기간(일). 이 기간이 지나면 영구 삭제된다. */
export const TRASH_RETENTION_DAYS = 30;

/** 영구 삭제까지 남은 일수. 0이면 다음 정리 때 지워진다. */
export const trashDaysLeft = (deletedAt: string) => {
    const elapsedDays = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86_400_000);
    return Math.max(0, TRASH_RETENTION_DAYS - elapsedDays);
};

// RLS에 막히면 error 없이 0건이 처리된다. saveMindmap과 같은 이유로 건수를 확인한다.
const changedOne = (data: unknown[] | null, error: unknown, what: string) => {
    if (error) {
        console.error('Error ' + what + ':', error);
        return false;
    }
    if (!data || data.length === 0) {
        console.error('Error ' + what + ': no row was affected');
        return false;
    }
    return true;
};

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

// 새 마인드맵의 시작 노드. 호출할 때마다 새 객체를 만들어
// 여러 마인드맵이 같은 노드 객체를 공유하지 않도록 한다.
const createDefaultNodes = (): Node<NodeData>[] => [
    {
        id: '1',
        type: 'custom',
        data: { title: '메인 아이디어', content: '설명을 입력하세요', shape: 'rectangle', color: '#ffffff', textAlign: 'left' },
        position: { x: 250, y: 50 },
    },
];

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
    currentFolderId: string | null;
    fetchFolders: () => Promise<void>;
    fetchMindmaps: (folderId?: string | null) => Promise<void>;
    /** 항상 새 행을 만든다. 편집 중인 마인드맵에는 손대지 않는다. 실패하면 null. */
    createMindmap: (title: string, folderId?: string | null) => Promise<string | null>;
    /** folderId를 넘기지 않으면 기존 소속 폴더를 그대로 둔다. 성공 여부를 반환. */
    saveMindmap: (title: string, folderId?: string | null) => Promise<boolean>;
    loadMindmap: (id: string) => Promise<void>;
    /** 편집 세션을 비우고 대시보드로 돌아갈 때 쓴다. */
    resetMindmap: () => void;

    // Trash States
    trashedMindmaps: any[];
    /** 제목만 바꾼다. 성공 여부를 반환. */
    renameMindmap: (id: string, title: string) => Promise<boolean>;
    /** 행을 지우지 않고 deleted_at만 찍는다. 30일간 휴지통에 남는다. */
    trashMindmap: (id: string) => Promise<boolean>;
    restoreMindmap: (id: string) => Promise<boolean>;
    /** 되돌릴 수 없다. 휴지통 화면에서만 호출한다. */
    deleteMindmapForever: (id: string) => Promise<boolean>;
    fetchTrash: () => Promise<void>;
    /** 보관 기간이 지난 항목을 실제로 지운다. 대시보드 진입 시 한 번 돌린다. */
    purgeExpiredTrash: () => Promise<void>;
}

export const useStore = create<MindMapState>((set, get) => ({
    nodes: createDefaultNodes(),
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
    trashedMindmaps: [],
    currentMindmapId: null,
    currentFolderId: null,

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
        set({
            user: null,
            session: null,
            currentMindmapId: null,
            currentFolderId: null,
            nodes: createDefaultNodes(),
            edges: [],
        });
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
        // 휴지통에 있는 항목은 대시보드에 나오면 안 된다.
        let query = supabase
            .from('mindmaps')
            .select('*')
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });
        if (folderId) query = query.eq('folder_id', folderId);
        else query = query.is('folder_id', null);

        const { data, error } = await query;
        if (!error) set({ mindmaps: data });
    },
    createMindmap: async (title, folderId = null) => {
        const { user } = get();
        if (!user) return null;

        const { data, error } = await supabase
            .from('mindmaps')
            .insert({
                user_id: user.id,
                title,
                folder_id: folderId,
                nodes: createDefaultNodes(),
                edges: [],
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error || !data) {
            console.error('Error creating mindmap:', error);
            return null;
        }
        return data.id as string;
    },
    saveMindmap: async (title, folderId) => {
        const { nodes, edges, currentMindmapId, currentFolderId, user } = get();
        if (!user) return false;

        if (currentMindmapId) {
            // folderId를 명시적으로 넘긴 경우에만 소속 폴더를 바꾼다.
            // 넘기지 않았는데 null을 써 넣으면 폴더 안의 맵이 루트로 튀어나온다.
            const payload = {
                title,
                nodes,
                edges,
                updated_at: new Date().toISOString(),
                ...(folderId !== undefined ? { folder_id: folderId } : {}),
            };

            const { data, error } = await supabase
                .from('mindmaps')
                .update(payload)
                .eq('id', currentMindmapId)
                .select('id');

            if (error) {
                console.error('Error updating mindmap:', error);
                return false;
            }
            // RLS에 막히면 error 없이 0건이 갱신된다. 이걸 성공으로 보면 안 된다.
            if (!data || data.length === 0) {
                console.error('Error updating mindmap: no row was updated', currentMindmapId);
                return false;
            }
            if (folderId !== undefined) set({ currentFolderId: folderId });
            return true;
        }

        const { data, error } = await supabase
            .from('mindmaps')
            .insert({
                user_id: user.id,
                title,
                folder_id: folderId ?? currentFolderId,
                nodes,
                edges,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error || !data) {
            console.error('Error inserting mindmap:', error);
            return false;
        }
        set({ currentMindmapId: data.id, currentFolderId: data.folder_id ?? null });
        return true;
    },
    loadMindmap: async (id) => {
        const { data, error } = await supabase
            .from('mindmaps')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (!error && data) {
            set({
                currentMindmapId: data.id,
                currentFolderId: data.folder_id ?? null,
                nodes: (data.nodes ?? createDefaultNodes()) as Node<NodeData>[],
                edges: (data.edges ?? []) as Edge[],
            });
        }
    },
    // Trash Actions
    renameMindmap: async (id, title) => {
        const { data, error } = await supabase
            .from('mindmaps')
            .update({ title, updated_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null)
            .select('id');

        if (!changedOne(data, error, 'renaming mindmap')) return false;
        set({ mindmaps: get().mindmaps.map(m => (m.id === id ? { ...m, title } : m)) });
        return true;
    },
    trashMindmap: async (id) => {
        const { data, error } = await supabase
            .from('mindmaps')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null)
            .select('id');

        if (!changedOne(data, error, 'trashing mindmap')) return false;
        set({ mindmaps: get().mindmaps.filter(m => m.id !== id) });
        // 편집 중이던 맵을 버렸다면 세션도 비운다. 안 그러면 다음 저장이 되살린다.
        if (get().currentMindmapId === id) set({ currentMindmapId: null, currentFolderId: null });
        return true;
    },
    restoreMindmap: async (id) => {
        const { data, error } = await supabase
            .from('mindmaps')
            .update({ deleted_at: null })
            .eq('id', id)
            .select('id');

        if (!changedOne(data, error, 'restoring mindmap')) return false;
        set({ trashedMindmaps: get().trashedMindmaps.filter(m => m.id !== id) });
        return true;
    },
    deleteMindmapForever: async (id) => {
        const { data, error } = await supabase
            .from('mindmaps')
            .delete()
            .eq('id', id)
            .select('id');

        if (!changedOne(data, error, 'deleting mindmap')) return false;
        set({ trashedMindmaps: get().trashedMindmaps.filter(m => m.id !== id) });
        return true;
    },
    fetchTrash: async () => {
        const { data, error } = await supabase
            .from('mindmaps')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });
        if (!error) set({ trashedMindmaps: data ?? [] });
    },
    purgeExpiredTrash: async () => {
        const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 86_400_000).toISOString();
        const { error } = await supabase
            .from('mindmaps')
            .delete()
            .not('deleted_at', 'is', null)
            .lt('deleted_at', cutoff);
        if (error) console.error('Error purging expired trash:', error);
    },
    resetMindmap: () => set({
        currentMindmapId: null,
        currentFolderId: null,
        nodes: createDefaultNodes(),
        edges: [],
    }),
}));
