#!/usr/bin/env bash
# HiTech Benchmark production installer.
# Docker is used only for PostgreSQL. Node.js, Redis, Nginx, web, and worker run on the host.

set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$APP_DIR/.env"
PNPM_VERSION="9.15.0"
NODE_MAJOR="22"
DB_NAME="hitechbenchmark"
DB_USER="hitechbench"
WEB_SERVICE="hitechbenchmark-web"
WORKER_SERVICE="hitechbenchmark-worker"

if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

log() { printf "%b\n" "${BLUE}==>${NC} $*"; }
success() { printf "%b\n" "${GREEN}✓${NC} $*"; }
warn() { printf "%b\n" "${YELLOW}!${NC} $*"; }
fail() { printf "%b\n" "${RED}✗${NC} $*" >&2; exit 1; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

SUDO=''
if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  if has_cmd sudo; then
    SUDO='sudo'
  else
    fail "This installer needs root privileges for packages, systemd, and nginx. Re-run as root or install sudo."
  fi
fi

as_root() {
  if [[ -n "$SUDO" ]]; then
    $SUDO "$@"
  else
    "$@"
  fi
}

APP_USER_DEFAULT="${SUDO_USER:-${USER:-$(id -un)}}"
if [[ "$APP_USER_DEFAULT" == "root" && -n "${LOGNAME:-}" && "${LOGNAME}" != "root" ]]; then
  APP_USER_DEFAULT="$LOGNAME"
fi

run_as_user() {
  local user="$1"
  shift
  local command="$*"

  if [[ "$user" == "root" ]]; then
    bash -lc "$command"
  elif [[ ${EUID:-$(id -u)} -eq 0 ]]; then
    if has_cmd sudo; then
      sudo -H -u "$user" bash -lc "$command"
    else
      su -s /bin/bash "$user" -c "$command"
    fi
  else
    bash -lc "$command"
  fi
}

get_env_value() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || return 0
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
  value="${value%$'\r'}"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
    value="${value//\\\"/\"}"
    value="${value//\\\\/\\}"
  fi
  printf '%s' "$value"
}

ask() {
  local prompt="$1"
  local default="${2:-}"
  local value
  if [[ -n "$default" ]]; then
    read -r -p "$prompt [$default]: " value || true
    printf '%s' "${value:-$default}"
  else
    read -r -p "$prompt: " value || true
    printf '%s' "$value"
  fi
}

ask_secret() {
  local prompt="$1"
  local default="${2:-}"
  local value
  if [[ -n "$default" ]]; then
    read -r -s -p "$prompt [giữ nguyên nếu bỏ trống]: " value || true
    printf '\n' >&2
    printf '%s' "${value:-$default}"
  else
    read -r -s -p "$prompt: " value || true
    printf '\n' >&2
    printf '%s' "$value"
  fi
}

ask_yes_no() {
  local prompt="$1"
  local default="${2:-y}"
  local suffix='Y/n'
  [[ "$default" =~ ^[Nn]$ ]] && suffix='y/N'
  local value
  read -r -p "$prompt [$suffix]: " value || true
  value="${value:-$default}"
  [[ "$value" =~ ^[Yy]$ ]]
}

random_base64() {
  if has_cmd openssl; then
    openssl rand -base64 32
  else
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  fi
}

random_hex() {
  if has_cmd openssl; then
    openssl rand -hex 32
  else
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  fi
}

