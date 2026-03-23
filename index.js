const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ActivityType 
} = require('discord.js');
const midtransClient = require('midtrans-client');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// Inisialisasi Bot & Midtrans
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const snap = new midtransClient.Snap({
    isProduction: false, // Set true jika sudah live
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// --- BAGIAN 1: BOT DISCORD ---

client.once('ready', () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    client.user.setActivity('Giveaway QRIS', { type: ActivityType.Watching });
});

// Command Admin untuk Setup Embed Giveaway
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-qris' && message.member.permissions.has('Administrator')) {
        const embed = new EmbedBuilder()
            .setTitle('🎁 Giveaway Ticket - QRIS Only')
            .setDescription('Daftar giveaway secara otomatis menggunakan QRIS.\n\n**Harga:** Rp5.000\n**Benefit:** Role Khusus & Akses Giveaway.')
            .setFooter({ text: 'Pembayaran aman via Midtrans' })
            .setColor('#2ecc71');

        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('buy_qris')
                .setLabel('Beli Tiket (QRIS)')
                .setEmoji('💳')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [btn] });
    }
});

// Handling Klik Tombol
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'buy_qris') {
        const orderId = `GWY-${interaction.user.id}-${Date.now()}`;
        
        try {
            const transaction = await snap.createTransaction({
                transaction_details: {
                    order_id: orderId,
                    gross_amount: 5000 // Harga tiket
                },
                customer_details: {
                    first_name: interaction.user.username,
                    last_name: interaction.user.id
                },
                enabled_payments: ["gopay", "qris"] // Fokus ke QRIS/E-wallet
            });

            const replyEmbed = new EmbedBuilder()
                .setTitle('🎫 Invoice Tiket Giveaway')
                .setDescription(`Silahkan klik tombol di bawah untuk membayar via **QRIS / E-Wallet**.\n\n**Order ID:** \`${orderId}\``)
                .setColor('#3498db');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Bayar Sekarang')
                    .setURL(transaction.redirect_url)
                    .setStyle(ButtonStyle.Link)
            );

            await interaction.reply({ embeds: [replyEmbed], components: [row], ephemeral: true });

            // LOG: User mencoba bayar
            logToAdmin('🟡 Pending Payment', `User <@${interaction.user.id}> telah membuat invoice.`);

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'Gagal membuat invoice.', ephemeral: true });
        }
    }
});

// --- BAGIAN 2: WEBHOOK (NOTIFIKASI BAYAR) ---

app.post('/webhook', async (req, res) => {
    const notification = req.body;

    // Verifikasi status transaksi dari Midtrans
    const statusResponse = await snap.transaction.notification(notification);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Ambil User ID dari Order ID (format: GWY-UserID-Timestamp)
    const userId = orderId.split('-')[1];

    if (transactionStatus == 'settlement') {
        if (fraudStatus == 'accept') {
            // PEMBAYARAN BERHASIL
            await giveRoleAndLog(userId, orderId);
        }
    }

    res.status(200).send('OK');
});

// Fungsi untuk memberi role dan log
async function giveRoleAndLog(userId, orderId) {
    try {
        const guild = client.guilds.cache.first(); // Sesuaikan jika bot ada di banyak server
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(process.env.GIVEAWAY_ROLE_ID);

        if (member && role) {
            await member.roles.add(role);
            
            // Log ke Admin
            logToAdmin('🟢 Pembayaran Berhasil', 
                `**User:** <@${userId}>\n` +
                `**Order ID:** \`${orderId}\`\n` +
                `**Status:** Role Telah Diberikan.`);
            
            // DM User (Opsional)
            member.send('✅ Pembayaran berhasil! Role giveaway telah ditambahkan ke akun Anda. Semoga beruntung!').catch(() => null);
        }
    } catch (err) {
        console.error('Error saat memberi role:', err);
    }
}

async function logToAdmin(title, desc) {
    const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setTimestamp()
            .setColor(title.includes('Berhasil') ? '#2ecc71' : '#f1c40f');
        channel.send({ embeds: [embed] });
    }
}

app.listen(process.env.PORT, () => console.log(`🚀 Webhook Listener ready on port ${process.env.PORT}`));
client.login(process.env.DISCORD_TOKEN);
