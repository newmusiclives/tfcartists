#!/usr/bin/env bash
# Launch the TrueFans RADIO dev site (truefans-radio.netlify.app source)
# Server runs detached, survives terminal close. Logs: /tmp/tfcartists.log
cd "$(dirname "$0")"
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "Already running on http://localhost:3000 (PID $(lsof -ti:3000))"
  exit 0
fi
nohup npm run dev > /tmp/tfcartists.log 2>&1 < /dev/null &
disown
echo "Started, PID $!. Tail logs: tail -f /tmp/tfcartists.log"
echo "URL: http://localhost:3000"
