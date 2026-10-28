# Frontend

React 18 + TypeScript + Vite + Tailwind + TanStack Query.

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000/api
npm run dev            # http://localhost:5173
```

Backend: `cd backend && python manage.py runserver`.

Routes: `/` landing, `/stores`, `/login`, `/register`, `/register/vendor`,
`/app/*` vendor console, `/shop/*` customer storefront.
Requests carry `Authorization: Bearer` plus `X-Tenant-ID` for the active store.
