-- =====================================================
-- CopaCards — Script SQL Completo
-- Execute no Supabase SQL Editor (em ordem)
-- =====================================================

-- =====================================================
-- 1. TABELA: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT DEFAULT '',
  bio TEXT,
  selecao_favorita TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. TABELA: figurinhas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.figurinhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_atleta TEXT NOT NULL,
  selecao TEXT NOT NULL,
  posicao TEXT,
  numero_camisa INTEGER,
  imagem_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('tenho', 'quero', 'repetida')),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. TABELA: likes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  figurinha_id UUID NOT NULL REFERENCES public.figurinhas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, figurinha_id)
);

-- =====================================================
-- 4. TABELA: comentarios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  figurinha_id UUID NOT NULL REFERENCES public.figurinhas(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. TABELA: follows
-- =====================================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- =====================================================
-- 6. TABELA: mensagens
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  lida BOOLEAN DEFAULT false
);

-- =====================================================
-- 7. TRIGGER: criar perfil ao registrar usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.email, '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. FUNÇÃO: deletar conta (chamada via RPC)
-- =====================================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figurinhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: profiles
-- =====================================================
DROP POLICY IF EXISTS "Perfis públicos" ON public.profiles;
CREATE POLICY "Perfis públicos"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Inserir próprio perfil" ON public.profiles;
CREATE POLICY "Inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Editar próprio perfil" ON public.profiles;
CREATE POLICY "Editar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Deletar próprio perfil" ON public.profiles;
CREATE POLICY "Deletar próprio perfil"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- POLICIES: figurinhas
-- =====================================================
-- Permitir que QUALQUER usuário autenticado veja TODAS as figurinhas
DROP POLICY IF EXISTS "Ver figurinhas" ON public.figurinhas;
CREATE POLICY "Ver figurinhas"
  ON public.figurinhas FOR SELECT
  USING (true);

-- Permitir que usuários criem suas próprias figurinhas
DROP POLICY IF EXISTS "Criar figurinha" ON public.figurinhas;
CREATE POLICY "Criar figurinha"
  ON public.figurinhas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários editem apenas suas próprias figurinhas
DROP POLICY IF EXISTS "Editar figurinha" ON public.figurinhas;
CREATE POLICY "Editar figurinha"
  ON public.figurinhas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários deletem apenas suas próprias figurinhas
DROP POLICY IF EXISTS "Deletar figurinha" ON public.figurinhas;
CREATE POLICY "Deletar figurinha"
  ON public.figurinhas FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES: likes
-- =====================================================
-- Permitir que QUALQUER usuário veja TODOS os likes
DROP POLICY IF EXISTS "Ver likes" ON public.likes;
CREATE POLICY "Ver likes"
  ON public.likes FOR SELECT
  USING (true);

-- Permitir que usuários autenticados curtam figurinhas
DROP POLICY IF EXISTS "Curtir" ON public.likes;
CREATE POLICY "Curtir"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários removam apenas seus próprios likes
DROP POLICY IF EXISTS "Descurtir" ON public.likes;
CREATE POLICY "Descurtir"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES: comentarios
-- =====================================================
-- Permitir que QUALQUER usuário veja TODOS os comentários
DROP POLICY IF EXISTS "Ver comentários" ON public.comentarios;
CREATE POLICY "Ver comentários"
  ON public.comentarios FOR SELECT
  USING (true);

-- Permitir que usuários autenticados comentem
DROP POLICY IF EXISTS "Comentar" ON public.comentarios;
CREATE POLICY "Comentar"
  ON public.comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários deletem apenas seus próprios comentários
DROP POLICY IF EXISTS "Deletar próprio comentário" ON public.comentarios;
CREATE POLICY "Deletar próprio comentário"
  ON public.comentarios FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES: follows
-- =====================================================
DROP POLICY IF EXISTS "Ver follows" ON public.follows;
CREATE POLICY "Ver follows"
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Seguir" ON public.follows;
CREATE POLICY "Seguir"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Deixar de seguir" ON public.follows;
CREATE POLICY "Deixar de seguir"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- POLICIES: mensagens
-- =====================================================
DROP POLICY IF EXISTS "Ver próprias mensagens" ON public.mensagens;
CREATE POLICY "Ver próprias mensagens"
  ON public.mensagens FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Enviar mensagem" ON public.mensagens;
CREATE POLICY "Enviar mensagem"
  ON public.mensagens FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Marcar como lida" ON public.mensagens;
CREATE POLICY "Marcar como lida"
  ON public.mensagens FOR UPDATE
  USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Deletar própria mensagem" ON public.mensagens;
CREATE POLICY "Deletar própria mensagem"
  ON public.mensagens FOR DELETE
  USING (auth.uid() = sender_id);

-- =====================================================
-- 10. STORAGE: bucket figurinhas
-- (Executar separadamente ou via dashboard)
-- =====================================================
-- No Supabase Dashboard → Storage → New Bucket:
-- Name: figurinhas
-- Public: YES (marcar como público)
--
-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('figurinhas', 'figurinhas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "Leitura pública" ON storage.objects;
CREATE POLICY "Leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'figurinhas');

DROP POLICY IF EXISTS "Upload autenticado" ON storage.objects;
CREATE POLICY "Upload autenticado"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'figurinhas' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Update autenticado" ON storage.objects;
CREATE POLICY "Update autenticado"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'figurinhas' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Delete autenticado" ON storage.objects;
CREATE POLICY "Delete autenticado"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'figurinhas' AND auth.uid() = owner);

-- =====================================================
-- 11. REALTIME: habilitar para mensagens
-- =====================================================
-- No Supabase Dashboard → Database → Replication
-- Habilitar para a tabela: mensagens
--
-- Ou via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