trim() {
  local value="$*"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

normalize_domains() {
  local raw="$1"
  raw="${raw//,/ }"
  local result=()
  local item
  for item in $raw; do
    item="$(trim "$item")"
    item="${item#http://}"
    item="${item#https://}"
    item="${item%%/*}"
    item="$(strip_port "$item")"
    [[ -n "$item" ]] && result+=("$item")
  done
  printf '%s' "${result[*]:-}"
}

first_domain() {
  local domains="$1"
  for item in $domains; do
    printf '%s' "$item"
    return 0
  done
  printf 'localhost'
}

strip_port() {
  local host="$1"
  printf '%s' "${host%%:*}"
}

escape_env_value() {
  local value="$1"
  if [[ -z "$value" ]]; then
    printf ''
  elif [[ "$value" =~ [[:space:]\#\"\\\$\`] ]]; then
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//\$/\\\$}"
    value="${value//\`/\\\`}"
    printf '"%s"' "$value"
  else
    printf '%s' "$value"
  fi
}

write_env_line() {
  local key="$1"
  local value="$2"
  printf '%s=%s\n' "$key" "$(escape_env_value "$value")"
}

pkg_manager() {
  if has_cmd apt-get; then printf 'apt'; return; fi
  if has_cmd dnf; then printf 'dnf'; return; fi
  if has_cmd yum; then printf 'yum'; return; fi
  if has_cmd pacman; then printf 'pacman'; return; fi
  if has_cmd apk; then printf 'apk'; return; fi
  printf 'unknown'
}

install_packages() {
  local manager="$1"
  shift
  [[ $# -gt 0 ]] || return 0

  case "$manager" in
    apt)
      as_root apt-get update
      as_root DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
      ;;
    dnf)
      as_root dnf install -y "$@"
      ;;
    yum)
      as_root yum install -y "$@"
      ;;
    pacman)
      as_root pacman -Sy --noconfirm --needed "$@"
      ;;
    apk)
      as_root apk add --no-cache "$@"
      ;;
    *)
      fail "Unsupported package manager. Install dependencies manually: $*"
      ;;
  esac
}

node_major_version() {
  if ! has_cmd node; then
    printf '0'
    return
  fi
  node -p "parseInt(process.versions.node.split('.')[0], 10)" 2>/dev/null || printf '0'
}

install_nodejs() {
  local manager="$1"
  local major
  major="$(node_major_version)"
  if [[ "$major" =~ ^[0-9]+$ && "$major" -ge 20 ]]; then
    success "Node.js $(node -v) is available on the host"
    return 0
  fi

  log "Installing Node.js ${NODE_MAJOR}.x on the host"
  case "$manager" in
    apt)
      install_packages apt ca-certificates curl gnupg
      as_root install -d -m 0755 /etc/apt/keyrings
      curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" | as_root gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
      printf 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_%s.x nodistro main\n' "$NODE_MAJOR" | as_root tee /etc/apt/sources.list.d/nodesource.list >/dev/null
      as_root apt-get update
      as_root DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
      ;;
    dnf)
      as_root dnf module disable -y nodejs || true
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
      as_root dnf install -y nodejs
      ;;
    yum)
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
      as_root yum install -y nodejs
      ;;
    pacman)
      install_packages pacman nodejs npm
      ;;
    apk)
      install_packages apk nodejs npm
      ;;
    *)
      fail "Node.js >= 20 is required. Install Node.js manually and re-run this installer."
      ;;
  esac

  major="$(node_major_version)"
  [[ "$major" =~ ^[0-9]+$ && "$major" -ge 20 ]] || fail "Node.js >= 20 is required, found $(node -v 2>/dev/null || echo missing)"
  success "Installed Node.js $(node -v)"
}

install_pnpm() {
  log "Installing pnpm ${PNPM_VERSION}"
  if has_cmd corepack; then
    as_root corepack enable || true
    as_root corepack prepare "pnpm@${PNPM_VERSION}" --activate || true
  fi
  if ! has_cmd pnpm; then
    as_root npm install -g "pnpm@${PNPM_VERSION}"
  fi
  success "pnpm $(pnpm --version) is available"
}

install_docker() {
  local manager="$1"
  if has_cmd docker && docker compose version >/dev/null 2>&1; then
    success "Docker and Docker Compose are available"
    return 0
  fi

  log "Installing Docker for PostgreSQL container"
  case "$manager" in
    apt)
      install_packages apt docker.io docker-compose-plugin
      ;;
    dnf)
      install_packages dnf docker docker-compose-plugin
      ;;
    yum)
      install_packages yum docker docker-compose-plugin
      ;;
    pacman)
      install_packages pacman docker docker-compose
      ;;
    apk)
      install_packages apk docker docker-cli-compose
      ;;
    *)
      fail "Docker with Compose v2 is required. Install Docker manually and re-run this installer."
      ;;
  esac

  if has_cmd systemctl; then
    as_root systemctl enable --now docker || true
  elif has_cmd service; then
    as_root service docker start || true
  fi

  has_cmd docker && docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is not available after installation"
  success "Docker and Docker Compose are available"
}

