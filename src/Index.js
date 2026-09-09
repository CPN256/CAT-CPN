import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import readline from "readline";

const logger = P({
  level: "silent"
});

const AUTH_DIR = "./auth_info";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

function normalizePhoneNumber(number) {
  return number.replace(/\D/g, "");
}

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState(AUTH_DIR);

  let version;

  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;

    console.log(
      `Using Baileys-compatible WhatsApp version: ${version.join(".")}`
    );
  } catch {
    console.log("Could not fetch WhatsApp version information.");
  }

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["CPN", "Chrome", "1.0.0"],
    ...(version ? { version } : {})
  });

  /*
   * Pairing-code login
   */
  if (!sock.authState?.creds?.registered) {
    const phoneNumber = normalizePhoneNumber(
      await question(
        "\nEnter the WhatsApp phone number to pair (country code, no +): "
      )
    );

    if (!phoneNumber) {
      console.log("Invalid phone number.");
      process.exit(1);
    }

    try {
      const code = await sock.requestPairingCode(phoneNumber);

      console.log("\n================================");
      console.log("       CPN WHATSAPP BOT");
      console.log("================================");
      console.log(`Pairing code: ${code}`);
      console.log("================================");
      console.log(
        "Open WhatsApp → Linked devices → Link a device → Link with phone number."
      );
      console.log("Enter the pairing code shown above.\n");
    } catch (error) {
      console.error("Could not generate pairing code:", error);
    }
  }

  /*
   * Save authentication credentials
   */
  sock.ev.on("creds.update", saveCreds);

  /*
   * Connection updates
   */
  sock.ev.on("connection.update", async (update) => {
    const {
      connection,
      lastDisconnect
    } = update;

    if (connection === "connecting") {
      console.log("Connecting to WhatsApp...");
    }

    if (connection === "open") {
      console.log("\n================================");
      console.log("       CPN BOT CONNECTED");
      console.log("================================\n");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut;

      console.log(
        `WhatsApp connection closed. Reconnect: ${shouldReconnect}`
      );

      if (shouldReconnect) {
        setTimeout(() => {
          startBot().catch(console.error);
        }, 3000);
      } else {
        console.log(
          "The WhatsApp session was logged out. Delete auth_info and pair again."
        );
      }
    }
  });

  /*
   * Incoming messages
   */
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const message of messages) {
      if (!message.message) continue;

      if (message.key.fromMe) continue;

      const jid = message.key.remoteJid;

      if (!jid) continue;

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";

      if (!text.trim()) continue;

      console.log(
        `[MESSAGE] ${jid}: ${text}`
      );

      const command = text.trim().toLowerCase();

      /*
       * !ping
       */
      if (command === "!ping") {
        await sock.sendMessage(jid, {
          text: "🏓 Pong!\n\nCPN WhatsApp Bot is online."
        });

        continue;
      }

      /*
       * !menu
       */
      if (command === "!menu") {
        await sock.sendMessage(jid, {
          text:
            "🤖 *CPN WHATSAPP BOT*\n\n" +
            "Available commands:\n\n" +
            "• !ping — Check bot status\n" +
            "• !menu — Show this menu\n" +
            "• !hello — Say hello"
        });

        continue;
      }

      /*
       * !hello
       */
      if (command === "!hello") {
        await sock.sendMessage(jid, {
          text: "Hello 👋\n\nI'm the CPN WhatsApp Bot."
        });

        continue;
      }
    }
  });

  return sock;
}

startBot().catch((error) => {
  console.error("Fatal bot error:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\nStopping CPN bot...");
  rl.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nStopping CPN bot...");
  rl.close();
  process.exit(0);
});
