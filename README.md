# CopaCards — Rede Social de Figurinhas da Copa do Mundo

Uma rede social para colecionadores de figurinhas digitais de atletas da Copa do Mundo. Compartilhe, colecione e interaja com figurinhas no estilo álbum digital.

---

## Stack

- **Frontend**: Vite + React + TypeScript
- **UI**: Tailwind CSS v4 com design system personalizado (Brasil)
- **Backend/Auth/DB/Storage**: Supabase
- **Deploy**: Vercel

---

## Funcionalidades

- Autenticação completa (cadastro, login, recuperação de senha)
- Feed social com curtidas, comentários e interações
- Figurinhas digitais com visual de álbum estilo Copa
- Perfil de usuário com avatar, bio e seleção favorita
- Sistema de seguidores/seguindo
- Chat/mensagens privadas em tempo real (Supabase Realtime)
- Modo claro e escuro
- Design responsivo (mobile-first)
- Paleta Brasil: Verde #009739, Amarelo #FEDD00, Azul #012169

---

## Instalação Local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/copacards.git
cd copacards
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Como obter os valores:**
1. Acesse [app.supabase.com](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie a **Project URL** → `VITE_SUPABASE_URL`
5. Copie a **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 4. Configure o Supabase

Execute o script SQL no **SQL Editor** do Supabase:

1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor → New Query**
3. Cole o conteúdo de `supabase_setup.sql`
4. Clique em **Run**

### 5. Configure autenticação

No Supabase Dashboard:
- **Auth → Email** → Desabilitar "Email Confirmations"
- **Auth → URL Configuration → Redirect URLs** → Adicionar a URL do Vercel: `https://seu-projeto.vercel.app/reset-password`

### 6. Configure o Storage

O script SQL já cria o bucket automaticamente. Se preferir manualmente:
1. Vá em **Storage → New Bucket**
2. Nome: `figurinhas`
3. Marque como **Public**

### 7. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

---

## Deploy na Vercel

### 1. Importe o projeto

1. Acesse [vercel.com](https://vercel.com/)
2. Clique em **Add New → Project**
3. Importe seu repositório GitHub

### 2. Configure as variáveis de ambiente

No painel da Vercel, em **Settings → Environment Variables**, adicione:

```
VITE_SUPABASE_URL = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
```

### 3. Deploy

Clique em **Deploy**. A Vercel irá executar `npm run build` automaticamente.

### 4. Configure o Redirect URL no Supabase

Após o deploy, copie a URL da Vercel e adicione em:
**Supabase → Auth → URL Configuration → Redirect URLs**:
```
https://seu-projeto.vercel.app/reset-password
```

---

## Estrutura do Projeto

```
src/
  components/
    ui/           # Componentes base (Button, Input, Modal, Avatar, Toast)
    FigurinhaCard/ # Card visual + formulário de figurinha
    Feed/          # Post do feed com curtidas e comentários
    Header/        # Header fixo com menu sanduíche
  pages/
    Login.tsx
    Cadastro.tsx
    ResetPassword.tsx
    Feed.tsx
    Perfil.tsx
    Mensagens.tsx
  lib/
    supabase.ts    # Cliente Supabase + tipos
  hooks/
    useAuth.ts     # Auth state + métodos
    useFeed.ts     # Feed de figurinhas
    useProfile.ts  # Perfil + follows
  App.tsx          # Rotas principais
  main.tsx
```

---

## Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (criados via trigger) |
| `figurinhas` | Cards digitais de atletas |
| `likes` | Curtidas nas figurinhas |
| `comentarios` | Comentários nas figurinhas |
| `follows` | Sistema de seguidores |
| `mensagens` | Chat privado em tempo real |

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado com políticas específicas:
- Leitura pública de figurinhas e perfis
- Escrita apenas pelo próprio usuário
- Mensagens visíveis apenas para remetente e destinatário

---

## Paleta de Cores Brasil

```css
--verde-brasil: #009739;
--amarelo: #FEDD00;
--azul: #012169;
--branco: #FFFFFF;
--escuro: #0F172A;
```

---

## Licença

MIT — Desenvolvido com muito futebol e café.
