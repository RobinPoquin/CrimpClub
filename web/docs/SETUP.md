# ClimbLog — Guide de setup complet

## Stack choisie

| Couche | MVP (inclus) | Production |
|---|---|---|
| Frontend | React + Vite | React + Vite |
| Auth | localStorage | **Supabase Auth** |
| Base de données | localStorage | **Supabase PostgreSQL** |
| Stockage médias | — | **Supabase Storage** |
| Déploiement | — | **Vercel** |
| Domaine | — | Namecheap / OVH |

---

## 1. Lancer le MVP (localStorage)

```bash
npm install
npm run dev
# → http://localhost:5173
```

Aucune dépendance externe. Les données sont stockées dans le navigateur.

---

## 2. Passer en production avec Supabase

### 2.1 Créer un projet Supabase

1. Aller sur [https://supabase.com](https://supabase.com) → New project
2. Choisir une région Europe (Frankfurt recommandé)
3. Noter les valeurs suivantes (Settings → API) :
   - `VITE_SUPABASE_URL` = `https://xxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJ...`

Créer un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 2.2 Installer le client Supabase

```bash
npm install @supabase/supabase-js
```

Créer `src/lib/supabase.js` :

```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 3. Schéma de base de données

Coller ce SQL dans l'éditeur SQL de Supabase (Database → SQL Editor → New query).

```sql
-- ══════════════════════════════════════════════
-- TABLE : profiles
-- Informations publiques du grimpeur
-- ══════════════════════════════════════════════
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Crée un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ══════════════════════════════════════════════
-- TABLE : locations
-- Salles et sites extérieurs (partagés entre users)
-- ══════════════════════════════════════════════
create table public.locations (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  is_outdoor  boolean default false,
  country     text,
  region      text,
  lat         float,
  lng         float,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- Index full-text pour la recherche
create index locations_name_idx on public.locations using gin(to_tsvector('french', name));


-- ══════════════════════════════════════════════
-- TABLE : ascents
-- Cœur de l'app — chaque ascension enregistrée
-- ══════════════════════════════════════════════
create table public.ascents (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,

  -- Informations voie
  route_name    text,
  grade         text not null,          -- ex: "7a", "6B+"
  type          text not null,          -- Bloc | Diff | Trad | Grande voie | SAE
  result        text not null,          -- À vue | Flash | Travaillé | Projet

  -- Lieu
  location_id   uuid references public.locations(id),
  location_name text,                   -- Champ libre si location non en BDD
  is_outdoor    boolean default false,

  -- Détails
  date          date not null,
  comment       text,

  -- Médias (URLs Supabase Storage)
  photo_urls    text[],                 -- tableau d'URLs photos
  video_urls    text[],                 -- tableau d'URLs vidéos

  -- Métadonnées
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index pour les requêtes fréquentes
create index ascents_user_id_idx on public.ascents(user_id);
create index ascents_date_idx on public.ascents(date desc);
create index ascents_type_idx on public.ascents(type);


-- ══════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Chaque user ne voit et ne modifie que ses données
-- ══════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.ascents  enable row level security;
alter table public.locations enable row level security;

-- Profiles : lecture publique, écriture propriétaire
create policy "Profiles publics en lecture"
  on public.profiles for select using (true);

create policy "Chaque user modifie son profil"
  on public.profiles for all using (auth.uid() = id);

-- Ascents : privées par défaut
create policy "Chaque user voit ses ascensions"
  on public.ascents for select using (auth.uid() = user_id);

create policy "Chaque user crée ses ascensions"
  on public.ascents for insert with check (auth.uid() = user_id);

create policy "Chaque user modifie ses ascensions"
  on public.ascents for update using (auth.uid() = user_id);

create policy "Chaque user supprime ses ascensions"
  on public.ascents for delete using (auth.uid() = user_id);

-- Locations : lecture publique, création authentifiée
create policy "Locations publiques en lecture"
  on public.locations for select using (true);

create policy "Utilisateurs connectés créent des lieux"
  on public.locations for insert with check (auth.uid() is not null);


-- ══════════════════════════════════════════════
-- TRIGGER : updated_at auto
-- ══════════════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ascents_updated_at
  before update on public.ascents
  for each row execute procedure public.set_updated_at();
```

---

## 4. Remplacer auth.js par Supabase Auth

Remplacer le contenu de `src/lib/auth.js` :

```js
import { supabase } from "./supabase";

export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
```

---

## 5. Remplacer db.js par Supabase DB

Remplacer le contenu de `src/lib/db.js` :

```js
import { supabase } from "./supabase";

export async function getAscents(userId) {
  const { data, error } = await supabase
    .from("ascents")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addAscent(userId, formData) {
  const { data, error } = await supabase
    .from("ascents")
    .insert({
      user_id:       userId,
      route_name:    formData.routeName,
      grade:         formData.grade,
      type:          formData.type,
      result:        formData.result,
      is_outdoor:    formData.outdoor,
      location_name: formData.location,
      date:          formData.date,
      comment:       formData.comment,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAscent(id) {
  const { error } = await supabase.from("ascents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

---

## 6. Upload de médias (Supabase Storage)

### 6.1 Créer le bucket dans Supabase

Dashboard → Storage → New bucket → `media` (public : non)

### 6.2 Politique d'accès

```sql
-- Chaque user accède uniquement à son dossier
create policy "Upload media propriétaire"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Lecture media propriétaire"
  on storage.objects for select
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 6.3 Fonction d'upload dans le code

```js
// src/lib/storage.js
import { supabase } from "./supabase";

export async function uploadMedia(userId, file, type = "photo") {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${type}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
```

---

## 7. Déploiement sur Vercel

```bash
npm install -g vercel
vercel login
vercel        # depuis le dossier du projet
```

Ajouter les variables d'environnement dans Vercel → Settings → Environment Variables :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 8. Récapitulatif des coûts (Plan gratuit)

| Service | Plan gratuit | Limite |
|---|---|---|
| Supabase | Free | 500 MB DB, 1 GB storage, 50 000 users |
| Vercel | Hobby | Illimité pour projets perso |
| Domaine | ~10 €/an | Namecheap, OVH, Porkbun |

**Pour un MVP avec < 500 utilisateurs : 0 €/mois.**

---

## 9. Variables d'environnement

```env
# .env (ne jamais commiter ce fichier)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Ajouter dans .gitignore
.env
.env.local
```

---

## 10. Structure finale des fichiers

```
climblog/
├── docs/
│   └── SETUP.md              ← ce fichier
├── src/
│   ├── components/
│   │   └── AscentCard.jsx
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   ├── LogbookPage.jsx
│   │   ├── AddAscentPage.jsx
│   │   ├── StatsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── lib/
│   │   ├── auth.js           → remplacer par Supabase Auth
│   │   ├── db.js             → remplacer par Supabase DB
│   │   ├── supabase.js       → à créer (étape 2.2)
│   │   └── storage.js        → à créer (étape 6.3)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```
