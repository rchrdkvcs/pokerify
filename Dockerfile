# ---------------------------
# 1. Base commune
# ---------------------------
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ---------------------------
# 2. Dépendances (Tous les packages)
# ---------------------------
# Cette étape installe TOUT (devDependencies inclus, comme @nestjs/cli)
# C'est nécessaire pour le build et pour le mode dev.
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------------------------
# 3. Environnement de DÉVELOPPEMENT
# ---------------------------
# C'est l'étape qu'on ciblera pour travailler en local
FROM base AS dev
# On récupère les node_modules complets (avec Nest CLI)
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Commande par défaut pour le dev (watch mode)
CMD ["bun", "run", "start:dev"]

# ---------------------------
# 4. Builder (Compilation)
# ---------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ---------------------------
# 5. Dépendances de Production
# ---------------------------
# On refait une install propre pour n'avoir QUE les dépendances de prod
# Cela allège l'image finale
FROM base AS production-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---------------------------
# 6. Image de PRODUCTION (Runner)
# ---------------------------
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# On copie uniquement les node_modules de prod et le dossier dist compilé
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["bun", "run", "dist/main.js"]
