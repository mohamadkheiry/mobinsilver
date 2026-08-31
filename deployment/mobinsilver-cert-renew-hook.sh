#!/bin/sh
set -eu

case " ${RENEWED_DOMAINS:-} " in
  *" mobinsilver.00f.ir "*) ;;
  *) exit 0 ;;
esac

source_dir=${RENEWED_LINEAGE:-/etc/letsencrypt/live/mobinsilver.00f.ir}
target_dir=/home/nginx/ssl/mobinsilver.00f.ir

install -d -o root -g root -m 0755 "$target_dir"
install -o root -g root -m 0644 "$source_dir/fullchain.pem" "$target_dir/fullchain.pem"
install -o root -g root -m 0600 "$source_dir/privkey.pem" "$target_dir/privkey.pem"

/usr/bin/docker exec nginx_reverse_proxy nginx -t
/usr/bin/docker exec nginx_reverse_proxy nginx -s reload
