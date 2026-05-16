#!/usr/bin/env bash
# =============================================================================
# HiTech Benchmark Script v1.0.0
# VPS / Cloud Server / Dedicated Server Benchmarking Tool
#
# Usage:
#   curl -sL {{API_URL}}/install | bash
#   bash <(wget -qO- {{API_URL}}/install)
#
# Supported distros: Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux
# =============================================================================

set -euo pipefail

# ============================================================
# Configuration
# ============================================================
API_URL="{{API_URL}}"
SCRIPT_VERSION="1.0.0"
TMP_DIR="/tmp/hitechbench_$$"
LOG_FILE="$TMP_DIR/benchmark.log"
RESULT_FILE="$TMP_DIR/result.json"
DISK_TEST_FILE="$TMP_DIR/disktest"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================================
# Cleanup on exit
# ============================================================
cleanup() {
    rm -rf "$TMP_DIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

mkdir -p "$TMP_DIR"

# ============================================================
# Helpers
# ============================================================
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()      { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()     { echo -e "${RED}[ERR]${NC}  $*" >&2; }
section() { echo -e "\n${BOLD}${CYAN}=== $* ===${NC}"; }

# Print banner
print_banner() {
    echo -e "${BOLD}"
    echo "  ██╗  ██╗██╗████████╗███████╗ ██████╗██╗  ██╗"
    echo "  ██║  ██║██║╚══██╔══╝██╔════╝██╔════╝██║  ██║"
    echo "  ███████║██║   ██║   █████╗  ██║     ███████║"
    echo "  ██╔══██║██║   ██║   ██╔══╝  ██║     ██╔══██║"
    echo "  ██║  ██║██║   ██║   ███████╗╚██████╗██║  ██║"
    echo "  ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝"
    echo ""
    echo -e "  ${CYAN}BENCHMARK v${SCRIPT_VERSION}${NC}${BOLD}  |  benchmark.codelab.vn${NC}"
    echo -e "${NC}"
}

# Check if command exists
cmd_exists() { command -v "$1" >/dev/null 2>&1; }

json_has_type() {
    local json_value="${1:-}"
    local json_type="$2"
    printf '%s' "$json_value" | jq -e "type == \"$json_type\"" >/dev/null 2>&1
}

append_network_result() {
    local item="$1"

    if ! json_has_type "$item" "object"; then
        return 0
    fi

    if ! json_has_type "${NETWORK_RESULTS:-[]}" "array"; then
        NETWORK_RESULTS="[]"
    fi

    NETWORK_RESULTS=$(printf '%s' "$NETWORK_RESULTS" | jq -c --argjson item "$item" '. + [$item]' 2>/dev/null || printf '%s' "$NETWORK_RESULTS")
}

append_network_measurement() {
    local location="$1"
    local server_host="$2"
    local download_mbps="${3:-}"
    local upload_mbps="${4:-}"
    local ping_ms="${5:-}"
    local ip_version="${6:-ipv4}"
    local test_type="${7:-download}"
    local protocol="${8:-https}"
    local item

    item=$(jq -cn \
        --arg location "$location" \
        --arg server_host "$server_host" \
        --arg download "$download_mbps" \
        --arg upload "$upload_mbps" \
        --arg ping "$ping_ms" \
        --arg ip_version "$ip_version" \
        --arg test_type "$test_type" \
        --arg protocol "$protocol" \
        '{location: $location, server_host: $server_host, ip_version: $ip_version, test_type: $test_type, protocol: $protocol}
        + (if $download != "" then {download_mbps: (($download|tonumber?) // 0)} else {} end)
        + (if $upload != "" then {upload_mbps: (($upload|tonumber?) // 0)} else {} end)
        + (if $ping != "" then {ping_ms: (($ping|tonumber?) // 0)} else {} end)' \
    2>/dev/null || echo '{}')

    append_network_result "$item"
}

# Get package manager
get_pkg_mgr() {
    if cmd_exists apt-get; then echo "apt"
    elif cmd_exists yum; then echo "yum"
    elif cmd_exists dnf; then echo "dnf"
    else echo "unknown"; fi
}

# Install a package
install_pkg() {
    local pkg="$1"
    local mgr
    mgr=$(get_pkg_mgr)
    info "Installing $pkg..."
    case "$mgr" in
        apt) run_as_root apt-get install -y -q "$pkg" >/dev/null 2>&1 || warn "Failed to install $pkg" ;;
        yum) run_as_root yum install -y -q "$pkg" >/dev/null 2>&1 || warn "Failed to install $pkg" ;;
        dnf) run_as_root dnf install -y -q "$pkg" >/dev/null 2>&1 || warn "Failed to install $pkg" ;;
        *) warn "Unknown package manager, cannot install $pkg" ;;
    esac
}

run_as_root() {
    if [ "${EUID:-$(id -u)}" -eq 0 ]; then
        "$@"
    elif cmd_exists sudo; then
        sudo "$@"
    else
        return 1
    fi
}

install_benchmark_dependencies() {
    local mgr
    mgr=$(get_pkg_mgr)

    local apt_packages=(
        fio sysbench iperf3 smartmontools dmidecode pciutils lshw hdparm ethtool
        nvme-cli bc jq curl wget dnsutils net-tools iproute2 lm-sensors util-linux
        zip unzip p7zip-full openssl gzip
    )

    local check_commands=(
        fio sysbench iperf3 smartctl dmidecode lspci lshw hdparm ethtool nvme
        bc jq curl wget host ifconfig ip sensors lsblk zip unzip 7z openssl gzip
    )

    local missing=()
    local dep
    for dep in "${check_commands[@]}"; do
        if ! cmd_exists "$dep"; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -eq 0 ]; then
        ok "Benchmark dependencies OK"
        return 0
    fi

    warn "Missing benchmark tools: ${missing[*]}"

    if [ "$mgr" = "apt" ]; then
        info "Installing recommended benchmark tools via apt..."
        if run_as_root env DEBIAN_FRONTEND=noninteractive apt-get update -y >/dev/null 2>&1 && \
           run_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "${apt_packages[@]}" >/dev/null 2>&1; then
            ok "Benchmark tools installed"
        else
            warn "Could not install all benchmark tools automatically. Continuing with available tools."
        fi
        return 0
    fi

    warn "Automatic full dependency install is optimized for apt-based systems. Continuing with available tools."
}

# Run command with timeout
timeout_run() {
    local timeout="$1"
    shift
    timeout "$timeout" "$@" 2>/dev/null || true
}

generate_nonce() {
    local nonce=""

    if cmd_exists openssl; then
        nonce=$(openssl rand -hex 16 2>/dev/null || true)
    fi

    if [ -z "$nonce" ]; then
        nonce=$(dd if=/dev/urandom bs=16 count=1 2>/dev/null | od -An -tx1 | tr -d ' \n' || true)
    fi

    if [ -z "$nonce" ]; then
        nonce="$(date +%s%N 2>/dev/null || date +%s)$$$RANDOM"
        if cmd_exists sha256sum; then
            nonce=$(printf '%s' "$nonce" | sha256sum | awk '{print substr($1,1,32)}')
        else
            nonce=$(printf '%s' "$nonce" | cksum | awk '{printf "%032x", $1}')
        fi
    fi

    printf '%s' "${nonce:0:32}"
}

is_interactive() {
    [ -t 0 ] && [ -t 1 ]
}

normalize_choice() {
    local value="${1:-}"
    value="${value,,}"
    case "$value" in
        2|private|priv|pvt) echo "private" ;;
        *) echo "public" ;;
    esac
}

parse_args() {
    BENCHMARK_TYPE=""
    ASSUME_YES="false"

    while [ $# -gt 0 ]; do
        case "$1" in
            --private)
                BENCHMARK_TYPE="private"
                ;;
            --public)
                BENCHMARK_TYPE="public"
                ;;
            --type)
                if [ $# -lt 2 ]; then
                    err "--type requires public or private"
                    exit 1
                fi
                shift
                BENCHMARK_TYPE="$(normalize_choice "$1")"
                ;;
            --yes|-y)
                ASSUME_YES="true"
                ;;
            --help|-h)
                cat <<HELP
HiTech Benchmark

Usage:
  curl -sL ${API_URL}/install | bash
  curl -sL ${API_URL}/install | bash -s -- --private
    bash <(wget -qO- ${API_URL}/install) --private --yes

Options:
  --public        Public result, appears in rankings. Default for pipe mode.
  --private       Private result, accessible by secret URL only.
  --type VALUE    public or private.
  --yes, -y       Do not ask for confirmation.
HELP
                exit 0
                ;;
            *)
                ;;
        esac
        shift
    done
}

# ============================================================
# Dependency Check
# ============================================================
check_deps() {
    section "Checking Dependencies"

    install_benchmark_dependencies

    local missing=()
    for dep in curl wget jq bc; do
        if ! cmd_exists "$dep"; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        warn "Missing: ${missing[*]}"
        if ! is_interactive; then
            install_choice="y"
            warn "Non-interactive pipe detected; installing required dependencies automatically."
        else
            read -rp "Install missing dependencies? [Y/n] " install_choice
        fi
        if [[ "${install_choice,,}" != "n" ]]; then
            for dep in "${missing[@]}"; do
                install_pkg "$dep"
            done
        else
            err "Cannot proceed without dependencies"
            exit 1
        fi
    fi

    # Optional: fio, sysbench, dmidecode
    for dep in fio sysbench; do
        if ! cmd_exists "$dep"; then
            warn "$dep not found — related tests will be skipped"
            warn "Install with: $(get_pkg_mgr) install $dep"
        fi
    done

    ok "Dependencies OK"
}