install_redis() {
  local manager="$1"
  if has_cmd redis-server || has_cmd redis-cli; then
    success "Redis is available on the host"
  else
    log "Installing Redis on the host"
    case "$manager" in
      apt) install_packages apt redis-server ;;
      dnf) install_packages dnf redis ;;
      yum) install_packages yum redis ;;
      pacman) install_packages pacman redis ;;
      apk) install_packages apk redis ;;
      *) fail "Redis is required. Install Redis manually and re-run this installer." ;;
    esac
  fi

  if has_cmd systemctl; then
    as_root systemctl enable --now redis-server >/dev/null 2>&1 || as_root systemctl enable --now redis >/dev/null 2>&1 || true
  elif has_cmd rc-service; then
    as_root rc-update add redis default >/dev/null 2>&1 || true
    as_root rc-service redis start >/dev/null 2>&1 || true
  elif has_cmd service; then
    as_root service redis-server start >/dev/null 2>&1 || as_root service redis start >/dev/null 2>&1 || true
  fi

  success "Redis host service is ready or installed"
}

install_nginx_certbot() {
  local manager="$1"
  log "Installing Nginx and Certbot"
  case "$manager" in
    apt) install_packages apt nginx certbot python3-certbot-nginx ;;
    dnf) install_packages dnf nginx certbot python3-certbot-nginx ;;
    yum) install_packages yum nginx certbot python3-certbot-nginx ;;
    pacman) install_packages pacman nginx certbot certbot-nginx ;;
    apk) install_packages apk nginx certbot certbot-nginx ;;
    *) fail "Nginx is required. Install nginx and certbot manually and re-run this installer." ;;
  esac

  if has_cmd systemctl; then
    as_root systemctl enable --now nginx || true
  elif has_cmd rc-service; then
    as_root rc-update add nginx default >/dev/null 2>&1 || true
    as_root rc-service nginx start >/dev/null 2>&1 || true
  elif has_cmd service; then
    as_root service nginx start || true
  fi
}

