FROM oven/bun:1.2-alpine
WORKDIR /app
COPY server.ts form.html ./
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
