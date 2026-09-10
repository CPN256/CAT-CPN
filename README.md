# 👑 CAT CPN — Latest Baileys

CAT CPN is a WhatsApp bot for personal/authorized use, powered by the latest official `@whiskeysockets/baileys` release available at build time. This package is pinned to **7.0.0-rc14**, currently the latest official npm release.

## Pterodactyl

The startup command can remain:

```bash
node src/index.js
```

`src/index.js` is a bootstrap entrypoint. If Baileys is missing, it automatically runs npm install before starting the bot.

If you can edit the Pterodactyl startup command, this is also recommended:

```bash
npm install --no-audit --no-fund --prefer-online && npm start
```

## Pairing

On a fresh session the console immediately asks for the WhatsApp number. Enter the full number with country code, digits only, for example:

```text
2567XXXXXXXX
```

Then use WhatsApp → Linked Devices → Link a device → Link with phone number and enter the displayed pairing code.

## Commands

- `.menu` / `.help`
- `.ping`
- `.alive`
- `.runtime`
- `.info` / `.botinfo`
- `.owner`
- `.echo <text>`
- group management commands
- `.react`, `.delete`, `.save`

## Session

Authentication is stored in `auth_info_baileys/`. Do not delete this folder unless you intentionally want to link a new WhatsApp account.

## Important

Baileys 7 introduced breaking changes. The bot uses the v7-compatible API and persistent multi-file auth. Pairing code requires a digits-only phone number with country code.