collect_configuration() {
  log "Project configuration"

  SERVICE_USER="$(ask 'Linux user to run web/worker services' "${APP_USER_DEFAULT}")"
  id "$SERVICE_USER" >/dev/null 2>&1 || fail "User '$SERVICE_USER' does not exist"

  local existing_url existing_domain default_domains default_https
  existing_url="$(get_env_value APP_URL)"
  existing_domain="${existing_url#http://}"
  existing_domain="${existing_domain#https://}"
  existing_domain="${existing_domain%%/*}"
  existing_domain="${existing_domain%%:*}"
  [[ -z "$existing_domain" ]] && existing_domain='localhost'

  default_domains="$existing_domain"
  DOMAINS="$(normalize_domains "$(ask 'Domains (space/comma separated, first is primary)' "$default_domains")")"
  [[ -z "$DOMAINS" ]] && DOMAINS='localhost'
  PRIMARY_DOMAIN="$(first_domain "$DOMAINS")"

  APP_PORT="$(ask 'Host Node.js web port' "$(get_env_value APP_PORT || true)")"
  [[ -z "$APP_PORT" ]] && APP_PORT='3000'
  [[ "$APP_PORT" =~ ^[0-9]+$ ]] || fail "APP_PORT must be a number"

  default_https='y'
  [[ "$PRIMARY_DOMAIN" == 'localhost' || "$PRIMARY_DOMAIN" == '127.0.0.1' ]] && default_https='n'
  if ask_yes_no 'Enable HTTPS with Certbot/Nginx' "$default_https"; then
    USE_HTTPS='true'
    URL_SCHEME='https'
    WS_SCHEME='wss'
  else
    USE_HTTPS='false'
    URL_SCHEME='http'
    WS_SCHEME='ws'
  fi

  if [[ "$PRIMARY_DOMAIN" == 'localhost' || "$PRIMARY_DOMAIN" == '127.0.0.1' ]]; then
    APP_URL="${URL_SCHEME}://${PRIMARY_DOMAIN}:${APP_PORT}"
    PUBLIC_WS_URL="${WS_SCHEME}://${PRIMARY_DOMAIN}:${APP_PORT}"
  else
    APP_URL="${URL_SCHEME}://${PRIMARY_DOMAIN}"
    PUBLIC_WS_URL="${WS_SCHEME}://${PRIMARY_DOMAIN}"
  fi

  CERTBOT_EMAIL="$(ask "Email for Let's Encrypt/admin notices" "$(get_env_value CERTBOT_EMAIL || true)")"
  [[ -z "$CERTBOT_EMAIL" ]] && CERTBOT_EMAIL="admin@$(strip_port "$PRIMARY_DOMAIN")"

  DB_PASSWORD_DEFAULT="$(get_env_value POSTGRES_PASSWORD || true)"
  [[ -z "$DB_PASSWORD_DEFAULT" ]] && DB_PASSWORD_DEFAULT="$(random_hex)"
  POSTGRES_PASSWORD="$(ask_secret 'PostgreSQL password' "$DB_PASSWORD_DEFAULT")"

  NEXTAUTH_SECRET_DEFAULT="$(get_env_value NEXTAUTH_SECRET || true)"
  [[ -z "$NEXTAUTH_SECRET_DEFAULT" ]] && NEXTAUTH_SECRET_DEFAULT="$(random_base64)"
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET_DEFAULT"

  AUTH_SECRET_DEFAULT="$(get_env_value AUTH_SECRET || true)"
  [[ -z "$AUTH_SECRET_DEFAULT" ]] && AUTH_SECRET_DEFAULT="$NEXTAUTH_SECRET"
  AUTH_SECRET="$AUTH_SECRET_DEFAULT"

  SIGNING_SECRET_DEFAULT="$(get_env_value BENCHMARK_SIGNING_SECRET || true)"
  [[ -z "$SIGNING_SECRET_DEFAULT" ]] && SIGNING_SECRET_DEFAULT="$(random_hex)"
  BENCHMARK_SIGNING_SECRET="$SIGNING_SECRET_DEFAULT"

  log "Optional integrations"
  AI_PROVIDER="$(ask 'AI provider (disabled/anthropic/openai/azure/groq/together/ollama/lmstudio)' "$(get_env_value AI_PROVIDER || true)")"
  [[ -z "$AI_PROVIDER" ]] && AI_PROVIDER='disabled'
  AI_API_KEY="$(ask_secret 'AI API key (leave blank if disabled/local)' "$(get_env_value AI_API_KEY || true)")"
  ANTHROPIC_API_KEY_DEFAULT="$(get_env_value ANTHROPIC_API_KEY || true)"
  [[ -z "$ANTHROPIC_API_KEY_DEFAULT" && "$AI_PROVIDER" == 'anthropic' ]] && ANTHROPIC_API_KEY_DEFAULT="$AI_API_KEY"
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY_DEFAULT"
  AI_MODEL="$(ask 'AI model' "$(get_env_value AI_MODEL || true)")"
  AI_BASE_URL="$(ask 'AI base URL (optional)' "$(get_env_value AI_BASE_URL || true)")"

  SMTP_HOST="$(ask 'SMTP host (optional)' "$(get_env_value EMAIL_SERVER_HOST || true)")"
  SMTP_PORT="$(ask 'SMTP port' "$(get_env_value EMAIL_SERVER_PORT || true)")"
  [[ -z "$SMTP_PORT" ]] && SMTP_PORT='587'
  SMTP_USER="$(ask 'SMTP user (optional)' "$(get_env_value EMAIL_SERVER_USER || true)")"
  SMTP_PASSWORD="$(ask_secret 'SMTP password (optional)' "$(get_env_value EMAIL_SERVER_PASSWORD || true)")"
  SMTP_SECURE="$(ask 'SMTP secure true/false' "$(get_env_value EMAIL_SERVER_SECURE || true)")"
  [[ -z "$SMTP_SECURE" ]] && SMTP_SECURE='false'
  EMAIL_FROM_DEFAULT="$(get_env_value EMAIL_FROM || true)"
  [[ -z "$EMAIL_FROM_DEFAULT" ]] && EMAIL_FROM_DEFAULT="HiTech Benchmark <noreply@$(strip_port "$PRIMARY_DOMAIN")>"
  EMAIL_FROM="$(ask 'Email from' "$EMAIL_FROM_DEFAULT")"

  if ask_yes_no 'Run database seed after migrations' 'y'; then
    RUN_SEED='true'
  else
    RUN_SEED='false'
  fi
}

