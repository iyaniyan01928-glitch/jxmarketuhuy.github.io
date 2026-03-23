const express = require('express');
const app = express();
const { EmbedBuilder } = require('discord.js');

// 1. Fungsi Helper untuk Kirim Log ke Discord
async function sendLog(client, title, description, color = '#5865F2') {
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

    logChannel.send({ embeds: [embed] });
}

// 2. Endpoint Webhook (PENTING: Gunakan stripe-cli atau deploy ke VPS)
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log ketika pembayaran BERHASIL
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const discordId = session.metadata.discord_id;

        await sendLog(client, '✅ Pembayaran Berhasil!', 
            `**User ID:** <@${discordId}>\n` +
            `**Email:** ${session.customer_details.email}\n` +
            `**Jumlah:** Rp${(session.amount_total / 100).toLocaleString('id-ID')}\n` +
            `**Status:** Tiket Giveaway Ditambahkan`, 
            '#2ECC71');

        // Di sini Anda bisa menambahkan kode untuk memberi Role otomatis:
        // const guild = client.guilds.cache.first();
        // const member = await guild.members.fetch(discordId);
        // member.roles.add('ID_ROLE_GIVEAWAY');
    }

    res.json({received: true});
});

app.listen(3000, () => console.log('Webhook server berjalan di port 3000'));
