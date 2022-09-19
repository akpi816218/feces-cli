#!/bin/bash
printf "cURLing the executable...\n"
curl -s https://raw.githubusercontent.com/akpi816218/feces/gitmaster/feces -O
printf "Setting executable file permissions (755)...\n"
chmod 755 feces
printf "Done installing.\n"
exit 0