# ============================================================
# System Information Collection
# ============================================================
collect_system_info() {
    section "System Information"

    HOSTNAME_VAL=$(hostname -f 2>/dev/null || hostname 2>/dev/null || echo "unknown")
    ARCH=$(uname -m)
    KERNEL=$(uname -r)

    # OS detection
    if [ -f /etc/os-release ]; then
        source /etc/os-release
        OS_NAME="${NAME:-Unknown}"
        OS_VERSION="${VERSION_ID:-}"
    elif [ -f /etc/redhat-release ]; then
        OS_NAME=$(cat /etc/redhat-release | cut -d' ' -f1)
        OS_VERSION=$(cat /etc/redhat-release | grep -oP '\d+\.\d+' | head -1)
    else
        OS_NAME="Unknown"
        OS_VERSION=""
    fi

    # Virtualization / cloud / container fingerprint
    VIRT="unknown"
    HYPERVISOR_VENDOR=""
    CLOUD_PROVIDER_DETECTED=""
    CONTAINER_DETECTED="false"
    CGROUP_CPU_QUOTA=""
    CGROUP_CPU_MAX=""
    CGROUP_MEMORY_LIMIT_MB=""
    CGROUP_CPU_SHARES=""

    if cmd_exists systemd-detect-virt; then
        VIRT=$(systemd-detect-virt 2>/dev/null || echo "unknown")
    elif [ -f /proc/cpuinfo ] && grep -qi "hypervisor" /proc/cpuinfo; then
        VIRT="hypervisor"
    fi

    if [ -f /.dockerenv ] || grep -qaE 'docker|kubepods|containerd|lxc' /proc/1/cgroup /proc/self/cgroup 2>/dev/null; then
        VIRT="docker"
        CONTAINER_DETECTED="true"
    fi
    if [ -f /proc/vz/version ] 2>/dev/null; then VIRT="openvz"; fi

    if cmd_exists dmidecode; then
        HYPERVISOR_VENDOR=$(run_as_root dmidecode -s system-product-name 2>/dev/null | head -1 || true)
        [ -z "$HYPERVISOR_VENDOR" ] && HYPERVISOR_VENDOR=$(run_as_root dmidecode -s system-manufacturer 2>/dev/null | head -1 || true)
    fi
    [ -z "$HYPERVISOR_VENDOR" ] && HYPERVISOR_VENDOR=$(cat /sys/class/dmi/id/product_name 2>/dev/null || true)
    [ -z "$HYPERVISOR_VENDOR" ] && HYPERVISOR_VENDOR=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null || true)

    local hv_lc
    hv_lc=$(printf '%s' "$HYPERVISOR_VENDOR" | tr '[:upper:]' '[:lower:]')
    if echo "$hv_lc" | grep -q "amazon\|ec2"; then CLOUD_PROVIDER_DETECTED="aws"; VIRT="aws-nitro"; fi
    if echo "$hv_lc" | grep -q "google\|compute"; then CLOUD_PROVIDER_DETECTED="google-cloud"; VIRT="google-compute"; fi
    if echo "$hv_lc" | grep -q "oracle\|oci"; then CLOUD_PROVIDER_DETECTED="oracle-cloud"; fi
    if echo "$hv_lc" | grep -q "microsoft\|hyper-v\|hyperv"; then VIRT="hyper-v"; fi
    if echo "$hv_lc" | grep -q "xen"; then VIRT="xen"; fi
    if echo "$hv_lc" | grep -q "kvm\|qemu" && [ "$VIRT" = "unknown" ]; then VIRT="kvm"; fi
    if echo "$hv_lc" | grep -q "proxmox" || [ -d /etc/pve ]; then VIRT="proxmox"; fi
    if [ -r /sys/hypervisor/type ] && grep -qi xen /sys/hypervisor/type 2>/dev/null; then VIRT="xen"; fi

    if [ -f /sys/fs/cgroup/cpu.max ]; then
        CGROUP_CPU_MAX=$(cat /sys/fs/cgroup/cpu.max 2>/dev/null || true)
        CGROUP_CPU_QUOTA="$CGROUP_CPU_MAX"
    elif [ -f /sys/fs/cgroup/cpu/cpu.cfs_quota_us ]; then
        local quota period
        quota=$(cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us 2>/dev/null || true)
        period=$(cat /sys/fs/cgroup/cpu/cpu.cfs_period_us 2>/dev/null || true)
        [ -n "$quota" ] && [ -n "$period" ] && CGROUP_CPU_QUOTA="$quota/$period"
    fi
    if [ -f /sys/fs/cgroup/memory.max ]; then
        local mem_limit
        mem_limit=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || true)
        if [[ "$mem_limit" =~ ^[0-9]+$ ]] && [ "$mem_limit" -lt 9000000000000000000 ]; then
            CGROUP_MEMORY_LIMIT_MB=$((mem_limit / 1024 / 1024))
        fi
    elif [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
        local mem_limit
        mem_limit=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || true)
        if [[ "$mem_limit" =~ ^[0-9]+$ ]] && [ "$mem_limit" -lt 9000000000000000000 ]; then
            CGROUP_MEMORY_LIMIT_MB=$((mem_limit / 1024 / 1024))
        fi
    fi
    if [ -f /sys/fs/cgroup/cpu.weight ]; then
        CGROUP_CPU_SHARES=$(cat /sys/fs/cgroup/cpu.weight 2>/dev/null || true)
    elif [ -f /sys/fs/cgroup/cpu/cpu.shares ]; then
        CGROUP_CPU_SHARES=$(cat /sys/fs/cgroup/cpu/cpu.shares 2>/dev/null || true)
    fi

    # CPU info
    CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | sed 's/.*: //' | sed 's/  */ /g' || echo "Unknown")
    CPU_THREADS=$(nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo || echo "1")
    CPU_CORES=$(lscpu 2>/dev/null | awk -F: '/Core\(s\) per socket/ {gsub(/ /,"",$2); print $2}' | head -1)
    [ -z "$CPU_CORES" ] && CPU_CORES="$CPU_THREADS"
    CPU_FREQ=$(grep "cpu MHz" /proc/cpuinfo | head -1 | awk '{printf "%.0f", $4}' 2>/dev/null || echo "0")
    CPU_TEMP_C=""
    if cmd_exists sensors; then
        CPU_TEMP_C=$(sensors 2>/dev/null | awk '/Package id 0|Tctl|CPU:/ {for(i=1;i<=NF;i++) if ($i ~ /^\+[0-9.]+°C$/) {gsub(/[+°C]/,"",$i); print $i; exit}}' || true)
    fi

    # Memory
    RAM_TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    RAM_TOTAL_MB=$((RAM_TOTAL_KB / 1024))
    SWAP_TOTAL_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}' || echo "0")
    SWAP_TOTAL_MB=$((SWAP_TOTAL_KB / 1024))

    # Disk
    DISK_TOTAL_GB=$(df -BG / | tail -1 | awk '{print $2}' | tr -d 'G' || echo "0")

    # Uptime
    UPTIME_SECONDS=$(cat /proc/uptime | awk '{printf "%.0f", $1}')

    # Load average
    LOAD_AVG=$(cat /proc/loadavg | awk '{print $1, $2, $3}' | tr ' ' ',')

    # Print summary
    echo -e "  Hostname   : ${BOLD}$HOSTNAME_VAL${NC}"
    echo -e "  OS         : ${BOLD}$OS_NAME $OS_VERSION${NC}"
    echo -e "  Kernel     : $KERNEL ($ARCH)"
    echo -e "  Virt       : ${BOLD}$VIRT${NC}"
    [ -n "$HYPERVISOR_VENDOR" ] && echo -e "  Hypervisor : $HYPERVISOR_VENDOR"
    [ -n "$CLOUD_PROVIDER_DETECTED" ] && echo -e "  Cloud      : $CLOUD_PROVIDER_DETECTED"
    [ "$CONTAINER_DETECTED" = "true" ] && echo -e "  Container  : detected"
    echo -e "  CPU        : ${BOLD}$CPU_MODEL${NC}"
    echo -e "  CPU Cores  : $CPU_CORES cores / $CPU_THREADS threads @ ${CPU_FREQ} MHz"
    [ -n "$CPU_TEMP_C" ] && echo -e "  CPU Temp   : ${CPU_TEMP_C}°C"
    echo -e "  RAM        : ${BOLD}$(echo "$RAM_TOTAL_MB / 1024" | bc -l | xargs printf "%.1f") GB${NC}"
    echo -e "  Swap       : $(echo "$SWAP_TOTAL_MB / 1024" | bc -l | xargs printf "%.1f") GB"
    echo -e "  Disk (/)   : $DISK_TOTAL_GB GB"
    echo -e "  Uptime     : $(echo "$UPTIME_SECONDS / 86400" | bc)d $(echo "($UPTIME_SECONDS % 86400) / 3600" | bc)h"
    echo -e "  Load Avg   : $LOAD_AVG"
}

