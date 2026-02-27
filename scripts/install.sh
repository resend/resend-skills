#!/usr/bin/env bash
set -e

# ── Colors ───────────────────────────────────────────────────────────────────
BOLD=$'\033[1m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
NC=$'\033[0m'

printf "\n${BOLD}Resend Skills${NC}\n\n"

npx skills add resend/resend-skills
npx skills add resend/react-email
npx skills add resend/email-best-practices

printf "\n${GREEN}${BOLD}Resend skills installed successfully!${NC}\n\n"
printf "${YELLOW}!${NC} Restart your tool(s) to load skills.\n\n"