write_env_file() {
  log "Writing root .env"
  if [[ -f "$ENV_FILE" ]]; then
    local backup="$ENV_FILE.backup.$(date +%Y%m%d%H%M%S)"
    cp "$ENV_FILE" "$backup"
    warn "Existing .env backed up to $backup"
  fi

  {
    printf '# =============================================================================\n'
    printf '# HiTech Benchmark - generated by install.sh\n'
    printf '# Docker runs PostgreSQL only. Node.js, Redis, Nginx, web, and worker run on host.\n'
    printf '# =============================================================================\n\n'
    write_env_line NODE_ENV production
    write_env_line APP_URL "$APP_URL"
    write_env_line APP_PORT "$APP_PORT"
    write_env_line CERTBOT_EMAIL "$CERTBOT_EMAIL"
    printf '\n'
    write_env_line POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
    write_env_line DATABASE_URL "postgresql://${DB_USER}:${POSTGRES_PASSWORD}@localhost:5432/${DB_NAME}"
    printf '\n'
    write_env_line REDIS_URL 'redis://localhost:6379'
    write_env_line QUEUE_CONNECTION redis
    printf '\n'
    write_env_line NEXTAUTH_URL "$APP_URL"
    write_env_line NEXTAUTH_SECRET "$NEXTAUTH_SECRET"
    write_env_line AUTH_SECRET "$AUTH_SECRET"
    write_env_line BENCHMARK_SIGNING_SECRET "$BENCHMARK_SIGNING_SECRET"
    printf '\n'
    write_env_line NEXT_PUBLIC_SITE_URL "$APP_URL"
    write_env_line NEXT_PUBLIC_API_URL "$APP_URL"
    write_env_line NEXT_PUBLIC_WS_URL "$PUBLIC_WS_URL"
    write_env_line NEXT_PUBLIC_SITE_NAME 'HiTech Benchmark'
    write_env_line SCRIPT_VERSION '1.0.0'
    printf '\n'
    write_env_line GOOGLE_CLIENT_ID "$(get_env_value GOOGLE_CLIENT_ID || true)"
    write_env_line GOOGLE_CLIENT_SECRET "$(get_env_value GOOGLE_CLIENT_SECRET || true)"
    write_env_line GITHUB_CLIENT_ID "$(get_env_value GITHUB_CLIENT_ID || true)"
    write_env_line GITHUB_CLIENT_SECRET "$(get_env_value GITHUB_CLIENT_SECRET || true)"
    printf '\n'
    write_env_line EMAIL_SERVER_HOST "$SMTP_HOST"
    write_env_line EMAIL_SERVER_PORT "$SMTP_PORT"
    write_env_line EMAIL_SERVER_USER "$SMTP_USER"
    write_env_line EMAIL_SERVER_PASSWORD "$SMTP_PASSWORD"
    write_env_line EMAIL_SERVER_SECURE "$SMTP_SECURE"
    write_env_line EMAIL_FROM "$EMAIL_FROM"
    printf '\n'
    write_env_line WEBAUTHN_RP_ID "$(strip_port "$PRIMARY_DOMAIN")"
    write_env_line WEBAUTHN_ORIGIN "$APP_URL"
    printf '\n'
    write_env_line AI_PROVIDER "$AI_PROVIDER"
    write_env_line AI_API_KEY "$AI_API_KEY"
    write_env_line ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY"
    write_env_line AI_MODEL "$AI_MODEL"
    write_env_line AI_BASE_URL "$AI_BASE_URL"
    write_env_line AI_MAX_TOKENS "$(get_env_value AI_MAX_TOKENS || true)"
    write_env_line AZURE_OPENAI_ENDPOINT "$(get_env_value AZURE_OPENAI_ENDPOINT || true)"
    write_env_line AZURE_OPENAI_DEPLOYMENT "$(get_env_value AZURE_OPENAI_DEPLOYMENT || true)"
    write_env_line AZURE_OPENAI_API_VERSION "$(get_env_value AZURE_OPENAI_API_VERSION || true)"
    printf '\n'
    write_env_line GEOIP_PROVIDER "$(get_env_value GEOIP_PROVIDER || true)"
    write_env_line GEOIP_API_KEY "$(get_env_value GEOIP_API_KEY || true)"
    printf '\n'
    write_env_line CLOUDFLARE_ZONE_ID "$(get_env_value CLOUDFLARE_ZONE_ID || true)"
    write_env_line CLOUDFLARE_API_TOKEN "$(get_env_value CLOUDFLARE_API_TOKEN || true)"
    write_env_line ENABLE_HTTP3 "$(get_env_value ENABLE_HTTP3 || true)"
    write_env_line TRUSTED_PROXIES "$(get_env_value TRUSTED_PROXIES || true)"
    printf '\n'
    write_env_line ADMIN_APP_URL "$APP_URL/admin"
    write_env_line ADMIN_ALLOWED_ROLES "$(get_env_value ADMIN_ALLOWED_ROLES || true)"
    write_env_line ADMIN_UPLOAD_MAX_SIZE "$(get_env_value ADMIN_UPLOAD_MAX_SIZE || true)"
    printf '\n'
    write_env_line RATE_LIMIT_BENCHMARK_INGEST "$(get_env_value RATE_LIMIT_BENCHMARK_INGEST || true)"
    write_env_line RATE_LIMIT_WINDOW_SECONDS "$(get_env_value RATE_LIMIT_WINDOW_SECONDS || true)"
    printf '\n'
    write_env_line CDN_URL "$(get_env_value CDN_URL || true)"
    write_env_line NEXT_PUBLIC_GA_ID "$(get_env_value NEXT_PUBLIC_GA_ID || true)"
    write_env_line NEXT_PUBLIC_SENTRY_DSN "$(get_env_value NEXT_PUBLIC_SENTRY_DSN || true)"
  } > "$ENV_FILE"

  chmod 600 "$ENV_FILE"
  local service_group
  service_group="$(id -gn "$SERVICE_USER")"
  as_root chown "$SERVICE_USER:$service_group" "$ENV_FILE"
  success "Root .env is ready"
}

