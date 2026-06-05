import {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID
const API_URL    = process.env.API_URL ?? 'http://localhost:3001'

client.once('clientReady', () => {
  console.log(`Discord bot ready → ${client.user.tag}`)
})

// Watch for incoming webhook messages in the support channel
client.on('messageCreate', async message => {
  if (message.channelId !== CHANNEL_ID) return
  if (!message.webhookId) return
  if (!message.content.startsWith('📨')) return

  // Parse format: "📨 New message from [name]\n[text]\n\nReply ID: [id]"
  const lines          = message.content.split('\n')
  const restaurantName = lines[0].replace('📨 New message from ', '').trim()
  const replyIdLine    = lines.find(l => l.startsWith('Reply ID: '))
  const messageId      = replyIdLine?.replace('Reply ID: ', '').trim()
  const messageText    = lines
    .slice(1)
    .filter(l => !l.startsWith('Reply ID: ') && l.trim() !== '')
    .join('\n')
    .trim()

  if (!messageId) return

  const embed = new EmbedBuilder()
    .setColor(0x4A90D9)
    .setTitle(`📨 ${restaurantName}`)
    .setDescription(messageText || '*(no message text)*')
    .setTimestamp()
    .setFooter({ text: `Message ID: ${messageId}` })

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reply:${messageId}`)
      .setLabel('Reply')
      .setStyle(ButtonStyle.Primary),
  )

  await message.channel.send({ embeds: [embed], components: [row] })
  await message.delete().catch(() => {})
})

// Handle button clicks + modal submissions
client.on('interactionCreate', async interaction => {

  // ── Reply button clicked → show modal ─────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('reply:')) {
    const messageId = interaction.customId.slice('reply:'.length)

    const modal = new ModalBuilder()
      .setCustomId(`modal:${messageId}`)
      .setTitle('Send Reply')

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reply_text')
          .setLabel('Your reply')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Type your reply here...')
          .setRequired(true)
          .setMaxLength(2000),
      ),
    )

    await interaction.showModal(modal)
  }

  // ── Modal submitted → POST to /api/reply ──────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId.startsWith('modal:')) {
    // Defer FIRST — must happen within 3 s or Discord throws 10062
    await interaction.deferReply({ ephemeral: true })

    const messageId = interaction.customId.slice('modal:'.length)
    const replyText = interaction.fields.getTextInputValue('reply_text')

    try {
      const res = await fetch(`${API_URL}/api/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, reply: replyText }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`)

      await interaction.editReply({ content: '✅ Reply sent!' })

      // Mark the embed's button as replied
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`reply:${messageId}`)
          .setLabel('✓ Replied')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      )
      await interaction.message.edit({ components: [disabledRow] }).catch(() => {})
    } catch (err) {
      console.error('Reply error:', err.message)
      await interaction.editReply({ content: `❌ Failed to send reply: ${err.message}` })
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
