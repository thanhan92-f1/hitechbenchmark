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
        apt) apt-get install -y -q "$pkg" >/dev/null 2>&1 || warn "Failed to install $pkg" ;;
        yum) yum install -y -q "$pkg" >/dev/null 2>&1 || warn "Failed to install $pkg" ;;
        dnf) dnf install -y -q "$pkg" >/dev/null 2>&1 || warn "Failed to install $pkg" ;;
        *) warn "Unknown package manager, cannot install $pkg" ;;
    esac
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

    # Virtualization detection
    VIRT="unknown"
    if cmd_exists systemd-detect-virt; then
        VIRT=$(systemd-detect-virt 2>/dev/null || echo "unknown")
    elif [ -f /proc/cpuinfo ]; then
        if grep -qi "hypervisor" /proc/cpuinfo; then
            VIRT="hypervisor"
        fi
    fi
    if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
        VIRT="docker"
    fi
    if [ -f /proc/vz/version ] 2>/dev/null; then VIRT="openvz"; fi

    # CPU info
    CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | sed 's/.*: //' | sed 's/  */ /g' || echo "Unknown")
    CPU_CORES=$(nproc --all 2>/dev/null || grep -c ^processor /proc/cpuinfo)
    CPU_THREADS=$(grep -c ^processor /proc/cpuinfo || echo "$CPU_CORES")
    CPU_FREQ=$(grep "cpu MHz" /proc/cpuinfo | head -1 | awk '{printf "%.0f", $4}' 2>/dev/null || echo "0")

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
    echo -e "  CPU        : ${BOLD}$CPU_MODEL${NC}"
    echo -e "  CPU Cores  : $CPU_CORES cores / $CPU_THREADS threads @ ${CPU_FREQ} MHz"
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

        rm -f "$TMP_DIR/fio_test"
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
        multi_result=$(timeout_run 30 sysbench cpu --cpu-max-prime=20000 --threads="$CPU_CORES" --time=10 run 2>/dev/null || echo "")
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
            echo -e "${GREEN}${compress_result} MIPS${NC}"
        else
            echo -e "${YELLOW}N/A${NC}"
        fi
    elif cmd_exists dd && cmd_exists gzip; then
        local compress_speed
        compress_speed=$(dd if=/dev/urandom bs=1M count=100 2>/dev/null | gzip -9 > /dev/null && echo "done" || true)
        echo -e "${YELLOW}Limited${NC}"
    else
        echo -e "${YELLOW}N/A${NC}"
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

    NETWORK_RESULTS="["
    local first=true

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

        # Build JSON for this location
        if [ "$first" = true ]; then first=false; else NETWORK_RESULTS+=","; fi
        NETWORK_RESULTS+="{\"location\":\"$loc_code\",\"server_host\":\"$(echo "$loc_url" | sed 's|https*://||' | cut -d'/' -f1)\""
        [ -n "$download_mbps" ] && NETWORK_RESULTS+=",\"download_mbps\":$download_mbps"
        [ -n "$ping_ms" ] && NETWORK_RESULTS+=",\"ping_ms\":$ping_ms"
        NETWORK_RESULTS+="}"
    done
    NETWORK_RESULTS+="]"
}

# ============================================================
# Security Information
# ============================================================
collect_security_info() {
    section "Security Information"

    local open_ports="[]"
    local firewall=false
    local selinux=false
    local apparmor=false

    # Check firewall
    if cmd_exists ufw && ufw status 2>/dev/null | grep -q "active"; then
        firewall=true
        echo -e "  Firewall   : ${GREEN}UFW active${NC}"
    elif cmd_exists firewall-cmd && firewall-cmd --state 2>/dev/null | grep -q "running"; then
        firewall=true
        echo -e "  Firewall   : ${GREEN}firewalld active${NC}"
    elif cmd_exists iptables && iptables -L 2>/dev/null | grep -q "^Chain"; then
        echo -e "  Firewall   : ${YELLOW}iptables (check manually)${NC}"
    else
        echo -e "  Firewall   : ${YELLOW}None detected${NC}"
    fi

    # SELinux
    if cmd_exists getenforce; then
        local selinux_status
        selinux_status=$(getenforce 2>/dev/null || echo "disabled")
        if [ "$selinux_status" = "Enforcing" ] || [ "$selinux_status" = "Permissive" ]; then
            selinux=true
            echo -e "  SELinux    : ${GREEN}$selinux_status${NC}"
        fi
    fi

    # AppArmor
    if cmd_exists aa-status || [ -d /sys/kernel/security/apparmor ]; then
        apparmor=true
        echo -e "  AppArmor   : ${GREEN}Active${NC}"
    fi

    # Common open ports (quick check)
    for port in 22 80 443 3306 5432 6379 8080; do
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
        --arg virt "$VIRT" \
        '{firewall_detected: $firewall, selinux: $selinux, apparmor: $apparmor, virtualization_type: $virt}' \
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
        --arg device "/" \
        --arg dd_w "${DD_WRITE_MBPS:-}" \
        --arg dd_r "${DD_READ_MBPS:-}" \
        --arg fio_ri "${FIO_READ_IOPS:-}" \
        --arg fio_wi "${FIO_WRITE_IOPS:-}" \
        --arg fio_rm "${FIO_READ_MBPS:-}" \
        --arg fio_wm "${FIO_WRITE_MBPS:-}" \
        --arg fio_rl "${FIO_READ_LAT_MS:-}" \
        --arg fio_wl "${FIO_WRITE_LAT_MS:-}" \
        '[{device: $device} +
        (if $dd_w != "" then {dd_write_mbps: ($dd_w|tonumber)} else {} end) +
        (if $dd_r != "" then {dd_read_mbps: ($dd_r|tonumber)} else {} end) +
        (if $fio_ri != "" then {fio_read_iops: ($fio_ri|tonumber)} else {} end) +
        (if $fio_wi != "" then {fio_write_iops: ($fio_wi|tonumber)} else {} end) +
        (if $fio_rm != "" then {fio_read_mbps: ($fio_rm|tonumber)} else {} end) +
        (if $fio_wm != "" then {fio_write_mbps: ($fio_wm|tonumber)} else {} end)]' \
    2>/dev/null || echo '[{"device":"/"}]')

    # Build CPU results
    local cpu_results
    cpu_results=$(jq -n \
        --arg eps "${EVENTS_PER_SEC:-}" \
        --arg single "${SYSBENCH_SINGLE:-}" \
        --arg multi "${SYSBENCH_MULTI:-}" \
        '{} +
        (if $eps != "" then {events_per_second: ($eps|tonumber)} else {} end) +
        (if $single != "" then {sysbench_single_score: ($single|tonumber)} else {} end) +
        (if $multi != "" then {sysbench_multi_score: ($multi|tonumber)} else {} end)' \
    2>/dev/null || echo '{}')

    # Build memory results
    local memory_results
    memory_results=$(jq -n \
        --arg read "${MEM_READ_MBPS:-}" \
        --arg write "${MEM_WRITE_MBPS:-}" \
        '{} +
        (if $read != "" then {read_speed_mbps: ($read|tonumber)} else {} end) +
        (if $write != "" then {write_speed_mbps: ($write|tonumber)} else {} end)' \
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
                load_average: $load_avg
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