ensure_env_defaults() {
  # Fill defaults for optional values if they were empty in the previous .env.
  local tmp="$ENV_FILE.tmp"
  awk '
    BEGIN {
      defaults["AI_MAX_TOKENS"]="1024";
      defaults["AZURE_OPENAI_DEPLOYMENT"]="gpt-4o-mini";
      defaults["AZURE_OPENAI_API_VERSION"]="2024-10-21";
      defaults["GEOIP_PROVIDER"]="ipapi";
      defaults["ENABLE_HTTP3"]="false";
      defaults["ADMIN_ALLOWED_ROLES"]="super_admin,admin,moderator,support";
      defaults["ADMIN_UPLOAD_MAX_SIZE"]="5242880";
      defaults["RATE_LIMIT_BENCHMARK_INGEST"]="10";
      defaults["RATE_LIMIT_WINDOW_SECONDS"]="60";
    }
    /^[A-Z0-9_]+=($|""$)/ {
      split($0, parts, "=");
      key=parts[1];
      if (key in defaults) {
        print key "=" defaults[key];
        next;
      }
    }
    { print }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  local service_group
  service_group="$(id -gn "$SERVICE_USER")"
  as_root chown "$SERVICE_USER:$service_group" "$ENV_FILE"
}

ensure_project_permissions() {
  [[ "$SERVICE_USER" == 'root' ]] && return 0
  local service_group
  service_group="$(id -gn "$SERVICE_USER")"
  log "Ensuring project files are owned by ${SERVICE_USER}"
  as_root chown -R "$SERVICE_USER:$service_group" "$APP_DIR"
}

