#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
asset_dir="$root_dir/assets/gpt"
work_dir="${TMPDIR:-/tmp}/wedding-suite-v5"
mkdir -p "$work_dir"

desktop_base="$asset_dir/opening-suite-shared-desktop-v5.png"
mobile_base="$asset_dir/opening-suite-shared-mobile-v5.png"
logo_source="$asset_dir/sv-logo-variants/ai-crisp/sv-logo-brown-ai-crisp-v2.png"
serif="$asset_dir/CormorantGaramond-Regular.ttf"
script="$asset_dir/PinyonScript-Regular.ttf"
ink="#563525"
cream="#f5e9d8"

magick "$logo_source" -alpha off -fx '((r-g)>0.08)?1:0' -trim +repage "$work_dir/logo-mask.png"

make_logo() {
  local width="$1"
  local output="$2"
  magick "$work_dir/logo-mask.png" -resize "${width}x" -threshold 50% "$work_dir/logo-sized.png"
  magick -size "$(magick identify -format '%wx%h' "$work_dir/logo-sized.png")" xc:'#6d4630' \
    "$work_dir/logo-sized.png" -alpha off -compose CopyOpacity -composite -channel A -evaluate multiply .62 +channel "$output"
}

make_logo 94 "$work_dir/logo-desktop.png"
make_logo 86 "$work_dir/logo-mobile.png"

render_desktop() {
  local language="$1"
  local eyebrow title date_line venue_line ceremony olive_text
  if [[ "$language" == "en" ]]; then
    eyebrow='OUR WEDDING DAY'
    title=$'Save\nthe Date'
    date_line=$'Tuesday\nNovember 3, 2026'
    venue_line=$'HOTEL PIEDRA VIVA\nTEPOZTLÁN, MORELOS · MÉXICO'
    ceremony='CEREMONY · 2:45 PM'
    olive_text=$'AMONG MOUNTAINS,\nFLOWERS & LIGHT'
  else
    eyebrow='EL DÍA DE NUESTRA BODA'
    title=$'Reserva\nla Fecha'
    date_line=$'Martes\n3 de noviembre de 2026'
    venue_line=$'HOTEL PIEDRA VIVA\nTEPOZTLÁN, MORELOS · MÉXICO'
    ceremony='CEREMONIA · 2:45 PM'
    olive_text=$'ENTRE MONTAÑAS,\nFLORES Y LUZ'
  fi

  magick "$desktop_base" \
    \( -background none -fill "$ink" -font "$serif" -pointsize 21 -kerning 4 -size 470x34 -gravity center caption:"$eyebrow" \) -gravity northwest -geometry +602+184 -composite \
    \( -background none -fill "$ink" -font "$script" -pointsize 82 -size 500x170 -gravity center caption:"$title" \) -gravity northwest -geometry +587+220 -composite \
    \( -background none -fill "$ink" -font "$serif" -pointsize 31 -size 450x86 -gravity center caption:"$date_line" \) -gravity northwest -geometry +612+403 -composite \
    \( -background none -fill "$ink" -font "$serif" -pointsize 18 -kerning 2 -size 440x72 -gravity center caption:"$venue_line" \) -gravity northwest -geometry +617+516 -composite \
    \( -background none -fill "$ink" -font "$serif" -pointsize 17 -kerning 3 -size 440x30 -gravity center caption:"$ceremony" \) -gravity northwest -geometry +617+604 -composite \
    \( -background none -fill "$cream" -font "$serif" -pointsize 20 -kerning 2 -size 300x72 -gravity center caption:"$olive_text" \) -gravity northwest -geometry +90+182 -composite \
    \( -background none -fill "$cream" -font "$serif" -pointsize 29 -kerning 3 -size 330x88 -gravity center caption:$'03 · 11 · 26\n2:45 PM' \) -gravity northwest -geometry +1192+186 -composite \
    \( "$work_dir/logo-desktop.png" -channel A -evaluate multiply .32 +channel \) -gravity northwest -geometry +1092+650 -composite \
    \( "$work_dir/logo-desktop.png" -fill '#fff8ea' -colorize 100 -channel A -evaluate multiply .38 +channel \) -gravity northwest -geometry +1094+652 -composite \
    \( "$work_dir/logo-desktop.png" -channel A -evaluate multiply .68 +channel \) -gravity northwest -geometry +1093+651 -composite \
    "$asset_dir/opening-suite-printed-${language}-desktop-v5.png"
}

render_mobile() {
  local language="$1"
  local eyebrow title date_line venue_line ceremony olive_text
  if [[ "$language" == "en" ]]; then
    eyebrow='OUR WEDDING DAY'
    title=$'Save\nthe Date'
    date_line=$'Tuesday\nNovember 3, 2026'
    venue_line=$'HOTEL PIEDRA VIVA\nTEPOZTLÁN, MORELOS · MÉXICO'
    ceremony='CEREMONY · 2:45 PM'
    olive_text=$'TEPOZTLÁN\nMÉXICO'
  else
    eyebrow='EL DÍA DE NUESTRA BODA'
    title=$'Reserva\nla Fecha'
    date_line=$'Martes\n3 de noviembre de 2026'
    venue_line=$'HOTEL PIEDRA VIVA\nTEPOZTLÁN, MORELOS · MÉXICO'
    ceremony='CEREMONIA · 2:45 PM'
    olive_text=$'TEPOZTLÁN\nMÉXICO'
  fi

  magick "$mobile_base" \
    \( -background none -fill "$ink" -font "$serif" -pointsize 18 -kerning 3 -size 420x32 -gravity center caption:"$eyebrow" \) -gravity northwest -geometry +260+235 -composite \
    \( -background none -fill "$ink" -font "$script" -pointsize 72 -size 430x158 -gravity center caption:"$title" \) -gravity northwest -geometry +255+282 -composite \
    \( -background none -fill "$ink" -font "$serif" -pointsize 28 -size 410x82 -gravity center caption:"$date_line" \) -gravity northwest -geometry +265+475 -composite \
    \( -background none -fill "$ink" -font "$serif" -pointsize 16 -kerning 1 -size 410x68 -gravity center caption:"$venue_line" \) -gravity northwest -geometry +265+592 -composite \
    \( -background none -fill "$ink" -font "$serif" -pointsize 15 -kerning 2 -size 410x28 -gravity center caption:"$ceremony" \) -gravity northwest -geometry +265+690 -composite \
    \( -background none -fill "$cream" -font "$serif" -pointsize 16 -kerning 1 -size 150x58 -gravity center caption:"$olive_text" \) -gravity northwest -geometry +84+535 -composite \
    \( -background none -fill "$cream" -font "$serif" -pointsize 21 -kerning 2 -size 200x76 -gravity center caption:$'03 · 11 · 26\n2:45 PM' \) -gravity northwest -geometry +658+300 -composite \
    \( "$work_dir/logo-mobile.png" -channel A -evaluate multiply .32 +channel \) -gravity northwest -geometry +431+1165 -composite \
    \( "$work_dir/logo-mobile.png" -fill '#fff8ea' -colorize 100 -channel A -evaluate multiply .38 +channel \) -gravity northwest -geometry +433+1167 -composite \
    \( "$work_dir/logo-mobile.png" -channel A -evaluate multiply .68 +channel \) -gravity northwest -geometry +432+1166 -composite \
    "$asset_dir/opening-suite-printed-${language}-mobile-v5.png"
}

render_desktop en
render_desktop es
render_mobile en
render_mobile es

magick identify "$asset_dir"/opening-suite-printed-*-v5.png
