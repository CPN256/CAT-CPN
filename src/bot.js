import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  downloadMediaMessage
} from '@whiskeysockets/baileys'
import P from 'pino'
import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'

const AUTH_DIR = path.resolve('auth_info_baileys')
const MEDIA_DIR = path.resolve('media')
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const BOT_NAME = process.env.BOT_NAME || 'CAT CPN'
const OWNER = process.env.BOT_OWNER || 'Not configured'
const PREFIXES = ['.', '!']

if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[97m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  red: '\x1b[31m'
}
const paint = (c, s) => `${colors[c] || ''}${s}${colors.reset}`

function printBrand() {
  console.log('\n' + paint('cyan', '╔════════════════════════════════════════════════════════╗'))
  console.log(paint('cyan', '║') + paint('bold', '                  CAT CPN  ♛  ') + paint('cyan', '                  ║'))
  console.log(paint('cyan', '║') + '             ' + paint('blue', 'WHATSAPP BOT • v7.0') + '             ' + paint('cyan', '║'))
  console.log(paint('cyan', '╠════════════════════════════════════════════════════════╣'))
  console.log(paint('cyan', '║') + '          ' + paint('white', 'FAST  •  SECURE  •  ALWAYS ONLINE') + '          ' + paint('cyan', '║'))
  console.log(paint('cyan', '╚════════════════════════════════════════════════════════╝'))
}

function printPairingHelp() {
  console.log('\n' + paint('cyan', '╔════════════════════════════════════════════════════════╗'))
  console.log(paint('cyan', '║') + paint('bold', '                 DEVICE CONNECTION') + '                 ' + paint('cyan', '║'))
  console.log(paint('cyan', '╠════════════════════════════════════════════════════════╣'))
  console.log(paint('cyan', '║') + '  📱 Enter your WhatsApp number with country code.    ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + '  Example: ' + paint('yellow', '2567XXXXXXXX') + '                                  ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + '  Do not use +, spaces, brackets or hyphens.          ' + paint('cyan', '║'))
  console.log(paint('cyan', '╚════════════════════════════════════════════════════════╝'))
}

function printPairingCode(code) {
  console.log('\n' + paint('cyan', '╔════════════════════════════════════════════════════════╗'))
  console.log(paint('cyan', '║') + paint('bold', '                    CAT CPN  ♛') + '                    ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + paint('bold', '                    PAIRING CODE') + '                 ' + paint('cyan', '║'))
  console.log(paint('cyan', '╠════════════════════════════════════════════════════════╣'))
  console.log(paint('cyan', '║') + '                                                        ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + '              ' + paint('green', '>>>  ' + code + '  <<<') + '              ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + '                                                        ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + '  WhatsApp → Linked Devices → Link with phone number  ' + paint('cyan', '║'))
  console.log(paint('cyan', '║') + '  Then enter the code shown above.                     ' + paint('cyan', '║'))
  console.log(paint('cyan', '╚════════════════════════════════════════════════════════╝'))
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => {
    rl.close()
    resolve(answer.trim())
  }))
}

function normalizePhone(raw) {
  return raw.replace(/\D/g, '')
}

function commandInfo(text) {
  if (!text) return null
  const prefix = PREFIXES.find(p => text.startsWith(p))
  if (!prefix) return null
  const body = text.slice(prefix.length).trim()
  if (!body) return null
  const [command, ...args] = body.split(/\s+/)
  return { command: command.toLowerCase(), args, prefix }
}

function menuText() {
  return `╭━━━〔 👑 ${BOT_NAME} 〕━━━╮
┃
┃  ⚡ Main Commands
┃  ${'.menu'}  /  ${'!menu'}   → Show this menu
┃  ${'.ping'}  /  ${'!ping'}   → Check bot status
┃  ${'.hello'} /  ${'!hello'}  → Say hello
┃  ${'.echo'} <text>          → Echo text
┃  ${'.info'}                 → Bot information
┃
┃  👥 Group Tools
┃  ${'.groupinfo'}            → Group information
┃  ${'.admins'}               → List group admins
┃  ${'.promote'}              → Promote replied user
┃  ${'.demote'}               → Demote replied user
┃  ${'.remove'}               → Remove replied user
┃
┃  🛠️ Message Tools
┃  ${'.react'} <emoji>        → React to replied message
┃  ${'.delete'}               → Delete replied message
┃  ${'.save'}                 → Save replied media
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
          CAT CPN • Fast • Secure • Online`
}