start_database() {
  log "Starting PostgreSQL with Docker Compose"
  (cd "$APP_DIR" && as_root docker compose up -d database)
  success "PostgreSQL container is running on 127.0.0.1:5432"
}

wait_for_database() {
  log "Waiting for PostgreSQL to accept connections"
  local attempt
  for attempt in $(seq 1 30); do
    if (cd "$APP_DIR" && as_root docker compose exec -T database pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1); then
      success "PostgreSQL is ready"
      return 0
    fi
    sleep 2
  done
  fail "PostgreSQL did not become ready in time. Check: docker compose logs database"
}

install_project_dependencies() {
  log "Installing project dependencies with host Node.js"
  run_as_user "$SERVICE_USER" "cd '$APP_DIR' && pnpm install --frozen-lockfile --prod=false"

  log "Generating Prisma client"
  run_as_user "$SERVICE_USER" "cd '$APP_DIR' && pnpm db:generate"

  log "Building project on the host"
  run_as_user "$SERVICE_USER" "cd '$APP_DIR' && pnpm build"

  log "Applying database migrations"
  run_as_user "$SERVICE_USER" "cd '$APP_DIR' && pnpm db:migrate:prod"

  if [[ "$RUN_SEED" == 'true' ]]; then
    log "Seeding database"
    run_as_user "$SERVICE_USER" "cd '$APP_DIR' && pnpm db:seed"
  fi
}

nginx_site_path() {
  if [[ -d /etc/nginx/sites-available ]]; then
    printf '/etc/nginx/sites-available/hitechbenchmark'
  else
    printf '/etc/nginx/conf.d/hitechbenchmark.conf'
  fi
}

install_nginx_site() {
  log "Configuring host Nginx reverse proxy"
  local site_path enabled_path server_name
  site_path="$(nginx_site_path)"
  enabled_path='/etc/nginx/sites-enabled/hitechbenchmark'
  server_name="$DOMAINS"
  [[ "$PRIMARY_DOMAIN" == 'localhost' || "$PRIMARY_DOMAIN" == '127.0.0.1' ]] && server_name='_'

  as_root mkdir -p /var/www/certbot /var/cache/nginx
  as_root tee "$site_path" >/dev/null <<EOF
# HiTech Benchmark host Node.js reverse proxy.
# Generated by install.sh. Web app listens on 127.0.0.1:${APP_PORT}.

limit_req_zone \$binary_remote_addr zone=hitech_api:10m rate=60r/m;
limit_req_zone \$binary_remote_addr zone=hitech_install:10m rate=30r/m;
limit_req_zone \$binary_remote_addr zone=hitech_ingest:10m rate=10r/m;
limit_req_zone \$binary_remote_addr zone=hitech_auth:10m rate=10r/m;

upstream hitechbenchmark_nextjs {
    server 127.0.0.1:${APP_PORT};
    keepalive 32;
}

server {
    listen 80;
    server_name ${server_name};

    server_tokens off;
    client_max_body_size 2m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location = /install {
        limit_req zone=hitech_install burst=20 nodelay;
        proxy_pass http://hitechbenchmark_nextjs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, max-age=300";
    }

    location ~ ^/api/auth/ {
        limit_req zone=hitech_auth burst=5 nodelay;
        proxy_pass http://hitechbenchmark_nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /api/benchmarks {
        limit_req zone=hitech_ingest burst=5 nodelay;
        proxy_pass http://hitechbenchmark_nextjs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 1m;
    }

    location /_next/static/ {
        proxy_pass http://hitechbenchmark_nextjs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        limit_req zone=hitech_api burst=120 nodelay;
        proxy_pass http://hitechbenchmark_nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
    }
}
EOF

  if [[ -d /etc/nginx/sites-enabled ]]; then
    as_root ln -sfn "$site_path" "$enabled_path"
    [[ -e /etc/nginx/sites-enabled/default ]] && as_root rm -f /etc/nginx/sites-enabled/default
  fi

  as_root nginx -t
  if has_cmd systemctl; then
    as_root systemctl reload nginx
  elif has_cmd rc-service; then
    as_root rc-service nginx reload
  else
    as_root nginx -s reload || true
  fi

  if [[ "$USE_HTTPS" == 'true' && "$PRIMARY_DOMAIN" != 'localhost' && "$PRIMARY_DOMAIN" != '127.0.0.1' ]]; then
    if has_cmd certbot; then
      local certbot_domains=()
      local domain
      for domain in $DOMAINS; do
        certbot_domains+=("-d" "$domain")
      done
      log "Requesting Let's Encrypt certificate"
      as_root certbot --nginx --non-interactive --agree-tos --redirect -m "$CERTBOT_EMAIL" "${certbot_domains[@]}" || warn "Certbot failed. Check DNS/firewall and run certbot manually."
    else
      warn "certbot not found; HTTPS certificate was not created"
    fi
  fi
}

