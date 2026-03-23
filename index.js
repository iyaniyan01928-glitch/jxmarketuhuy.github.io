const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ActivityType 
} = require('discord.js');
const axios = require('axios');
const crypto = require('crypto');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// --- BAGIAN 1: BOT DISCORD ---

client.once('ready', () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    client.user.setActivity('Giveaway Duitku', { type: ActivityType.Watching });
});

// Setup Panel Giveaway (Ketik !setup-qris)
client.on('messageCreate', async (message) => {
    if (message.content === '!setup-qris' && message.member.permissions.has('Administrator')) {
        const embed = new EmbedBuilder()
            .setTitle('🎁 Giveaway Ticket - QRIS Duitku')
            .setDescription('Daftar giveaway otomatis menggunakan QRIS/E-Wallet.\n\n**Harga:** Rp5.000\n**Benefit:** Role Khusus Giveaway.')
            .setFooter({ text: 'Pembayaran aman via Duitku' })
            .setColor('#f39c12');

        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('buy_qris_duitku')
                .setLabel('Beli Tiket (QRIS)')
                .setEmoji('💳')
                .setStyle(ButtonStyle.Success)
        );

        await message.channel.send({ embeds: [embed], components: [btn] });
    }
});

// Handling Klik Tombol
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'buy_qris_duitku') {
        const userId = interaction.user.id;
        const amount = 5000;
        const merchantOrderId = `GWY-${userId}-${Date.now()}`;
        
        // Pembuatan Signature Duitku
        const signature = crypto.createHash('md5')
            .update(process.env.DUITKU_MERCHANT_CODE + merchantOrderId + amount + process.env.DUITKU_API_KEY)
            .digest('hex');

        const payload = {
            merchantCode: process.env.DUITKU_MERCHANT_CODE,
            paymentAmount: amount,
            paymentMethod: 'SP', // SP = QRIS (ShopeePay/All QRIS)
            merchantOrderId: merchantOrderId,
            productDetails: 'Tiket Giveaway Discord',
            customerVaName: interaction.user.username,
            email: 'user@discord.com',
            callbackUrl: process.env.CALLBACK_URL,
            returnUrl: 'https://discord.com',
            signature: signature,
            expiryPeriod: 15
        };

        try {
            const response = await axios.post('https://passport.duitku.com/webapi/api/merchant/v2/inquiry', payload);
            
            if (response.data && response.data.paymentUrl) {
                const replyEmbed = new EmbedBuilder()
                    .setTitle('🎫 Invoice Tiket Giveaway')
                    .setDescription(`Silahkan selesaikan pembayaran via **QRIS**.\n\n**Order ID:** \`${merchantOrderId}\``)
                    .setColor('#3498db');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Scan QRIS Sekarang')
                        .setURL(response.data.paymentUrl)
                        .setStyle(ButtonStyle.Link)
                );

                await interaction.reply({ embeds: [replyEmbed], components: [row], ephemeral: true });
                
                logToAdmin('🟡 Pending Payment', `User <@${userId}> telah membuat invoice QRIS.`);
            }
        } catch (error) {
            console.error('Duitku Error:', error.message);
            interaction.reply({ content: 'Gagal menghubungi server pembayaran.', ephemeral: true });
        }
    }
});

// --- BAGIAN 2: WEBHOOK CALLBACK (NOTIFIKASI BAYAR) ---

app.post('/webhook', async (req, res) => {
    const { merchantCode, amount, merchantOrderId, signature, resultCode } = req.body;

    // Verifikasi Keamanan Signature
    const calcSignature = crypto.createHash('md5')
        .update(merchantCode + amount + merchantOrderId + process.env.DUITKU_API_KEY)
        .digest('hex');

    if (signature === calcSignature) {
        if (resultCode === '00') {
            const userId = merchantOrderId.split('-')[1];
            await giveRoleAndLog(userId, merchantOrderId, amount);
        }
        res.status(200).send('OK');
    } else {
        res.status(400).send('Invalid Signature');
    }
});

// Fungsi untuk memberi role dan log
async function giveRoleAndLog(userId, orderId, amount) {
    try {
        const guild = client.guilds.cache.first(); 
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(process.env.GIVEAWAY_ROLE_ID);

        if (member && role) {
            await member.roles.add(role);
            
            logToAdmin('🟢 Pembayaran Berhasil', 
                `**User:** <@${userId}>\n` +
                `**Order ID:** \`${orderId}\`\n` +
                `**Nominal:** Rp${parseInt(amount).toLocaleString('id-ID')}\n` +
                `**Status:** Role Telah Diberikan.`);
            
            member.send('✅ Pembayaran Duitku berhasil! Kamu sudah terdaftar di giveaway. Good luck!').catch(() => null);
        }
    } catch (err) {
        console.error('Error saat eksekusi success:', err);
    }
}

async function logToAdmin(title, desc) {
    try {
        const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(desc)
                .setTimestamp()
                .setColor(title.includes('Berhasil') ? '#2ecc71' : '#f1c40f');
            channel.send({ embeds: [embed] });
        }
    } catch (e) { console.log('Log channel tidak ditemukan'); }
}

app.listen(process.env.PORT || 3000, () => console.log(`🚀 Duitku Listener Active` ));
client.login(process.env.DISCORD_TOKEN);
