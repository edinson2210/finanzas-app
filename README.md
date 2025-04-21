# MisFinanzas - Aplicación de Gestión Financiera Personal

Aplicación web para el control de finanzas personales desarrollada con Next.js, NextAuth, Prisma y PostgreSQL.

## Características

- 🔒 Autenticación segura con NextAuth (credenciales y Google)
- 💰 Gestión de transacciones (ingresos, gastos, transferencias)
- 📊 Visualización de datos y estadísticas
- 📱 Diseño responsive para todas las pantallas
- 🔄 Categorías personalizables para ingresos y gastos
- 💵 Control de presupuestos
- 💳 Seguimiento de deudas

## Requisitos Previos

- Node.js 18 o superior
- PostgreSQL 13 o superior
- Cuenta de Google para OAuth (opcional)

## Instalación

1. Clona el repositorio:

```bash
git clone <tu-repositorio>
cd finanzas
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   - Actualiza los valores con tus propias credenciales

```
# Configuración de la base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/finanzas_app?schema=public"

# Configuración de NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secreto_seguro

# Credenciales OAuth para Google
GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
```

4. Configura la base de datos:

```bash
npm run setup-db
```

5. Inicia el servidor de desarrollo:

```bash
npm run dev
```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Despliegue

Para desplegar la aplicación en producción:

1. Configura tu base de datos PostgreSQL en un proveedor de nube (Railway, Supabase, Vercel, etc.)
2. Actualiza la variable `DATABASE_URL` con tu conexión de producción
3. Genera las migraciones de producción:

```bash
npx prisma migrate deploy
```

4. Construye la aplicación:

```bash
npm run build
```

5. Inicia el servidor:

```bash
npm start
```

También puedes desplegar fácilmente en plataformas como Vercel o Netlify con sus respectivas integraciones.

## Estructura del Proyecto

```
finanzas/
├── app/                 # Rutas y páginas de la aplicación
│   ├── api/             # API endpoints
│   ├── dashboard/       # Panel principal
│   ├── login/           # Página de login
│   ├── register/        # Página de registro
│   ├── profile/         # Perfil de usuario
│   ├── transactions/    # Gestión de transacciones
│   └── ...
├── components/          # Componentes reutilizables
├── context/             # Contextos de React
├── lib/                 # Utilidades y configuraciones
├── prisma/              # Esquema y migraciones de la base de datos
└── public/              # Archivos estáticos
```

## Licencia

[MIT](LICENSE)