async function requestPairingCode(sock, state) {
  if (state.creds.registered) return
  printBrand()
  printPairingHelp()

  let phone = ''
  while (!phone) {
    const raw = await ask(paint('green', '  › WhatsApp number: '))
    phone = normalizePhone(raw)
    if (!/^\d{8,15}$/.test(phone)) {
      console.log(paint('red', '  ✖ Invalid number. Use digits only, including country code.'))
      phone = ''
    }
  }

  try {
    // Give the socket a moment to establish its WebSocket before registration.
    await new Promise(r => setTimeout(r, 1500))
    const code = await sock.requestPairingCode(phone)
    printPairingCode(code)
  } catch (err) {
    console.error(paint('red', '\n✖ Pairing-code request failed:'), err?.message || err)
    console.log(paint('yellow', '  Check the number format and WhatsApp Linked Devices, then restart once.'))
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  printBrand()
  console.log(paint('gray', '  Baileys: 7.0.0-rc14'))
  console.log(paint('gray', `  Auth: ${AUTH_DIR}`))

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    logger: P({ level: LOG_LEVEL }),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
  })

  let pairingStarted = false

  sock.ev.on('creds.update', saveCreds)

  // Ask for the number immediately on a fresh session so Pterodactyl users
  // never get stuck waiting for a connection.update event.
  if (!state.creds.registered) {
    pairingStarted = true
    requestPairingCode(sock, state).catch(err => {
      console.error(paint('red', '\n✖ Pairing flow failed:'), err?.message || err)
    })
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'connecting') {
      console.log(paint('yellow', '  ⟳ Connecting to WhatsApp...'))
    }

    if (connection === 'open') {
  console.log('✅ CAT CPN connected to WhatsApp!')

  // 👇 PUT THE WELCOME MESSAGE CODE HERE
  const selfJid = sock.user?.id

  if (!selfJid) {
    console.log('⚠️ Could not find the bot WhatsApp JID.')
    return
  }

  try {
    await sock.sendMessage(selfJid, {
      text: `👑 *CAT CPN — CONNECTED!*

Hello! 👋 Welcome to CAT CPN.

✅ WhatsApp account successfully paired
⚡ Status: Online
🤖 Bot: CAT CPN

📋 Send *.menu* to view my commands.

🚀 CAT CPN is ready!`
    })

    console.log('✅ Welcome message sent successfully!')
  } catch (error) {
    console.error('❌ Failed to send welcome message:', error)
  }

  // 👇 KEEP THE REST OF YOUR EXISTING CODE BELOW THIS
    }
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      console.log(paint('red', `\n  ✖ Connection closed${code ? ` (${code})` : ''}.`))
      if (shouldReconnect) {
        console.log(paint('yellow', '  ↻ Reconnecting...'))
        setTimeout(() => startBot().catch(console.error), 3000)
      } else {
        console.log(paint('red', '  You have been logged out. Remove auth_info_baileys only if you intentionally want a fresh link.'))
      }
    }

  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue

      const jid = msg.key.remoteJid
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ''

      const parsed = commandInfo(text)
      if (!parsed) continue

      const { command, args } = parsed
      const reply = async body => sock.sendMessage(jid, { text: body }, { quoted: msg })

      if (command === 'menu' || command === 'menue' || command === 'help') {
        await reply(menuText())
      } else if (command === 'ping') {
        await reply('🏓 CAT CPN is online and responding.')
      } else if (command === 'hello') {
        await reply('👋 Hello! CAT CPN is ready.')
      } else if (command === 'echo') {
        await reply(args.join(' ') || 'Usage: .echo <text>')
      } else if (command === 'info') {
        await reply(`👑 ${BOT_NAME}\n⚡ WhatsApp Bot\n🧩 Baileys 7.x\n📌 Prefixes: . and !\n👤 Owner: ${OWNER}`)
      } else if (command === 'groupinfo') {
        if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.')
        const meta = await sock.groupMetadata(jid)
        await reply(`👥 ${meta.subject}\nMembers: ${meta.participants.length}\nOwner: ${meta.owner || 'Not available'}`)
      } else if (command === 'admins') {
        if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.')
        const meta = await sock.groupMetadata(jid)
        const admins = meta.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`)
        await sock.sendMessage(jid, { text: `🛡️ Group admins:\n${admins.join('\n') || 'None'}`, mentions: meta.participants.filter(p => p.admin).map(p => p.id) }, { quoted: msg })
      } else if (['promote', 'demote', 'remove'].includes(command)) {
        if (!jid.endsWith('@g.us')) return reply('❌ This command only works in groups.')
        const quoted = msg.message.extendedTextMessage?.contextInfo?.participant
        if (!quoted) return reply(`Reply to a member's message and use .${command}.`)
        const action = command === 'remove' ? 'remove' : command
        await sock.groupParticipantsUpdate(jid, [quoted], action)
        await reply(`✅ ${command} completed.`)
      } else if (command === 'react') {
        const emoji = args[0] || '❤️'
        const target = msg.message.extendedTextMessage?.contextInfo
        if (!target?.stanzaId) return reply('Reply to a message and use .react 👍')
        await sock.sendMessage(jid, { react: { text: emoji, key: { remoteJid: jid, id: target.stanzaId, participant: target.participant } } })
      } else if (command === 'delete') {
        const target = msg.message.extendedTextMessage?.contextInfo
        if (!target?.stanzaId) return reply('Reply to the bot message you want to delete.')
        await sock.sendMessage(jid, { delete: { remoteJid: jid, id: target.stanzaId, participant: target.participant } })
      } else if (command === 'save') {
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quotedMsg) return reply('Reply to an image/video/document message and use .save.')
        const fake = {
          key: {
            remoteJid: jid,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
          },
          message: quotedMsg
        }
        try {
          const buffer = await downloadMediaMessage(fake, 'buffer', {})
          const file = path.join(MEDIA_DIR, `cat-cpn-${Date.now()}.bin`)
          fs.writeFileSync(file, buffer)
          await reply(`💾 Saved media on the server as ${path.basename(file)}`)
        } catch {
          await reply('❌ Could not save that media.')
        }
      }
    }
  })

  if (state.creds.registered) {
    console.log(paint('green', '  ✓ Saved WhatsApp session detected.'))
  }
}

startBot().catch(err => {
  console.error(paint('red', '\nCAT CPN failed to start:'), err)
  process.exit(1)
})
