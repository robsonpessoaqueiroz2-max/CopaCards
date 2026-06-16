import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          selecao_favorita: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          selecao_favorita?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          selecao_favorita?: string | null;
        };
      };
      figurinhas: {
        Row: {
          id: string;
          user_id: string;
          nome_atleta: string;
          selecao: string;
          posicao: string | null;
          numero_camisa: number | null;
          imagem_url: string | null;
          status: 'tenho' | 'quero' | 'repetida';
          descricao: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome_atleta: string;
          selecao: string;
          posicao?: string | null;
          numero_camisa?: number | null;
          imagem_url?: string | null;
          status: 'tenho' | 'quero' | 'repetida';
          descricao?: string | null;
          created_at?: string;
        };
        Update: {
          nome_atleta?: string;
          selecao?: string;
          posicao?: string | null;
          numero_camisa?: number | null;
          imagem_url?: string | null;
          status?: 'tenho' | 'quero' | 'repetida';
          descricao?: string | null;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          figurinha_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          figurinha_id: string;
          created_at?: string;
        };
      };
      comentarios: {
        Row: {
          id: string;
          user_id: string;
          figurinha_id: string;
          conteudo: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          figurinha_id: string;
          conteudo: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
      };
      mensagens: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          conteudo: string;
          created_at: string;
          lida: boolean;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          conteudo: string;
          created_at?: string;
          lida?: boolean;
        };
        Update: {
          lida?: boolean;
        };
      };
    };
  };
};
