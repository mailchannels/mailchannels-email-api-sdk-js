#!/usr/bin/env bash
# MailChannels-CLI installer for macOS and Linux
# Optional environment variables:
#   MAILCHANNELS_INSTALL | Install root (default: $HOME/.mailchannels)
# Optional argument:
#   --version VERSION | Release version (default: latest)
set -euo pipefail

readonly repository_url='https://github.com/mailchannels/mailchannels-email-api-sdk-js'
work_directory=''
staged_install_path=''
color_stdout=false
color_stderr=false

# --- Color codes ---
readonly COLOR_RED=31
readonly COLOR_GREEN=32
readonly COLOR_YELLOW=33
readonly COLOR_CYAN=36
readonly COLOR_DIM=90
readonly COLOR_RESET=0

if [ -z "${NO_COLOR:-}" ] && [ "${TERM:-}" != 'dumb' ]; then
  if [ -t 1 ]; then
    color_stdout=true
  fi
  if [ -t 2 ]; then
    color_stderr=true
  fi
fi

# --- Output, errors, and cleanup ---
write_color() {
  local code=$1 message=$2 stream=${3:-1}
  local enabled=$color_stdout

  (( stream == 2 )) && enabled=$color_stderr

  if [[ $enabled == true ]]; then
      printf '\033[%sm%s\033[0m\n' "$code" "$message" >&"$stream"
  else
      printf '%s\n' "$message" >&"$stream"
  fi
}

muted() {
  write_color "$COLOR_DIM" "$1"
}

info() {
  write_color "$COLOR_CYAN" "$1"
}

warning() {
  write_color "$COLOR_YELLOW" "$1"
}

fail() {
  local message=$*
  write_color "$COLOR_RED" "Installation failed: $message" 2
  exit 1
}

cleanup() {
  if [ -n "$staged_install_path" ]; then
    rm -f "$staged_install_path" || :
  fi
  if [ -n "$work_directory" ]; then
    rm -rf "$work_directory" || :
  fi
}

# --- Argument parsing ---
parse_arguments() {
  requested_version=''

  case "$#" in
    0) return ;;
    1)
      case "$1" in
        --version=*) requested_version=${1#*=} ;;
        *) fail "Usage: $0 [--version VERSION]" ;;
      esac
      ;;
    2)
      [ "$1" = '--version' ] || fail "Usage: $0 [--version VERSION]"
      requested_version=$2
      ;;
    *) fail "Usage: $0 [--version VERSION]" ;;
  esac

  case "$requested_version" in
    ''|-*) fail "Usage: $0 [--version VERSION]" ;;
  esac
}

# --- Dependency checks ---
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  command_exists "$1" || fail "Required command '$1' was not found."
}

reject_musl_linux() {
  local ldd_version
  if ! command_exists ldd; then
    return 0
  fi

  ldd_version=$(ldd --version 2>&1 || :)
  case "$ldd_version" in
    *musl*)
      fail 'The standalone CLI requires glibc and cannot run on musl-based Linux.' \
      'Use `npm install -g @mailchannels/sdk` instead.'
    ;;
  esac
}

# --- PATH setup ---
shell_quote() {
  printf "'"
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
  printf "'"
}

fish_quote() {
  printf '"'
  printf '%s' "$1" | sed 's/[\\"$]/\\&/g'
  printf '"'
}

quote_for_shell() {
  case "$shell_name" in
    fish) fish_quote "$1" ;;
    *) shell_quote "$1" ;;
  esac
}

append_path_line() {
  local destination_profile=$1
  if [ -f "$destination_profile" ] && grep -Fqx "$path_entry" "$destination_profile"; then
    return 0
  fi

  if printf '\n# MailChannels-CLI\n%s\n' "$path_entry" >> "$destination_profile"; then
    muted "  Added PATH entry to $destination_profile."
    return 0
  fi

  warning "Could not update PATH automatically: could not write to $destination_profile."
  return 1
}

