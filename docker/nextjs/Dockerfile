ARG REGISTRY_URL
FROM public.ecr.aws/docker/library/node:20.9.0-bookworm-slim AS dependencies

WORKDIR /app

COPY nextjs/package*.json .

RUN npm i

FROM public.ecr.aws/docker/library/node:20.9.0-bookworm-slim AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules node_modules
COPY nextjs .

ENV NODE_ENV production

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN apt-get update \
    && apt-get install -y ca-certificates


RUN npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
    && apt-get install -y gettext-base \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

COPY --from=builder /app/.next/ .next/
COPY --from=builder /app/public public
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json .

COPY docker/nextjs/entrypoint.sh /home/entrypoint.sh
RUN chmod +x /home/entrypoint.sh
ENTRYPOINT ["/home/entrypoint.sh"]
