# Migration Supabase → Neon (Yayra)

## 1. Préparer Neon

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Configurez sur le projet **web** et l’**API** :

- `DATABASE_URL` (Neon)
- `AUTH_SECRET` (≥ 32 caractères, **identique** partout)

## 2. URI Postgres Supabase

Dans Supabase → **Project Settings → Database → Connection string → URI** (mode `postgres`, port **5432**).

Ne commitez jamais cette URL (mot de passe inclus).

## 3. Lancer la migration

Depuis `chatagentapi/` :

```powershell
$env:SUPABASE_DATABASE_URL = "postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"
$env:DATABASE_URL = "postgresql://...@neon.tech/neondb?sslmode=require"

py scripts/migrate_supabase_to_neon.py --dry-run
py scripts/migrate_supabase_to_neon.py
```

### Ce qui est copié

| Source | Cible |
|--------|--------|
| `auth.users` | `app_users` (`password_hash` = `bcrypt:` + hash Supabase) |
| `public.organizations`, `sites`, `knowledge_chunks`, conversations, etc. | mêmes tables Neon |

Les **UUID sont conservés** (widget keys, liens, conversations inchangés).

### Non inclus

- **Supabase Storage** (logos, images traffic) → re-uploader via le dashboard (Cloudinary)
- **`site_documents`** si la table n’existait pas encore sur Supabase
- Comptes sans mot de passe dans `auth.users` → reset mot de passe obligatoire

## 4. Mots de passe

Les comptes migrés gardent le hash **bcrypt** Supabase (`bcrypt:$2a$...`).

Au **premier login** (web ou app mobile), le hash est **rehashé en scrypt** Yayra automatiquement.

### Migration `--via-api` sans mots de passe

L’API Supabase **n’exporte pas** les hash. Les comptes ont `password_hash` vide.

**Option 1 — conserver les anciens mots de passe** (accès Postgres Supabase requis) :

```powershell
cd chatagentapi
# SUPABASE_DB_PASSWORD=... dans .env
py scripts/migrate_supabase_passwords.py --dry-run
py scripts/migrate_supabase_passwords.py
```

**Option 2 — reset** : chaque utilisateur passe par **Mot de passe oublié** sur le web (Resend ou lien dans les logs serveur en dev).

## 5. Après migration

1. Couper l’ancien projet Supabase côté prod (variables d’env Render/Vercel)
2. Vérifier crawl / chat / handoff sur un site test
3. PDF scannés : l’API tente l’OCR (Tesseract) si le texte natif du PDF est insuffisant