main() {
  trap cleanup 0
  trap 'exit 1' HUP INT TERM

  parse_arguments "$@"

  local shell_name=${SHELL:-}
  shell_name=${shell_name##*/}

  require_command curl
  require_command tar

  # --- OS architecture and compatibility ---
  platform=$(uname -s)
  architecture=$(uname -m)
  if [ "$platform" = 'Darwin' ] &&
  [ "$architecture" = 'x86_64' ] &&
  command_exists sysctl
  then
    local rosetta_translated
    rosetta_translated=$(sysctl -n sysctl.proc_translated 2>/dev/null || printf '0')
    if [ "$rosetta_translated" = '1' ]; then
      architecture='arm64'
      muted '  Rosetta 2 detected; selecting native macOS ARM64.'
    fi
  fi

  case "$platform:$architecture" in
    Darwin:arm64|Darwin:aarch64)
      target='darwin-arm64'
      platform_description='macOS ARM64'
    ;;
    Darwin:x86_64|Darwin:amd64)
      target='darwin-x64'
      platform_description='macOS x64'
    ;;
    Linux:x86_64|Linux:amd64)
      target='linux-x64'
      platform_description='Linux x64'
    ;;
    Linux:arm64|Linux:aarch64)
      target='linux-arm64'
      platform_description='Linux ARM64'
    ;;
    *)
      fail "Unsupported platform '$platform/$architecture'." \
      'Supported targets are macOS and Linux x64/arm64.'
    ;;
  esac

  if [ "$platform" = 'Linux' ]; then
    reject_musl_linux
  fi

  # --- Install directory and archive names ---
  local install_root=${MAILCHANNELS_INSTALL:-}
  local use_home_path=false
  if [ -z "$install_root" ]; then
    if [ -z "${HOME:-}" ]; then
      fail 'HOME is not set; set MAILCHANNELS_INSTALL to choose an install directory.'
    fi
    install_root="$HOME/.mailchannels"
    use_home_path=true
  fi

  case "$install_root" in
    /*) ;;
    *) install_root="$PWD/$install_root" ;;
  esac
  case "$install_root" in
    /) ;;
    */) install_root=${install_root%/} ;;
  esac

  bin_directory="$install_root/bin"
  executable_path="$bin_directory/mailchannels"
  archive_name="mailchannels-$target.tar.gz"
  checksums_name='mailchannels-cli-checksums.txt'

  printf '\n'
  info 'MailChannels-CLI Installer'

  # --- Version and download URLs ---
  local latest_url
  if [ -n "$requested_version" ]; then
    case "$requested_version" in
      v*|V*) release_tag="v${requested_version#?}" ;;
      *) release_tag="v$requested_version" ;;
    esac
  else
    muted '  Checking the latest release...'
    latest_url=$(
      curl -fSsIL \
      --retry 2 \
      --connect-timeout 15 \
      --max-time 120 \
      -o /dev/null \
      -w '%{url_effective}' \
      "$repository_url/releases/latest"
    ) || fail 'Could not check the latest release. Confirm GitHub is reachable and try again.'

    case "$latest_url" in
      */releases/tag/*) release_tag=${latest_url##*/} ;;
      *) fail "Could not read the latest release tag from $latest_url." ;;
    esac
  fi
  muted "  Preparing $release_tag for $platform_description"

  # --- Download release assets ---
  local archive_url="$repository_url/releases/download/$release_tag/$archive_name"
  local checksums_url="$repository_url/releases/download/$release_tag/$checksums_name"
  work_directory=$(mktemp -d "${TMPDIR:-/tmp}/mailchannels-cli.XXXXXX") ||
  fail 'Could not create a temporary working directory.'
  archive_path="$work_directory/$archive_name"
  checksums_path="$work_directory/$checksums_name"
  extract_directory="$work_directory/extract"

  muted "  Downloading from $archive_url"
  if ! curl -fSsL \
  --retry 2 \
  --connect-timeout 15 \
  --max-time 120 \
  -o "$archive_path" \
  "$archive_url"
  then
    fail "Could not download $release_tag. Confirm the release exists and GitHub is reachable."
  fi

  muted '  Verifying the release checksum...'
  if ! curl -fSsL \
  --retry 2 \
  --connect-timeout 15 \
  --max-time 120 \
  -o "$checksums_path" \
  "$checksums_url"
  then
    fail 'Could not download the release checksums. Refusing to install an unverified archive.'
  fi

  # --- Checksum verification ---
  local expected_checksum
  local hash_output
  local actual_checksum
  local checksum_tool
  expected_checksum=$(
    awk -v archive="$archive_name" '
    $2 == archive || $2 == "*" archive {
    print $1
    exit
    }
    ' "$checksums_path"
  )
  case "$expected_checksum" in
    ''|*[!0123456789abcdefABCDEF]*)
      fail "The checksum file does not contain a valid SHA-256 entry for $archive_name."
    ;;
  esac
  if [ "${#expected_checksum}" -ne 64 ]; then
    fail "The checksum file does not contain a valid SHA-256 entry for $archive_name."
  fi
  expected_checksum=$(printf '%s' "$expected_checksum" | tr '[:upper:]' '[:lower:]')

  if command_exists sha256sum; then
    checksum_tool='sha256sum'
  elif command_exists shasum; then
    checksum_tool='shasum'
  else
    fail 'Neither sha256sum nor shasum is available to verify the release.'
  fi

  if [ "$checksum_tool" = 'sha256sum' ]; then
    hash_output=$(sha256sum "$archive_path") ||
    fail 'Could not calculate the archive checksum.'
  else
    hash_output=$(shasum -a 256 "$archive_path") ||
    fail 'Could not calculate the archive checksum.'
  fi
  actual_checksum=${hash_output%% *}
  if [ "$actual_checksum" != "$expected_checksum" ]; then
    fail "Checksum verification failed for $archive_name." \
    "Expected $expected_checksum, got $actual_checksum."
  fi

  # --- Extract and install executable ---
  mkdir -p "$extract_directory"
  if ! tar -xzf "$archive_path" -C "$extract_directory" mailchannels; then
    fail 'Could not extract the verified archive.'
  fi

  staged_executable="$extract_directory/mailchannels"
  if [ ! -f "$staged_executable" ] || [ -L "$staged_executable" ]; then
    fail 'The verified archive does not contain a regular mailchannels executable.'
  fi

  mkdir -p "$bin_directory" || fail "Could not create install directory '$bin_directory'."
  staged_install_path=$(mktemp "$bin_directory/.mailchannels.XXXXXX") ||
  fail "Could not stage the executable in '$bin_directory'."
  cp "$staged_executable" "$staged_install_path" || fail 'Could not stage the executable.'
  chmod 755 "$staged_install_path" || fail 'Could not make the executable runnable.'
  if [ -d "$executable_path" ]; then
    fail "Cannot replace '$executable_path': it is a directory."
  fi
  mv -f "$staged_install_path" "$executable_path" ||
  fail "Could not install to '$bin_directory'."
  staged_install_path=''

  # --- Installation summary ---
  printf '\n'
  write_color "$COLOR_GREEN" "MailChannels-CLI $release_tag installed successfully!"
  muted "  Executable: $executable_path"

  # --- Configure PATH ---
  local quoted_directory
  local path_update_failed=false
  if [ -z "${HOME:-}" ]; then
    warning '  Could not update PATH automatically: HOME is not set.'
    warning "  Add this folder to PATH manually: $bin_directory"
    info "  Run directly: $(quote_for_shell "$executable_path") --help"
    path_update_failed=true
  else
    additional_profile_path=''
    case "$shell_name" in
      fish)
        profile_path="${XDG_CONFIG_HOME:-$HOME/.config}/fish/conf.d/mailchannels.fish"
        if [ "$use_home_path" = true ]; then
          path_entry='fish_add_path "$HOME/.mailchannels/bin"'
        else
          path_entry="fish_add_path $(fish_quote "$bin_directory")"
        fi
      ;;
      zsh)
        profile_path="${ZDOTDIR:-$HOME}/.zshrc"
      ;;
      bash)
        case "$platform" in
          Darwin)
            if [ -f "$HOME/.bash_profile" ]; then
              profile_path="$HOME/.bash_profile"
            elif [ -f "$HOME/.bash_login" ]; then
              profile_path="$HOME/.bash_login"
            elif [ -f "$HOME/.profile" ]; then
              profile_path="$HOME/.profile"
            else
              profile_path="$HOME/.bash_profile"
            fi
          ;;
          Linux)
            profile_path="$HOME/.bashrc"
            if [ -f "$HOME/.bash_profile" ]; then
              additional_profile_path="$HOME/.bash_profile"
            elif [ -f "$HOME/.bash_login" ]; then
              additional_profile_path="$HOME/.bash_login"
            else
              additional_profile_path="$HOME/.profile"
            fi
          ;;
          *)
            profile_path="$HOME/.profile"
          ;;
        esac
      ;;
      *)
        profile_path="$HOME/.profile"
      ;;
    esac
    if [ "$shell_name" != 'fish' ]; then
      if [ "$use_home_path" = true ]; then
        quoted_directory='"$HOME/.mailchannels/bin"'
      else
        quoted_directory=$(shell_quote "$bin_directory")
      fi
      path_entry="case \":\${PATH:-}:\" in *$quoted_directory:"
      path_entry="$path_entry*) ;; *) export PATH=$quoted_directory:\$PATH ;; esac"
    fi

    if [ "$shell_name" = 'fish' ] && ! mkdir -p "${profile_path%/*}"; then
      warning "Could not create fish config directory '${profile_path%/*}'."
      path_update_failed=true
    fi
    if [ "$path_update_failed" = false ] && ! append_path_line "$profile_path"; then
      path_update_failed=true
    fi
    if [ -n "$additional_profile_path" ] && ! append_path_line "$additional_profile_path"; then
      path_update_failed=true
    fi

    if [ "$path_update_failed" = true ]; then
      if [ "$shell_name" = 'fish' ]; then
        warning '  Could not update PATH automatically for fish.'
        warning "  Add this folder to PATH manually with fish_add_path: $bin_directory"
        info "  Run directly: $(quote_for_shell "$executable_path") --help"
      else
        warning "  Add this folder to PATH manually: $bin_directory"
        info "  Run directly: $(quote_for_shell "$executable_path") --help"
      fi
    fi
  fi

  if [ "$path_update_failed" = false ]; then
    printf "  Open a new terminal, then run: $(info "mailchannels --help") to get started"
  fi
  printf '\n\n'
}

# --- Main execution ---
main "$@"