install_systemd_services() {
  if ! has_cmd systemctl || [[ ! -d /run/systemd/system ]]; then
    warn "systemd is not available. Services were not installed automatically."
    warn "Start web manually: cd $APP_DIR && pnpm exec dotenv -e .env -- pnpm --filter @hitechbenchmark/web exec next start -H 127.0.0.1 -p $APP_PORT"
    warn "Start worker manually: cd $APP_DIR && pnpm exec dotenv -e .env -- pnpm --filter @hitechbenchmark/worker exec tsx src/index.ts"
    return 0
  fi

  log "Installing systemd services"
  as_root tee "/etc/systemd/system/${WEB_SERVICE}.service" >/dev/null <<EOF
[Unit]
Description=HiTech Benchmark Next.js web
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=/usr/bin/env bash -lc 'exec pnpm exec dotenv -e .env -- pnpm --filter @hitechbenchmark/web exec next start -H 127.0.0.1 -p ${APP_PORT}'
Restart=always
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

  as_root tee "/etc/systemd/system/${WORKER_SERVICE}.service" >/dev/null <<EOF
[Unit]
Description=HiTech Benchmark BullMQ worker
After=network-online.target docker.service ${WEB_SERVICE}.service
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=/usr/bin/env bash -lc 'exec pnpm exec dotenv -e .env -- pnpm --filter @hitechbenchmark/worker exec tsx src/index.ts'
Restart=always
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

  as_root systemctl daemon-reload
  as_root systemctl enable --now "$WEB_SERVICE" "$WORKER_SERVICE"
  success "systemd services started"
}

print_summary() {
  printf '\n%b\n' "${GREEN}HiTech Benchmark installation complete.${NC}"
  printf 'App URL: %s\n' "$APP_URL"
  printf 'Project: %s\n' "$APP_DIR"
  printf 'Docker: PostgreSQL only (service: database)\n'
  printf 'Host services: Node.js web, BullMQ worker, Redis, Nginx\n'
  printf '\nUseful commands:\n'
  printf '  docker compose up -d database\n'
  printf '  systemctl status %s %s\n' "$WEB_SERVICE" "$WORKER_SERVICE"
  printf '  journalctl -u %s -f\n' "$WEB_SERVICE"
  printf '  journalctl -u %s -f\n' "$WORKER_SERVICE"
  printf '  nginx -t && systemctl reload nginx\n'
}

main() {
  printf '%b\n' "${BLUE}HiTech Benchmark installer${NC}"
  printf 'Docker will run PostgreSQL only. Node.js/Redis/Nginx/web/worker run on the host.\n\n'

  local manager
  manager="$(pkg_manager)"
  log "Detected package manager: $manager"

  collect_configuration
  write_env_file
  ensure_env_defaults
  ensure_project_permissions

  install_packages "$manager" ca-certificates curl git openssl bash
  install_nodejs "$manager"
  install_pnpm
  install_docker "$manager"
  install_redis "$manager"
  install_nginx_certbot "$manager"

  start_database
  wait_for_database
  install_project_dependencies
  install_systemd_services
  install_nginx_site
  print_summary
}

main "$@"
