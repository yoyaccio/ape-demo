# Pubblicazione demo via FTP / hosting Node.js

## Punto fondamentale
Questa applicazione NON è un sito statico HTML/PHP.

È una web app Next.js con API backend interne:
- `/api/zone`
- `/api/simulate`
- `/api/tariffe`
- `/api/config`

Quindi serve uno spazio che supporti **Node.js**.

Se hai solo un hosting classico con FTP + PHP, NON basta caricare i file: la parte API non parte.

## Hosting compatibili
Vanno bene:
- VPS Linux
- hosting con Node.js app
- Plesk con Node.js
- cPanel con Setup Node.js App
- server Aruba solo se ha supporto Node.js/app persistente
- Render / Railway / Fly.io / Vercel

## File da caricare via FTP
Carica tutta la cartella del progetto sul server, esclusi:
- `node_modules`
- `.next`
- eventuali file zip

Poi sul server esegui da terminale:

```bash
npm install
npm run build
npm run start
```

La porta standard di Next è 3000, salvo configurazione hosting.

## Variabili ambiente
Crea un file `.env.local` sul server:

```env
DEMO_BASIC_AUTH_ENABLED=true
DEMO_USER=demo
DEMO_PASS=SCEGLI_PASSWORD_FORTE
NEXT_PUBLIC_DEMO_BANNER=VERSIONE DEMO - NON UTILIZZABILE PER PRATICHE UFFICIALI
```

## Accesso demo
Quando apri il sito, il browser chiederà user/password.

Default se non configuri nulla:
- utente: `demo`
- password: `demoape`

Cambiali prima di darli al cliente.

## Modalità PDF
Il modulo finale è stampabile in A4 dallo step finale usando:
- Stampa
- Salva come PDF

## Nota su salvataggi
La demo salva dati in:
- `data/pratiche.json`
- `data/tariffe.json`
- `data/config.json`

Su hosting serverless questi file possono non essere persistenti. Su VPS/hosting Node tradizionale sì.
