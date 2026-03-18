# Piso0 - Sistema de Gestión de Restaurant

## Deploy en Railway + Vercel

### 1. Deploy Backend en Railway

1. Ve a [Railway](https://railway.app) y regístrate con GitHub
2. Clic en "New Project" → "Deploy from GitHub repo"
3. Seleccioná tu repositorio de Piso0
4. Railway detectará Node.js automáticamente

**Configurar variables de entorno en Railway:**

```
PORT=8000
JWT_SECRET=piso0_secret_key_2024
DB_HOST=db.mhjktpujkcqwkigfssqn.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=FermiCata02
MP_ACCESS_TOKEN=TEST-1965786767912506-112513-e98b2a1db465e33d22cb260d77c3c3e6-87049761
MP_CLIENT_ID=87049761
MP_CLIENT_SECRET=TEST-6e873076-0f7a-4025-be8a-27f8da736f31
MP_NOTIFICATION_URL=https://mhjktpujkcqwkigfssqn.supabase.co
CLIENT_URL=https://tu-app.vercel.app
```

5. En "Root Directory" poné: `server`
6. En "Start Command" poné: `npm start`

7. Clic en "Deploy" y esperá a que termine

8. **Copiá la URL del deploy** (algo como `https://piso0-backend.up.railway.app`)

---

### 2. Deploy Frontend en Vercel

1. Ve a [Vercel](https://vercel.com) y regístrate con GitHub
2. Clic en "Add New Project" → "Import Git Repository"
3. Seleccioná tu repositorio de Piso0

**Configurar:**

- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**Agregar Variable de Entorno:**

```
VITE_API_URL=https://tu-backend-railway.up.railway.app
```

(reemplazá con la URL real de tu deploy en Railway)

4. Clic en "Deploy"

---

### 3. Actualizar URLs

Después de deployar:

1. En Railway, agregá/modificá:
   ```
   CLIENT_URL=https://tu-app.vercel.app
   MP_NOTIFICATION_URL=https://tu-backend-railway.up.railway.app
   ```

2. En Vercel, el `VITE_API_URL` ya está configurado

---

### 4. Probar

- Abrí tu app de Vercel
- Login con: `admin@piso0.com` / `admin123`

---

## Credenciales

- **Admin:** admin@piso0.com / admin123
- **MercadoPago:** Modo TEST (ver .env)

---

## Desarrollo Local

```bash
# Server
cd server
npm install
npm start

# Client
cd client
npm install
npm run dev
```

El servidor corre en http://localhost:8000
El cliente en http://localhost:5173
