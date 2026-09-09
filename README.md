# CPN WhatsApp Bot

A WhatsApp bot built with Baileys.

## Features

- Pair WhatsApp using a pairing code
- Persistent authentication
- Receive messages
- Send messages
- Automatic reconnect
- Basic commands

## Requirements

- Node.js 20+
- A WhatsApp account that you control

## Installation

Clone or download the repository, then run:

npm install

## Start

npm start

The bot will ask:

Enter the WhatsApp phone number to pair:

Enter the number with its country code.

Example:

254700000000

Do not include the `+`.

The bot will display a pairing code.

On WhatsApp:

Settings → Linked devices → Link a device → Link with phone number

Enter the displayed code.

## Commands

!ping

!menu

!hello

## Authentication

The WhatsApp session is stored in:

auth_info/

Do not upload this directory to GitHub.

It contains authentication credentials for the WhatsApp account.