# ============================================================
# Network Information
# ============================================================
collect_network_info() {
    section "Network Information"

    IPV4=""
    IPV6=""
    ASN=""
    ISP=""
    ORG=""
    RDNS=""
    CITY=""
    REGION=""
    COUNTRY_CODE=""

    # Get IPv4
    for method in \
        "curl -4 -sf --max-time 5 https://api4.my-ip.io/ip" \
        "curl -4 -sf --max-time 5 https://ipv4.icanhazip.com" \
        "curl -4 -sf --max-time 5 https://api.ipify.org"; do
        IPV4=$(eval "$method" 2>/dev/null | tr -d '[:space:]')
        if [[ "$IPV4" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then break; fi
        IPV4=""
    done

    # Get IPv6
    IPV6=$(curl -6 -sf --max-time 5 https://ipv6.icanhazip.com 2>/dev/null | tr -d '[:space:]' || true)

    # Reverse DNS
    if [ -n "$IPV4" ] && cmd_exists host; then
        RDNS=$(host "$IPV4" 2>/dev/null | grep "domain name pointer" | head -1 | awk '{print $NF}' | sed 's/\.$//' || true)
    fi

    # GeoIP lookup
    if [ -n "$IPV4" ] && cmd_exists curl; then
        local geo_json
        geo_json=$(curl -sf --max-time 5 "http://ip-api.com/json/${IPV4}?fields=country,countryCode,region,city,isp,org,as" 2>/dev/null || echo '{}')

        if cmd_exists jq; then
            COUNTRY_CODE=$(echo "$geo_json" | jq -r '.countryCode // ""')
            CITY=$(echo "$geo_json" | jq -r '.city // ""')
            REGION=$(echo "$geo_json" | jq -r '.region // ""')
            ISP=$(echo "$geo_json" | jq -r '.isp // ""')
            ORG=$(echo "$geo_json" | jq -r '.org // ""')
            ASN_FULL=$(echo "$geo_json" | jq -r '.as // ""')
            ASN=$(echo "$ASN_FULL" | grep -oP '(?<=AS)\d+' || true)
        fi
    fi

    echo -e "  IPv4       : ${BOLD}${IPV4:-Not detected}${NC}"
    [ -n "$IPV6" ] && echo -e "  IPv6       : ${BOLD}$IPV6${NC}"
    [ -n "$ISP" ] && echo -e "  ISP        : $ISP"
    [ -n "$ORG" ] && echo -e "  Org        : $ORG"
    [ -n "$ASN" ] && echo -e "  ASN        : AS$ASN"
    [ -n "$RDNS" ] && echo -e "  rDNS       : $RDNS"
    [ -n "$CITY" ] && echo -e "  Location   : $CITY, ${REGION:+$REGION, }$COUNTRY_CODE"
}

# ============================================================
# Disk Benchmark
# ============================================================
run_disk_benchmark() {
    section "Disk Benchmark"

    DD_WRITE_MBPS=""
    DD_READ_MBPS=""
    FIO_READ_IOPS=""
    FIO_WRITE_IOPS=""
    FIO_READ_MBPS=""
    FIO_WRITE_MBPS=""
    FIO_READ_LAT_MS=""
    FIO_WRITE_LAT_MS=""
    DISK_DEVICE="/"
    DISK_MODEL=""
    DISK_TYPE="unknown"
    DISK_ROTATIONAL=""
    DISK_SCHEDULER=""
    DISK_SMART_HEALTH=""
    NVME_DETECTED="false"
    NVME_MODEL=""
    NVME_NAMESPACE_COUNT="0"
    FIO_4K_QD1_READ_IOPS=""
    FIO_4K_QD1_READ_LAT_MS=""
    FIO_4K_QD32_READ_IOPS=""
    FIO_4K_QD32_WRITE_IOPS=""
    FIO_4K_QD32_READ_LAT_MS=""
    FIO_4K_QD32_WRITE_LAT_MS=""
    FIO_SEQ_READ_MBPS=""
    FIO_SEQ_WRITE_MBPS=""

    if cmd_exists findmnt && cmd_exists lsblk; then
        ROOT_SRC=$(findmnt -no SOURCE / 2>/dev/null | xargs basename 2>/dev/null || true)
        ROOT_PK=$(lsblk -no PKNAME "/dev/$ROOT_SRC" 2>/dev/null | head -1 || true)
        [ -z "$ROOT_PK" ] && ROOT_PK="$ROOT_SRC"
        if [ -n "$ROOT_PK" ] && [ -e "/dev/$ROOT_PK" ]; then
            DISK_DEVICE="/dev/$ROOT_PK"
            DISK_MODEL=$(lsblk -ndo MODEL "/dev/$ROOT_PK" 2>/dev/null | xargs || true)
            DISK_ROTATIONAL=$(lsblk -ndo ROTA "/dev/$ROOT_PK" 2>/dev/null | xargs || true)
            DISK_SCHEDULER=$(cat "/sys/block/$ROOT_PK/queue/scheduler" 2>/dev/null | tr -d '[]' || true)
            [ "$DISK_ROTATIONAL" = "0" ] && DISK_TYPE="ssd"
            [ "$DISK_ROTATIONAL" = "1" ] && DISK_TYPE="hdd"
            echo "$ROOT_PK" | grep -qi '^nvme' && DISK_TYPE="nvme"
        fi
    fi

    if cmd_exists nvme; then
        NVME_LIST=$(nvme list 2>/dev/null || true)
        if echo "$NVME_LIST" | grep -q '^/dev/nvme'; then
            NVME_DETECTED="true"
            NVME_MODEL=$(echo "$NVME_LIST" | awk '/^\/dev\/nvme/ {$1=""; print; exit}' | xargs || true)
            NVME_NAMESPACE_COUNT=$(echo "$NVME_LIST" | grep -c '^/dev/nvme' || echo "0")
            DISK_TYPE="nvme"
        fi
    fi

    if cmd_exists smartctl && [ -b "$DISK_DEVICE" ]; then
        DISK_SMART_HEALTH=$(run_as_root smartctl -H "$DISK_DEVICE" 2>/dev/null | awk -F: '/overall-health|SMART Health/ {gsub(/^ +| +$/,"",$2); print $2; exit}' || true)
    fi

    echo -e "  Device     : ${BOLD}$DISK_DEVICE${NC} ${DISK_MODEL:+($DISK_MODEL)}"
    echo -e "  Disk Type  : $DISK_TYPE"
    [ "$NVME_DETECTED" = "true" ] && echo -e "  NVMe       : detected ($NVME_NAMESPACE_COUNT namespace(s))"

    # DD write test
    echo -ne "  DD Write   : "
    local dd_write
    dd_write=$(dd if=/dev/zero of="$DISK_TEST_FILE" bs=1M count=512 conv=fdatasync 2>&1 | grep -oP '[0-9.]+ [GM]B/s' | head -1 || echo "")
    if [ -n "$dd_write" ]; then
        DD_WRITE_MBPS=$(echo "$dd_write" | awk '{
            val=$1; unit=$2;
            if (unit=="GB/s") val=val*1024;
            printf "%.1f", val
        }')
        echo -e "${GREEN}$dd_write${NC}"
    else
        echo -e "${YELLOW}N/A${NC}"
    fi

    # DD read test
    echo -ne "  DD Read    : "
    sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
    dd_read=$(dd if="$DISK_TEST_FILE" of=/dev/null bs=1M count=512 2>&1 | grep -oP '[0-9.]+ [GM]B/s' | head -1 || echo "")
    if [ -n "$dd_read" ]; then
        DD_READ_MBPS=$(echo "$dd_read" | awk '{
            val=$1; unit=$2;
            if (unit=="GB/s") val=val*1024;
            printf "%.1f", val
        }')
        echo -e "${GREEN}$dd_read${NC}"
    else
        echo -e "${YELLOW}N/A${NC}"
    fi

    rm -f "$DISK_TEST_FILE"

    # FIO test (if available)
    if cmd_exists fio; then
        echo -ne "  FIO R-IOPS : "
        local fio_result
        fio_result=$(timeout_run 60 fio \
            --name=randread --ioengine=libaio --iodepth=32 \
            --rw=randread --bs=4k --direct=1 --size=512M \
            --numjobs=4 --runtime=10 --group_reporting \
            --output-format=json --filename="$TMP_DIR/fio_test" 2>/dev/null || echo '{}')

        FIO_READ_IOPS=$(echo "$fio_result" | jq -r '.jobs[0].read.iops // 0' 2>/dev/null | xargs printf "%.0f")
        FIO_READ_LAT_MS=$(echo "$fio_result" | jq -r '.jobs[0].read.lat_ns.mean // 0' 2>/dev/null | awk '{printf "%.2f", $1/1000000}')
        FIO_READ_BW=$(echo "$fio_result" | jq -r '.jobs[0].read.bw // 0' 2>/dev/null)
        FIO_READ_MBPS=$(echo "$FIO_READ_BW" | awk '{printf "%.1f", $1/1024}')
        echo -e "${GREEN}${FIO_READ_IOPS:-0} IOPS${NC}"

        echo -ne "  FIO W-IOPS : "
        fio_result=$(timeout_run 60 fio \
            --name=randwrite --ioengine=libaio --iodepth=32 \
            --rw=randwrite --bs=4k --direct=1 --size=512M \
            --numjobs=4 --runtime=10 --group_reporting \
            --output-format=json --filename="$TMP_DIR/fio_test" 2>/dev/null || echo '{}')

        FIO_WRITE_IOPS=$(echo "$fio_result" | jq -r '.jobs[0].write.iops // 0' 2>/dev/null | xargs printf "%.0f")
        FIO_WRITE_LAT_MS=$(echo "$fio_result" | jq -r '.jobs[0].write.lat_ns.mean // 0' 2>/dev/null | awk '{printf "%.2f", $1/1000000}')
        FIO_WRITE_BW=$(echo "$fio_result" | jq -r '.jobs[0].write.bw // 0' 2>/dev/null)
        FIO_WRITE_MBPS=$(echo "$FIO_WRITE_BW" | awk '{printf "%.1f", $1/1024}')
        echo -e "${GREEN}${FIO_WRITE_IOPS:-0} IOPS${NC}"

        echo -ne "  4K QD1     : "
        fio_result=$(timeout_run 45 fio \
            --name=rand4kqd1 --ioengine=libaio --iodepth=1 \
            --rw=randread --bs=4k --direct=1 --size=256M \
            --numjobs=1 --runtime=15 --time_based --group_reporting \
            --output-format=json --filename="$TMP_DIR/fio_4k_qd1" 2>/dev/null || echo '{}')
        FIO_4K_QD1_READ_IOPS=$(echo "$fio_result" | jq -r '.jobs[0].read.iops // 0' 2>/dev/null | xargs printf "%.0f" 2>/dev/null || echo "0")
        FIO_4K_QD1_READ_LAT_MS=$(echo "$fio_result" | jq -r '((.jobs[0].read.clat_ns.mean // .jobs[0].read.lat_ns.mean // 0) / 1000000)' 2>/dev/null | xargs printf "%.3f" 2>/dev/null || echo "0")
        echo -e "${GREEN}${FIO_4K_QD1_READ_IOPS:-0} IOPS${NC} (${FIO_4K_QD1_READ_LAT_MS:-0} ms)"

        echo -ne "  4K QD32    : "
        fio_result=$(timeout_run 45 fio \
            --name=rand4kqd32 --ioengine=libaio --iodepth=32 \
            --rw=randrw --rwmixread=70 --bs=4k --direct=1 --size=512M \
            --numjobs=1 --runtime=15 --time_based --group_reporting \
            --output-format=json --filename="$TMP_DIR/fio_4k_qd32" 2>/dev/null || echo '{}')
        FIO_4K_QD32_READ_IOPS=$(echo "$fio_result" | jq -r '.jobs[0].read.iops // 0' 2>/dev/null | xargs printf "%.0f" 2>/dev/null || echo "0")
        FIO_4K_QD32_WRITE_IOPS=$(echo "$fio_result" | jq -r '.jobs[0].write.iops // 0' 2>/dev/null | xargs printf "%.0f" 2>/dev/null || echo "0")
        FIO_4K_QD32_READ_LAT_MS=$(echo "$fio_result" | jq -r '((.jobs[0].read.clat_ns.mean // .jobs[0].read.lat_ns.mean // 0) / 1000000)' 2>/dev/null | xargs printf "%.3f" 2>/dev/null || echo "0")
        FIO_4K_QD32_WRITE_LAT_MS=$(echo "$fio_result" | jq -r '((.jobs[0].write.clat_ns.mean // .jobs[0].write.lat_ns.mean // 0) / 1000000)' 2>/dev/null | xargs printf "%.3f" 2>/dev/null || echo "0")
        echo -e "${GREEN}${FIO_4K_QD32_READ_IOPS:-0}/${FIO_4K_QD32_WRITE_IOPS:-0} IOPS${NC}"

        echo -ne "  FIO Seq    : "
        local fio_seq_read fio_seq_write
        fio_seq_read=$(timeout_run 40 fio \
            --name=seqread --ioengine=libaio --iodepth=16 \
            --rw=read --bs=1M --direct=1 --size=512M \
            --numjobs=1 --runtime=12 --time_based --group_reporting \
            --output-format=json --filename="$TMP_DIR/fio_seq" 2>/dev/null || echo '{}')
        fio_seq_write=$(timeout_run 40 fio \
            --name=seqwrite --ioengine=libaio --iodepth=16 \
            --rw=write --bs=1M --direct=1 --size=512M \
            --numjobs=1 --runtime=12 --time_based --group_reporting \
            --output-format=json --filename="$TMP_DIR/fio_seq" 2>/dev/null || echo '{}')
        FIO_SEQ_READ_MBPS=$(echo "$fio_seq_read" | jq -r '((.jobs[0].read.bw_bytes // 0) / 1048576)' 2>/dev/null | xargs printf "%.1f" 2>/dev/null || echo "0")
        FIO_SEQ_WRITE_MBPS=$(echo "$fio_seq_write" | jq -r '((.jobs[0].write.bw_bytes // 0) / 1048576)' 2>/dev/null | xargs printf "%.1f" 2>/dev/null || echo "0")
        echo -e "${GREEN}${FIO_SEQ_READ_MBPS:-0}/${FIO_SEQ_WRITE_MBPS:-0} MB/s${NC}"

        rm -f "$TMP_DIR/fio_test" "$TMP_DIR/fio_4k_qd1" "$TMP_DIR/fio_4k_qd32" "$TMP_DIR/fio_seq" 2>/dev/null || true
    else
        warn "fio not available, skipping IOPS test"
    fi
}

# ============================================================
# CPU Benchmark
# ============================================================
run_cpu_benchmark() {
    section "CPU Benchmark"

    SYSBENCH_SINGLE=""
    SYSBENCH_MULTI=""
    EVENTS_PER_SEC=""
    COMPRESSION_SCORE=""
    SEVENZIP_MIPS=""
    GZIP_MBPS=""
    OPENSSL_SHA256_MBPS=""
    OPENSSL_AES256_MBPS=""

    if cmd_exists sysbench; then
        # Single-thread
        echo -ne "  Single-core: "
        local single_result
        single_result=$(timeout_run 30 sysbench cpu --cpu-max-prime=20000 --threads=1 --time=10 run 2>/dev/null || echo "")
        if [ -n "$single_result" ]; then
            EVENTS_PER_SEC=$(echo "$single_result" | grep "events per second" | awk '{print $NF}' | xargs printf "%.2f")
            SYSBENCH_SINGLE=$EVENTS_PER_SEC
            echo -e "${GREEN}${EVENTS_PER_SEC} eps${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi

        # Multi-thread
        echo -ne "  Multi-core : "
        local multi_result
        multi_result=$(timeout_run 30 sysbench cpu --cpu-max-prime=20000 --threads="${CPU_THREADS:-$CPU_CORES}" --time=10 run 2>/dev/null || echo "")
        if [ -n "$multi_result" ]; then
            SYSBENCH_MULTI=$(echo "$multi_result" | grep "events per second" | awk '{print $NF}' | xargs printf "%.2f")
            echo -e "${GREEN}${SYSBENCH_MULTI} eps${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi
    else
        warn "sysbench not available, skipping CPU test"
    fi

    # Compression benchmark (7z or pigz)
    echo -ne "  Compress   : "
    if cmd_exists 7z || cmd_exists 7za; then
        local compress_cmd
        compress_cmd=$(cmd_exists 7za && echo "7za" || echo "7z")
        local compress_result
        compress_result=$(timeout_run 20 $compress_cmd b -mmt="$CPU_CORES" 2>/dev/null | grep "Avr:" | tail -1 | awk '{print $4}' || echo "")
        if [ -n "$compress_result" ]; then
            COMPRESSION_SCORE="$compress_result"
            SEVENZIP_MIPS="$compress_result"
            echo -e "${GREEN}${compress_result} MIPS${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi
    elif cmd_exists dd && cmd_exists gzip; then
        local start_ns end_ns elapsed_ns
        start_ns=$(date +%s%N 2>/dev/null || echo "0")
        dd if=/dev/zero bs=1M count=128 2>/dev/null | gzip -1 > /dev/null || true
        end_ns=$(date +%s%N 2>/dev/null || echo "0")
        if [[ "$start_ns" =~ ^[0-9]+$ ]] && [[ "$end_ns" =~ ^[0-9]+$ ]] && [ "$end_ns" -gt "$start_ns" ]; then
            elapsed_ns=$((end_ns - start_ns))
            GZIP_MBPS=$(awk -v bytes=$((128 * 1024 * 1024)) -v ns="$elapsed_ns" 'BEGIN {printf "%.1f", (bytes*8)/(ns/1000000000)/1000000}')
            COMPRESSION_SCORE="$GZIP_MBPS"
            echo -e "${GREEN}${GZIP_MBPS} Mbps${NC}"
        else
            echo -e "${YELLOW}Limited${NC}"
        fi
    else
        echo -e "${YELLOW}N/A${NC}"
    fi

    if cmd_exists openssl; then
        echo -ne "  SHA256     : "
        local sha_result aes_result
        sha_result=$(timeout_run 12 openssl speed -elapsed -seconds 5 -evp sha256 2>/dev/null || echo "")
        OPENSSL_SHA256_MBPS=$(echo "$sha_result" | awk 'tolower($1) ~ /sha256/ {v=$NF; gsub(/k/,"",v); printf "%.1f", v/1024; exit}' || true)
        if [ -n "$OPENSSL_SHA256_MBPS" ]; then
            echo -e "${GREEN}${OPENSSL_SHA256_MBPS} MB/s${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi

        echo -ne "  AES-256    : "
        aes_result=$(timeout_run 12 openssl speed -elapsed -seconds 5 -evp aes-256-cbc 2>/dev/null || echo "")
        OPENSSL_AES256_MBPS=$(echo "$aes_result" | awk 'tolower($1) ~ /aes-256/ {v=$NF; gsub(/k/,"",v); printf "%.1f", v/1024; exit}' || true)
        if [ -n "$OPENSSL_AES256_MBPS" ]; then
            echo -e "${GREEN}${OPENSSL_AES256_MBPS} MB/s${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi
    fi
}

# ============================================================
# Memory Benchmark
# ============================================================
run_memory_benchmark() {
    section "Memory Benchmark"

    MEM_READ_MBPS=""
    MEM_WRITE_MBPS=""
    MEM_LAT_NS=""
    MEM_RANDOM_READ_MBPS=""
    MEM_RANDOM_WRITE_MBPS=""

    if cmd_exists sysbench; then
        echo -ne "  Read Speed : "
        local mem_read
        mem_read=$(timeout_run 20 sysbench memory --memory-block-size=1M --memory-total-size=10G --memory-oper=read --threads=1 run 2>/dev/null || echo "")
        if [ -n "$mem_read" ]; then
            MEM_READ_MBPS=$(echo "$mem_read" | grep "transferred" | grep -oP '[0-9.]+ MiB/sec' | awk '{printf "%.1f", $1}')
            echo -e "${GREEN}${MEM_READ_MBPS:-0} MB/s${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi

        echo -ne "  Write Speed: "
        local mem_write
        mem_write=$(timeout_run 20 sysbench memory --memory-block-size=1M --memory-total-size=10G --memory-oper=write --threads=1 run 2>/dev/null || echo "")
        if [ -n "$mem_write" ]; then
            MEM_WRITE_MBPS=$(echo "$mem_write" | grep "transferred" | grep -oP '[0-9.]+ MiB/sec' | awk '{printf "%.1f", $1}')
            echo -e "${GREEN}${MEM_WRITE_MBPS:-0} MB/s${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi

        echo -ne "  Random Read: "
        local mem_rand_read
        mem_rand_read=$(timeout_run 20 sysbench memory --memory-block-size=4K --memory-total-size=2G --memory-access-mode=rnd --memory-oper=read --threads=1 run 2>/dev/null || echo "")
        if [ -n "$mem_rand_read" ]; then
            MEM_RANDOM_READ_MBPS=$(echo "$mem_rand_read" | grep "transferred" | grep -oP '[0-9.]+ MiB/sec' | awk '{printf "%.1f", $1}')
            local avg_ms
            avg_ms=$(echo "$mem_rand_read" | awk '/avg:/ {print $2; exit}' || true)
            if [ -n "$avg_ms" ]; then
                MEM_LAT_NS=$(awk -v ms="$avg_ms" 'BEGIN {printf "%.0f", ms*1000000}')
            fi
            echo -e "${GREEN}${MEM_RANDOM_READ_MBPS:-0} MB/s${MEM_LAT_NS:+, ${MEM_LAT_NS}ns avg}${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi

        echo -ne "  Random Writ: "
        local mem_rand_write
        mem_rand_write=$(timeout_run 20 sysbench memory --memory-block-size=4K --memory-total-size=2G --memory-access-mode=rnd --memory-oper=write --threads=1 run 2>/dev/null || echo "")
        if [ -n "$mem_rand_write" ]; then
            MEM_RANDOM_WRITE_MBPS=$(echo "$mem_rand_write" | grep "transferred" | grep -oP '[0-9.]+ MiB/sec' | awk '{printf "%.1f", $1}')
            echo -e "${GREEN}${MEM_RANDOM_WRITE_MBPS:-0} MB/s${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi
    else
        warn "sysbench not available, skipping memory test"
    fi
}

# ============================================================
# Network Speed Test
# ============================================================
run_network_benchmark() {
    section "Network Speed Test"

    NETWORK_RESULTS="[]"

    local locations=(
        "Vietnam (HCM)|http://speedtest.fpt.vn/speedtest/random4000x4000.jpg|VN-HCM"
        "Singapore|https://sgp-ping.vultr.com/vultr.com.1000MB.bin|SG"
        "Japan (Tokyo)|https://hnd-jp-ping.vultr.com/vultr.com.1000MB.bin|JP-TYO"
        "USA (LA)|https://lax-ca-us-ping.vultr.com/vultr.com.1000MB.bin|US-LA"
        "Germany (Frankfurt)|https://fra-de-ping.vultr.com/vultr.com.1000MB.bin|DE-FRA"
    )

    for loc_info in "${locations[@]}"; do
        IFS='|' read -r loc_name loc_url loc_code <<< "$loc_info"
        echo -ne "  ${loc_name}: "

        local download_mbps="" upload_mbps="" ping_ms=""

        # Ping test
        if cmd_exists ping; then
            local ping_host
            ping_host=$(echo "$loc_url" | sed 's|https*://||' | cut -d'/' -f1)
            ping_ms=$(timeout_run 10 ping -c 3 -W 2 "$ping_host" 2>/dev/null | tail -1 | awk -F'/' '{printf "%.1f", $5}' || echo "")
        fi

        # Download speed test (10 second limit)
        local dl_bytes
        dl_bytes=$(timeout_run 12 curl -sf --max-time 10 -o /dev/null -w "%{size_download}" "$loc_url" 2>/dev/null || echo "0")
        if [ -n "$dl_bytes" ] && [ "$dl_bytes" != "0" ]; then
            download_mbps=$(echo "$dl_bytes" | awk '{printf "%.1f", $1*8/10/1048576}')
        fi

        if [ -n "$download_mbps" ] && [ "$download_mbps" != "0.0" ]; then
            echo -e "${GREEN}↓ ${download_mbps} Mbps${ping_ms:+, ${ping_ms}ms}${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi

        append_network_measurement "$loc_code" "$(echo "$loc_url" | sed 's|https*://||' | cut -d'/' -f1)" "$download_mbps" "" "$ping_ms" "ipv4" "download" "https"
    done

    if [ -n "${IPV6:-}" ]; then
        echo -ne "  IPv6 Cloudflare: "
        local ipv6_ping="" ipv6_bytes="" ipv6_mbps=""
        if cmd_exists ping; then
            ipv6_ping=$(timeout_run 10 ping -6 -c 3 -W 2 one.one.one.one 2>/dev/null | tail -1 | awk -F'/' '{printf "%.1f", $5}' || echo "")
        fi
        ipv6_bytes=$(timeout_run 12 curl -6 -sf --max-time 10 -o /dev/null -w "%{size_download}" "https://speed.cloudflare.com/__down?bytes=25000000" 2>/dev/null || echo "0")
        if [ -n "$ipv6_bytes" ] && [ "$ipv6_bytes" != "0" ]; then
            ipv6_mbps=$(echo "$ipv6_bytes" | awk '{printf "%.1f", $1*8/10/1000000}')
        fi
        if [ -n "$ipv6_mbps" ] && [ "$ipv6_mbps" != "0.0" ]; then
            echo -e "${GREEN}↓ ${ipv6_mbps} Mbps${ipv6_ping:+, ${ipv6_ping}ms}${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi
        append_network_measurement "CF-IPv6" "speed.cloudflare.com" "$ipv6_mbps" "" "$ipv6_ping" "ipv6" "download" "https"
    fi

    echo -ne "  Cloudflare : "
    local cf_download="" cf_upload="" cf_ping="" cf_bytes="" cf_upload_json=""
    if cmd_exists ping; then
        cf_ping=$(timeout_run 10 ping -c 3 -W 2 speed.cloudflare.com 2>/dev/null | tail -1 | awk -F'/' '{printf "%.1f", $5}' || echo "")
    fi
    cf_bytes=$(timeout_run 12 curl -4 -sf --max-time 10 -o /dev/null -w "%{size_download}" "https://speed.cloudflare.com/__down?bytes=50000000" 2>/dev/null || echo "0")
    if [ -n "$cf_bytes" ] && [ "$cf_bytes" != "0" ]; then
        cf_download=$(echo "$cf_bytes" | awk '{printf "%.1f", $1*8/10/1000000}')
    fi
    cf_upload_json=$(timeout_run 12 curl -4 -sf --max-time 10 -o /dev/null -w "%{size_upload}" -X POST --data-binary @/dev/zero "https://speed.cloudflare.com/__up" 2>/dev/null || echo "0")
    if [ -n "$cf_upload_json" ] && [ "$cf_upload_json" != "0" ]; then
        cf_upload=$(echo "$cf_upload_json" | awk '{printf "%.1f", $1*8/10/1000000}')
    fi
    if [ -n "$cf_download" ] && [ "$cf_download" != "0.0" ]; then
        echo -e "${GREEN}↓ ${cf_download} Mbps${cf_upload:+, ↑ ${cf_upload} Mbps}${cf_ping:+, ${cf_ping}ms}${NC}"
    else
        echo -e "${YELLOW}N/A${NC}"
    fi
    append_network_measurement "Cloudflare" "speed.cloudflare.com" "$cf_download" "$cf_upload" "$cf_ping" "ipv4" "cloudflare" "https"

    if cmd_exists iperf3; then
        local iperf_servers=(
            "iperf3.net|iperf3.net"
            "ping.online.net|ping.online.net"
            "bouygues.iperf.fr|bouygues.iperf.fr"
        )
        for iperf_info in "${iperf_servers[@]}"; do
            IFS='|' read -r iperf_loc iperf_host <<< "$iperf_info"
            echo -ne "  iperf3 ${iperf_host}: "
            local iperf_json iperf_down iperf_up iperf_ping
            iperf_json=$(timeout_run 18 iperf3 -c "$iperf_host" -p 5201 -t 5 -J 2>/dev/null || echo '{}')
            iperf_down=$(echo "$iperf_json" | jq -r '((.end.sum_received.bits_per_second // .end.sum.bits_per_second // 0) / 1000000)' 2>/dev/null | xargs printf "%.1f" 2>/dev/null || echo "0")
            iperf_ping=$(timeout_run 8 ping -c 3 -W 2 "$iperf_host" 2>/dev/null | tail -1 | awk -F'/' '{printf "%.1f", $5}' || echo "")
            if [ -n "$iperf_down" ] && [ "$iperf_down" != "0.0" ]; then
                echo -e "${GREEN}↓ ${iperf_down} Mbps${iperf_ping:+, ${iperf_ping}ms}${NC}"
                append_network_measurement "iperf3-${iperf_loc}" "$iperf_host" "$iperf_down" "$iperf_up" "$iperf_ping" "ipv4" "iperf3" "tcp"
                break
            else
                echo -e "${YELLOW}N/A${NC}"
            fi
        done
    fi
}

# ============================================================
# Security Information
# ============================================================
collect_security_info() {
    section "Security Information"

    local open_ports="[]"
    local firewall=false
    local firewall_name=""
    local ufw_status=""
    local ufw_rules_count="0"
    local selinux=false
    local selinux_status="unknown"
    local apparmor=false
    local apparmor_profile_count="0"
    local fail2ban_installed=false
    local fail2ban_active=false
    local ssh_permit_root_login="unknown"
    local ssh_password_authentication="unknown"
    local kernel_lockdown="unknown"
    local unprivileged_bpf_disabled=""
    local kptr_restrict=""
    local dmesg_restrict=""

    # Check firewall
    if cmd_exists ufw && ufw status 2>/dev/null | grep -q "active"; then
        firewall=true
        firewall_name="ufw"
        ufw_status="active"
        ufw_rules_count=$(ufw status numbered 2>/dev/null | grep -c '^\[' || echo "0")
        echo -e "  Firewall   : ${GREEN}UFW active${NC}"
    elif cmd_exists firewall-cmd && firewall-cmd --state 2>/dev/null | grep -q "running"; then
        firewall=true
        firewall_name="firewalld"
        echo -e "  Firewall   : ${GREEN}firewalld active${NC}"
    elif cmd_exists iptables && iptables -L 2>/dev/null | grep -q "^Chain"; then
        firewall_name="iptables"
        echo -e "  Firewall   : ${YELLOW}iptables (check manually)${NC}"
    else
        echo -e "  Firewall   : ${YELLOW}None detected${NC}"
    fi

    # SELinux
    if cmd_exists getenforce; then
        selinux_status=$(getenforce 2>/dev/null || echo "disabled")
        if [ "$selinux_status" = "Enforcing" ] || [ "$selinux_status" = "Permissive" ]; then
            selinux=true
            echo -e "  SELinux    : ${GREEN}$selinux_status${NC}"
        fi
    fi

    # AppArmor
    if cmd_exists aa-status || [ -d /sys/kernel/security/apparmor ]; then
        apparmor=true
        apparmor_profile_count=$(aa-status 2>/dev/null | awk '/profiles are loaded/ {print $1; exit}' || echo "0")
        echo -e "  AppArmor   : ${GREEN}Active${NC}"
    fi

    if cmd_exists fail2ban-client; then
        fail2ban_installed=true
        if fail2ban-client ping 2>/dev/null | grep -qi pong; then
            fail2ban_active=true
        fi
        echo -e "  Fail2ban   : $([ "$fail2ban_active" = true ] && echo "${GREEN}active${NC}" || echo "${YELLOW}installed/inactive${NC}")"
    fi

    if [ -f /etc/ssh/sshd_config ]; then
        ssh_permit_root_login=$(awk 'tolower($1)=="permitrootlogin" {v=$2} END {print v}' /etc/ssh/sshd_config 2>/dev/null || true)
        ssh_password_authentication=$(awk 'tolower($1)=="passwordauthentication" {v=$2} END {print v}' /etc/ssh/sshd_config 2>/dev/null || true)
        ssh_permit_root_login=${ssh_permit_root_login:-prohibit-password}
        ssh_password_authentication=${ssh_password_authentication:-yes}
        echo -e "  SSH Root   : $ssh_permit_root_login"
        echo -e "  SSH Pass   : $ssh_password_authentication"
    fi

    if [ -r /sys/kernel/security/lockdown ]; then
        kernel_lockdown=$(cat /sys/kernel/security/lockdown 2>/dev/null | tr -d '[]' || echo "unknown")
    fi
    [ -r /proc/sys/kernel/unprivileged_bpf_disabled ] && unprivileged_bpf_disabled=$(cat /proc/sys/kernel/unprivileged_bpf_disabled 2>/dev/null || true)
    [ -r /proc/sys/kernel/kptr_restrict ] && kptr_restrict=$(cat /proc/sys/kernel/kptr_restrict 2>/dev/null || true)
    [ -r /proc/sys/kernel/dmesg_restrict ] && dmesg_restrict=$(cat /proc/sys/kernel/dmesg_restrict 2>/dev/null || true)

    # Common open ports (quick check)
    for port in 21 22 25 53 80 110 143 443 465 587 993 995 3306 5432 6379 8080 8443 9200 9300 27017; do
        if cmd_exists ss; then
            if ss -tlnp 2>/dev/null | grep -q ":$port "; then
                open_ports=$(echo "$open_ports" | jq ". + [$port]" 2>/dev/null || echo "$open_ports")
            fi
        fi
    done

    echo -e "  Virt Type  : $VIRT"

    SECURITY_JSON=$(jq -n \
        --argjson firewall "$firewall" \
        --argjson selinux "$selinux" \
        --argjson apparmor "$apparmor" \
        --argjson open_ports "$open_ports" \
        --arg virt "$VIRT" \
        --arg cloud "${CLOUD_PROVIDER_DETECTED:-}" \
        --arg firewall_name "$firewall_name" \
        --arg ufw_status "$ufw_status" \
        --arg ufw_rules_count "$ufw_rules_count" \
        --arg selinux_status "$selinux_status" \
        --arg apparmor_profile_count "$apparmor_profile_count" \
        --arg fail2ban_installed "$fail2ban_installed" \
        --arg fail2ban_active "$fail2ban_active" \
        --arg ssh_permit_root_login "$ssh_permit_root_login" \
        --arg ssh_password_authentication "$ssh_password_authentication" \
        --arg kernel_lockdown "$kernel_lockdown" \
        --arg unprivileged_bpf_disabled "$unprivileged_bpf_disabled" \
        --arg kptr_restrict "$kptr_restrict" \
        --arg dmesg_restrict "$dmesg_restrict" \
        '{
            firewall_detected: $firewall,
            firewall_name: $firewall_name,
            ufw_status: $ufw_status,
            ufw_rules_count: (($ufw_rules_count|tonumber?) // 0),
            selinux: $selinux,
            selinux_status: $selinux_status,
            apparmor: $apparmor,
            apparmor_profile_count: (($apparmor_profile_count|tonumber?) // 0),
            fail2ban_installed: ($fail2ban_installed == "true"),
            fail2ban_active: ($fail2ban_active == "true"),
            ssh_permit_root_login: $ssh_permit_root_login,
            ssh_password_authentication: $ssh_password_authentication,
            kernel_lockdown: $kernel_lockdown,
            kernel_hardening: {
                unprivileged_bpf_disabled: ($unprivileged_bpf_disabled == "1" or $unprivileged_bpf_disabled == "2"),
                kptr_restrict: ($kptr_restrict == "1" or $kptr_restrict == "2"),
                dmesg_restrict: ($dmesg_restrict == "1")
            },
            open_ports: $open_ports,
            virtualization_type: $virt
        } + (if $cloud != "" then {cloud_provider: $cloud} else {} end)' \
    2>/dev/null || echo '{}')
}

# ============================================================
# Build JSON Payload
# ============================================================
build_payload() {
    section "Preparing Results"

    local benchmark_type="$1"
    local timestamp
    timestamp=$(date +%s)
    local nonce
    nonce=$(generate_nonce)
    if [ -z "$nonce" ]; then
        err "Cannot generate benchmark nonce"
        return 1
    fi

    # Build disk results array
    local disk_results
    disk_results=$(jq -n \
        --arg device "${DISK_DEVICE:-/}" \
        --arg model "${DISK_MODEL:-}" \
        --arg disk_type "${DISK_TYPE:-unknown}" \
        --arg disk_rotational "${DISK_ROTATIONAL:-}" \
        --arg disk_scheduler "${DISK_SCHEDULER:-}" \
        --arg disk_smart_health "${DISK_SMART_HEALTH:-}" \
        --arg nvme_detected "${NVME_DETECTED:-false}" \
        --arg nvme_model "${NVME_MODEL:-}" \
        --arg nvme_namespace_count "${NVME_NAMESPACE_COUNT:-}" \
        --arg dd_w "${DD_WRITE_MBPS:-}" \
        --arg dd_r "${DD_READ_MBPS:-}" \
        --arg fio_ri "${FIO_READ_IOPS:-}" \
        --arg fio_wi "${FIO_WRITE_IOPS:-}" \
        --arg fio_rm "${FIO_READ_MBPS:-}" \
        --arg fio_wm "${FIO_WRITE_MBPS:-}" \
        --arg fio_rl "${FIO_READ_LAT_MS:-}" \
        --arg fio_wl "${FIO_WRITE_LAT_MS:-}" \
        --arg fio_4k_qd1_ri "${FIO_4K_QD1_READ_IOPS:-}" \
        --arg fio_4k_qd1_rl "${FIO_4K_QD1_READ_LAT_MS:-}" \
        --arg fio_4k_qd32_ri "${FIO_4K_QD32_READ_IOPS:-}" \
        --arg fio_4k_qd32_wi "${FIO_4K_QD32_WRITE_IOPS:-}" \
        --arg fio_4k_qd32_rl "${FIO_4K_QD32_READ_LAT_MS:-}" \
        --arg fio_4k_qd32_wl "${FIO_4K_QD32_WRITE_LAT_MS:-}" \
        --arg fio_seq_r "${FIO_SEQ_READ_MBPS:-}" \
        --arg fio_seq_w "${FIO_SEQ_WRITE_MBPS:-}" \
        '[{device: $device} +
        (if $model != "" then {model: $model} else {} end) +
        (if $disk_type != "" then {disk_type: $disk_type} else {} end) +
        (if $disk_rotational != "" then {rotational: ($disk_rotational == "1")} else {} end) +
        (if $disk_scheduler != "" then {scheduler: $disk_scheduler} else {} end) +
        (if $disk_smart_health != "" then {smart_health: $disk_smart_health} else {} end) +
        {nvme_detected: ($nvme_detected == "true")} +
        (if $nvme_model != "" then {nvme_model: $nvme_model} else {} end) +
        (if $nvme_namespace_count != "" then {nvme_namespace_count: (($nvme_namespace_count|tonumber?) // 0)} else {} end) +
        (if $dd_w != "" then {dd_write_mbps: ($dd_w|tonumber)} else {} end) +
        (if $dd_r != "" then {dd_read_mbps: ($dd_r|tonumber)} else {} end) +
        (if $fio_ri != "" then {fio_read_iops: ($fio_ri|tonumber)} else {} end) +
        (if $fio_wi != "" then {fio_write_iops: ($fio_wi|tonumber)} else {} end) +
        (if $fio_rm != "" then {fio_read_mbps: ($fio_rm|tonumber)} else {} end) +
        (if $fio_wm != "" then {fio_write_mbps: ($fio_wm|tonumber)} else {} end) +
        (if $fio_rl != "" then {fio_read_latency_ms: (($fio_rl|tonumber?) // 0)} else {} end) +
        (if $fio_wl != "" then {fio_write_latency_ms: (($fio_wl|tonumber?) // 0)} else {} end) +
        (if $fio_4k_qd1_ri != "" then {fio_4k_qd1_read_iops: (($fio_4k_qd1_ri|tonumber?) // 0)} else {} end) +
        (if $fio_4k_qd1_rl != "" then {fio_4k_qd1_read_latency_ms: (($fio_4k_qd1_rl|tonumber?) // 0)} else {} end) +
        (if $fio_4k_qd32_ri != "" then {fio_4k_qd32_read_iops: (($fio_4k_qd32_ri|tonumber?) // 0)} else {} end) +
        (if $fio_4k_qd32_wi != "" then {fio_4k_qd32_write_iops: (($fio_4k_qd32_wi|tonumber?) // 0)} else {} end) +
        (if $fio_4k_qd32_rl != "" then {fio_4k_qd32_read_latency_ms: (($fio_4k_qd32_rl|tonumber?) // 0)} else {} end) +
        (if $fio_4k_qd32_wl != "" then {fio_4k_qd32_write_latency_ms: (($fio_4k_qd32_wl|tonumber?) // 0)} else {} end) +
        (if $fio_seq_r != "" then {fio_seq_read_mbps: (($fio_seq_r|tonumber?) // 0)} else {} end) +
        (if $fio_seq_w != "" then {fio_seq_write_mbps: (($fio_seq_w|tonumber?) // 0)} else {} end)]' \
    2>/dev/null || echo '[{"device":"/"}]')

    # Build CPU results
    local cpu_results
    cpu_results=$(jq -n \
        --arg eps "${EVENTS_PER_SEC:-}" \
        --arg single "${SYSBENCH_SINGLE:-}" \
        --arg multi "${SYSBENCH_MULTI:-}" \
        --arg compression "${COMPRESSION_SCORE:-}" \
        --arg sevenzip "${SEVENZIP_MIPS:-}" \
        --arg gzip "${GZIP_MBPS:-}" \
        --arg sha256 "${OPENSSL_SHA256_MBPS:-}" \
        --arg aes256 "${OPENSSL_AES256_MBPS:-}" \
        '{} +
        (if $eps != "" then {events_per_second: ($eps|tonumber)} else {} end) +
        (if $single != "" then {sysbench_single_score: ($single|tonumber)} else {} end) +
        (if $multi != "" then {sysbench_multi_score: ($multi|tonumber)} else {} end) +
        (if $compression != "" then {compression_score: (($compression|tonumber?) // 0)} else {} end) +
        (if $sevenzip != "" then {sevenzip_mips: (($sevenzip|tonumber?) // 0)} else {} end) +
        (if $gzip != "" then {gzip_mbps: (($gzip|tonumber?) // 0)} else {} end) +
        (if $sha256 != "" then {openssl_sha256_mbps: (($sha256|tonumber?) // 0)} else {} end) +
        (if $aes256 != "" then {openssl_aes256_mbps: (($aes256|tonumber?) // 0)} else {} end)' \
    2>/dev/null || echo '{}')

    # Build memory results
    local memory_results
    memory_results=$(jq -n \
        --arg read "${MEM_READ_MBPS:-}" \
        --arg write "${MEM_WRITE_MBPS:-}" \
        --arg latency "${MEM_LAT_NS:-}" \
        --arg random_read "${MEM_RANDOM_READ_MBPS:-}" \
        --arg random_write "${MEM_RANDOM_WRITE_MBPS:-}" \
        '{} +
        (if $read != "" then {read_speed_mbps: ($read|tonumber)} else {} end) +
        (if $write != "" then {write_speed_mbps: ($write|tonumber)} else {} end) +
        (if $latency != "" then {latency_ns: (($latency|tonumber?) // 0)} else {} end) +
        (if $random_read != "" then {random_read_mbps: (($random_read|tonumber?) // 0)} else {} end) +
        (if $random_write != "" then {random_write_mbps: (($random_write|tonumber?) // 0)} else {} end)' \
    2>/dev/null || echo '{}')

    if ! json_has_type "$disk_results" "array"; then
        warn "Disk results are incomplete; submitting minimal disk details."
        disk_results='[{"device":"/"}]'
    fi

    if ! json_has_type "$cpu_results" "object"; then
        warn "CPU results are incomplete; submitting without CPU benchmark details."
        cpu_results='{}'
    fi

    if ! json_has_type "$memory_results" "object"; then
        warn "Memory results are incomplete; submitting without memory benchmark details."
        memory_results='{}'
    fi

    if ! json_has_type "${NETWORK_RESULTS:-[]}" "array"; then
        warn "Network results are incomplete; submitting without location details."
        NETWORK_RESULTS="[]"
    fi

    if ! json_has_type "${SECURITY_JSON:-{}}" "object"; then
        warn "Security details are incomplete; submitting without security details."
        SECURITY_JSON="{}"
    fi

    # Assemble full payload (without signature)
    local payload_no_sig
    local payload_error_file="$TMP_DIR/payload-jq-error.log"
    payload_no_sig=$(jq -n \
        --arg bt "$benchmark_type" \
        --arg ver "$SCRIPT_VERSION" \
        --arg ts "$timestamp" \
        --arg nonce "$nonce" \
        --arg hostname "${HOSTNAME_VAL:-unknown}" \
        --arg os_name "${OS_NAME:-Unknown}" \
        --arg os_ver "${OS_VERSION:-}" \
        --arg kernel "${KERNEL:-}" \
        --arg arch "${ARCH:-}" \
        --arg virt "${VIRT:-unknown}" \
        --arg cpu_model "${CPU_MODEL:-Unknown}" \
        --arg cpu_cores "${CPU_CORES:-1}" \
        --arg cpu_threads "${CPU_THREADS:-${CPU_CORES:-1}}" \
        --arg cpu_freq "${CPU_FREQ:-0}" \
        --arg ram_mb "${RAM_TOTAL_MB:-64}" \
        --arg swap_mb "${SWAP_TOTAL_MB:-0}" \
        --arg disk_gb "${DISK_TOTAL_GB:-0}" \
        --arg uptime "${UPTIME_SECONDS:-0}" \
        --arg load_avg "${LOAD_AVG:-}" \
        --arg cpu_temp "${CPU_TEMP_C:-}" \
        --arg hypervisor_vendor "${HYPERVISOR_VENDOR:-}" \
        --arg cloud_detected "${CLOUD_PROVIDER_DETECTED:-}" \
        --arg container_detected "${CONTAINER_DETECTED:-false}" \
        --arg cgroup_cpu_quota "${CGROUP_CPU_QUOTA:-}" \
        --arg cgroup_cpu_max "${CGROUP_CPU_MAX:-}" \
        --arg cgroup_memory_limit_mb "${CGROUP_MEMORY_LIMIT_MB:-}" \
        --arg cgroup_cpu_shares "${CGROUP_CPU_SHARES:-}" \
        --arg ipv4 "${IPV4:-}" \
        --arg ipv6 "${IPV6:-}" \
        --arg asn "${ASN:-0}" \
        --arg isp "${ISP:-}" \
        --arg org "${ORG:-}" \
        --arg rdns "${RDNS:-}" \
        --arg city "${CITY:-}" \
        --arg region "${REGION:-}" \
        --arg country "${COUNTRY_CODE:-}" \
        --argjson disk_results "$disk_results" \
        --argjson cpu_results "$cpu_results" \
        --argjson mem_results "$memory_results" \
        --argjson net_results "$NETWORK_RESULTS" \
        --argjson security "${SECURITY_JSON:-{}}" \
        '{
            benchmark_type: $bt,
            client_version: $ver,
            timestamp: $ts,
            nonce: $nonce,
            system: {
                hostname: $hostname,
                os_name: $os_name,
                os_version: $os_ver,
                kernel: $kernel,
                architecture: $arch,
                virtualization: $virt,
                cpu_model: $cpu_model,
                cpu_cores: $cpu_cores,
                cpu_threads: $cpu_threads,
                cpu_frequency_mhz: $cpu_freq,
                ram_total_mb: $ram_mb,
                swap_total_mb: $swap_mb,
                disk_total_gb: $disk_gb,
                uptime_seconds: $uptime,
                load_average: $load_avg,
                container_detected: ($container_detected == "true")
            },
            network: {
                ipv4: $ipv4,
                ipv6: $ipv6,
                asn: $asn,
                isp: $isp,
                organization: $org,
                reverse_dns: $rdns,
                city: $city,
                region: $region,
                country_code: $country
            },
            disk_results: $disk_results,
            cpu_results: $cpu_results,
            memory_results: $mem_results,
            network_results: $net_results,
            security: $security
        }
        | .timestamp = (($ts | tonumber?) // 0 | floor)
        | .system.cpu_cores = (($cpu_cores | tonumber?) // 1 | floor)
        | .system.cpu_threads = (($cpu_threads | tonumber?) // .system.cpu_cores | floor)
        | .system.cpu_frequency_mhz = (($cpu_freq | tonumber?) // 0)
        | .system.ram_total_mb = (($ram_mb | tonumber?) // 64 | floor)
        | .system.swap_total_mb = (($swap_mb | tonumber?) // 0 | floor)
        | .system.disk_total_gb = (($disk_gb | tonumber?) // 0)
        | .system.uptime_seconds = (($uptime | tonumber?) // 0 | floor)
        | .system += (if $cpu_temp != "" then {cpu_temperature_c: (($cpu_temp | tonumber?) // 0)} else {} end)
        | .system += (if $hypervisor_vendor != "" then {hypervisor_vendor: $hypervisor_vendor} else {} end)
        | .system += (if $cloud_detected != "" then {cloud_provider_detected: $cloud_detected} else {} end)
        | .system += (if $cgroup_cpu_quota != "" then {cgroup_cpu_quota: $cgroup_cpu_quota} else {} end)
        | .system += (if $cgroup_cpu_max != "" then {cgroup_cpu_max: $cgroup_cpu_max} else {} end)
        | .system += (if $cgroup_memory_limit_mb != "" then {cgroup_memory_limit_mb: (($cgroup_memory_limit_mb | tonumber?) // 0)} else {} end)
        | .system += (if $cgroup_cpu_shares != "" then {cgroup_cpu_shares: (($cgroup_cpu_shares | tonumber?) // 0)} else {} end)
        | .network.asn = (($asn | tonumber?) // 0 | floor)
        | if $country == "" then del(.network.country_code) else . end' 2>"$payload_error_file" || true)

    if [ -z "$payload_no_sig" ]; then
        if [ -s "$payload_error_file" ]; then
            warn "Payload builder error: $(head -n 1 "$payload_error_file")"
        fi
        err "Cannot assemble benchmark payload"
        return 1
    fi

    local signature="0000000000000000000000000000000000000000000000000000000000000000"
    local generated_signature=""
    if cmd_exists sha256sum; then
        generated_signature=$(printf '%s:%s:%s' "$nonce" "$timestamp" "$SCRIPT_VERSION" | sha256sum | awk '{print $1}' || true)
        [ -n "$generated_signature" ] && signature="$generated_signature"
    elif cmd_exists openssl; then
        generated_signature=$(printf '%s:%s:%s' "$nonce" "$timestamp" "$SCRIPT_VERSION" | openssl dgst -sha256 2>/dev/null | awk '{print $2}' || true)
        [ -n "$generated_signature" ] && signature="$generated_signature"
    fi

    if ! echo "$payload_no_sig" | jq --arg sig "$signature" '. + {signature: $sig}' 2>/dev/null > "$RESULT_FILE"; then
        err "Cannot build benchmark payload"
        return 1
    fi
}

# ============================================================
# Submit Benchmark
# ============================================================
submit_benchmark() {
    section "Submitting Benchmark"

    if [ ! -f "$RESULT_FILE" ]; then
        err "Result file not found"
        return 1
    fi

    local payload_size
    payload_size=$(wc -c < "$RESULT_FILE")
    info "Payload size: $((payload_size / 1024)) KB"

    local response
    response=$(curl -sS --max-time 30 \
        -X POST \
        -H "Content-Type: application/json" \
        -H "User-Agent: HiTechBench/$SCRIPT_VERSION" \
        --data @"$RESULT_FILE" \
        "${API_URL}/api/benchmarks" 2>&1 || true)

    if ! echo "$response" | jq -e . >/dev/null 2>&1; then
        response=$(jq -n --arg msg "${response:-Connection failed}" '{success:false,message:$msg}')
    fi

    if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
        local public_url private_url uuid
        public_url=$(echo "$response" | jq -r '.data.public_url // ""')
        private_url=$(echo "$response" | jq -r '.data.private_url // ""')
        uuid=$(echo "$response" | jq -r '.data.uuid // ""')
        local flagged
        flagged=$(echo "$response" | jq -r '.data.flagged // false')

        echo ""
        echo -e "${BOLD}${GREEN}✓ Benchmark submitted successfully!${NC}"
        echo ""

        if [ -n "$public_url" ]; then
            echo -e "  ${BOLD}Public URL :${NC} ${CYAN}$public_url${NC}"
        fi
        echo -e "  ${BOLD}Private URL:${NC} ${CYAN}$private_url${NC}"
        echo ""

        if [ "$flagged" = "true" ]; then
            warn "Your benchmark was flagged for review. Results may not appear in public rankings."
        fi

        echo -e "  ${YELLOW}Save your Private URL — it's the only way to access a private result!${NC}"
    else
        local msg
        msg=$(echo "$response" | jq -r '.message // "Unknown error"' 2>/dev/null || echo "Submission failed")
        err "Submission failed: $msg"
        info "Raw payload saved at: $RESULT_FILE (will be deleted on exit)"
    fi
}

# ============================================================
# Main Flow
# ============================================================
main() {
    parse_args "$@"
    print_banner

    check_deps

    if [ -z "$BENCHMARK_TYPE" ]; then
        if is_interactive; then
            echo ""
            echo -e "${BOLD}Select benchmark type:${NC}"
            echo "  1) Public  — Result is public, appears in rankings"
            echo "  2) Private — Result is private, only accessible via secret URL"
            echo ""
            read -rp "Choice [1/2, default 1]: " choice
            BENCHMARK_TYPE="$(normalize_choice "$choice")"
        else
            BENCHMARK_TYPE="public"
            warn "Non-interactive pipe detected; using public benchmark by default."
            warn "For private results, run: curl -sL ${API_URL}/install | bash -s -- --private"
        fi
    fi

    if [ "$BENCHMARK_TYPE" = "private" ]; then
        echo -e "${YELLOW}Private benchmark selected${NC}"
    else
        echo -e "${GREEN}Public benchmark selected${NC}"
    fi

    echo ""
    echo -e "${YELLOW}This will benchmark your system. Estimated time: 3-5 minutes.${NC}"
    if is_interactive && [ "$ASSUME_YES" != "true" ]; then
        read -rp "Continue? [Y/n] " confirm
        if [[ "${confirm,,}" == "n" ]]; then
            echo "Cancelled."
            exit 0
        fi
    else
        echo "Continuing automatically."
    fi

    # Run all benchmarks
    collect_system_info
    collect_network_info
    run_disk_benchmark
    run_cpu_benchmark
    run_memory_benchmark
    run_network_benchmark
    collect_security_info

    # Build and submit
    if ! build_payload "$BENCHMARK_TYPE"; then
        err "Benchmark finished, but the result payload could not be prepared."
        exit 1
    fi

    if ! submit_benchmark; then
        err "Benchmark finished, but submission failed."
        exit 1
    fi
}

main "$@"
