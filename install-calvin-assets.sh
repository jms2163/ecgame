#!/usr/bin/env bash
set -euo pipefail

repo_dir="${1:-$HOME/Documents/DCC/BIO 101/ecgame}"
assets_dir="$repo_dir/public/assets/polymerizer/proteins"
stems=(1spi 5nd5 7zuv 6zxt 7b1w 6kew)
last_frames=(20 40 22 18 17 27)
sources=()

# Check every source and frame before changing the game checkout.
for index in "${!stems[@]}"; do
    stem="${stems[$index]}"
    last="${last_frames[$index]}"
    source_dir=""
    for parent in "$HOME/Downloads" "$HOME/Desktop"; do
        source_dir=$(find "$parent" -maxdepth 1 -type d -iname "${stem}_motifs" -print | sed -n '1p')
        if [[ -n "$source_dir" ]]; then break; fi
    done
    if [[ -z "$source_dir" ]]; then
        printf 'Missing folder: %s_motifs in Downloads or Desktop\n' "$stem" >&2
        exit 1
    fi
    sources+=("$source_dir")
    for (( frame=1; frame<=last; frame++ )); do
        match=$(find "$source_dir" -maxdepth 1 -type f -iname "${stem}-${frame}.png" -print | sed -n '1p')
        if [[ -z "$match" ]]; then
            printf 'Missing frame %s-%s.png in %s\n' "$stem" "$frame" "$source_dir" >&2
            exit 1
        fi
    done
done

for index in "${!stems[@]}"; do
    stem="${stems[$index]}"
    last="${last_frames[$index]}"
    destination="$assets_dir/${stem}_motifs"
    mkdir -p "$destination"
    for (( frame=1; frame<=last; frame++ )); do
        source_file=$(find "${sources[$index]}" -maxdepth 1 -type f -iname "${stem}-${frame}.png" -print | sed -n '1p')
        cp "$source_file" "$destination/${stem}-${frame}.png"
    done
    printf 'Installed %s frames 1-%s\n' "$stem" "$last"
done
