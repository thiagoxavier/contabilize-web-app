#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_ENV: "${VITE_ENV}"
};
EOF
exec "$@"
