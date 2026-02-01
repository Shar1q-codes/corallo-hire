FROM temporalio/auto-setup:1.24

USER root
RUN apk add --no-cache postgresql-client \
  && adduser -D temporal 2>/dev/null || true

USER temporal
