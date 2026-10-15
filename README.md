# Phosters Tutorial Centre — Telegram Test Bot

A Telegram-based test platform for JAMB and Post-UTME candidates. Students can take timed practice tests directly inside Telegram with instant automatic marking.

## Features
- **Admin Controls**: Create manual tests, import questions via CSV/Excel, and review past test scores.
- **Bulk Question Imports**: Supports `.csv` and `.xlsx` files with automatic column detection and validation.
- **Automated Marking**: Evaluates student choices against answer keys and generates percentage scores.
- **Persistent Storage**: Saves published tests and test results in `data/phosters-data.json`.
- **Phosters Community Integration**: Quick menu links to announcements, subject channels, and discussions.

## Quick Start

### 1. Configure `.env`
Open `.env` and fill in your credentials:
```dotenv
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_IDS=123456789,987654321
COMMUNITY_URL=https://t.me/phosterscommunity
ANNOUNCEMENTS_URL=https://t.me/phosters
SCIENCE_URL=https://t.me/+uETLx7UMbOo3MmVk
ARTS_URL=https://t.me/+4NpTXTNC-FZlNGU0
COMMERCIAL_URL=https://t.me/+IZ68IFc8mgw4MjI8
GENERAL_ENGLISH_URL=
DATA_FILE=./data/phosters-data.json
```
- **BOT_TOKEN**: Obtained from Telegram's `@BotFather`.
- **ADMIN_IDS**: Comma-separated Telegram User IDs authorized to create tests. You can get your ID with `/myid` in the bot.

### 2. Run the Bot
```powershell
npm start
```

### 3. Telegram Commands
- `/start` — Main menu
- `/tests` — Browse and take practice tests
- `/myid` — Check your Telegram ID & admin status
- `/help` — How to use the bot
- `/admin` — Open admin management panel (Admins only)
- `/results` — View recent student test submissions (Admins only)
