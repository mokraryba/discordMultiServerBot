# Discord Casino Bot

A feature-rich multi server Discord bot with gambling and economy features, built with Discord.js and MongoDB.

This is just an example bot i use to learn how to make discord bots. This project is not meant to be used in production. This was my first attempt at TypeScript. Most of the stuff is taken from my private repo of and old bot written in JS. There are a lot of functionalities missing from the original bot.

## Features

- 💰 Economy System
- 🎰 Gambling Features
- 👑 Admin Controls
- 🔐 Permission-based Commands
- ⚙️ Per-Server Settings
- 🎫 License Key System
- 😈 Liar's bar game

## Not implemented / To-Do
List of all features the original bot written in JS had.
- Slots
- Sports betting
- Voucher system
- Trivia
- Roulette
- Crash

## Tech Stack

- Node.js
- TypeScript
- Discord.js
- MongoDB
- Moment.js

## Prerequisites

- Node.js 16.9.0 or higher
- MongoDB instance
- Discord Bot Token
- pnpm package manager

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/discord-casino-bot.git
```
2. Install dependencies
```bash
pnpm install
```
3. Create a `.env` file with the following variables:
```
TOKEN=
CLIENT_ID=
CLIENT_SECRET=
GUILD_ID=
```
4. Deploy commands
```bash
pnpm run deploy
```
5. Start the bot
```bash
pnpm run dev
```

## Bot Setup

1. Invite the bot to your server with required permissions
2. Use `/registerbot` command to set up the bot (requires Ban Members permission)
3. Assign admin roles for managing bot features

## Available Commands

1. Admin Commands (/admin folder):

- /addadminrole - Add new admin role to the server
- /addbalance - Add balance to a user
- /createblackjack - Create new blackjack game channel
- /createliarsgame - Create liar's bar game channel
- /createslots - Create new slots game channel
- /registerbot - Register the bot and set up initial admin role

2. User Commands (/user):

- /balance - Check your current balance
- /faceit - Check Faceit stats for a given username

### Admin Commands
- `/addbalance` - Add balance to a user
- `/registerbot` - Register the bot for your server

### Economy Commands
- Various gambling and economy related commands
- Balance management


## License
MIT License

## Support
For support, please open an issue in the GitHub repository or contact the maintainers.

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request