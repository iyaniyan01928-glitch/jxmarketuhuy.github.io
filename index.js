// botmm.js - BOT REKBER DENGAN ENV, PAYMENT, DAN LOG BERSIH
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ========== CLEAR CONSOLE ==========
console.clear();

// ========== ASCII ART HEADER ==========
console.log('\x1b[36m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
console.log('\x1b[36m%s\x1b[0m', '║                    BOT REKBER V2.0                        ║');
console.log('\x1b[36m%s\x1b[0m', '║                    [ PAYMENT SYSTEM ]                      ║');
console.log('\x1b[36m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
console.log('');

// ========== ERROR HANDLER GLOBAL ==========
process.on('uncaughtException', (error) => {
    console.log('\x1b[41m%s\x1b[0m', '❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
    console.log('\x1b[31m%s\x1b[0m', `Pesan: ${error.message}`);
    console.log('\x1b[90m%s\x1b[0m', `Stack: ${error.stack}`);
});

process.on('unhandledRejection', (error) => {
    console.log('\x1b[43m%s\x1b[0m', '⚠️⚠️⚠️ UNHANDLED REJECTION ⚠️⚠️⚠️');
    console.log('\x1b[33m%s\x1b[0m', `Pesan: ${error.message}`);
});

// ========== CONFIG FROM ENV ==========
const config = {
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX || '!',
    ticketCategory: process.env.TICKET_CATEGORY || 'TICKETS',
    adminRole: process.env.ADMIN_ROLE || 'Admin',
    logChannel: process.env.LOG_CHANNEL || 'ticket-log',
    deleteClosedTickets: process.env.DELETE_CLOSED_TICKETS === 'true',
    deleteDelay: parseInt(process.env.DELETE_DELAY) || 10,
    rolePrefix: process.env.ROLE_PREFIX || 'REKBER',
    debugMode: process.env.DEBUG_MODE === 'true',
    paymentImageUrl: process.env.PAYMENT_IMAGE_URL || 'https://i.imgur.com/your-payment-image.jpg',
    paymentChannel: process.env.PAYMENT_CHANNEL || 'payment-info'
};

// ========== CLEAN LOGGER WITH COLORS ==========
const logger = {
    info: (msg) => console.log('\x1b[34m%s\x1b[0m', 'ℹ️ INFO    │', msg),
    success: (msg) => console.log('\x1b[32m%s\x1b[0m', '✅ SUCCESS │', msg),
    warn: (msg) => console.log('\x1b[33m%s\x1b[0m', '⚠️ WARN    │', msg),
    error: (msg) => console.log('\x1b[31m%s\x1b[0m', '❌ ERROR   │', msg),
    ticket: (msg) => console.log('\x1b[35m%s\x1b[0m', '🎫 TICKET  │', msg),
    payment: (msg) => console.log('\x1b[36m%s\x1b[0m', '💰 PAYMENT │', msg),
    role: (msg) => console.log('\x1b[33m%s\x1b[0m', '👥 ROLE    │', msg),
    debug: (msg) => {
        if (config.debugMode) console.log('\x1b[90m%s\x1b[0m', '🔍 DEBUG   │', msg);
    },
    separator: () => console.log('\x1b[90m%s\x1b[0m', '─'.repeat(50))
};

// ========== CLIENT SETUP ==========
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// ========== DATABASE ==========
const tickets = new Map();
const ticketsDB = path.join(__dirname, 'tickets.json');
let ticketCounter = 1;

// Load tickets dari file
function loadTickets() {
    if (fs.existsSync(ticketsDB)) {
        try {
            const data = fs.readFileSync(ticketsDB, 'utf8');
            const parsed = JSON.parse(data);
            parsed.forEach(ticket => tickets.set(ticket.id, ticket));
            
            parsed.forEach(ticket => {
                if (ticket.ticketNumber && ticket.ticketNumber > ticketCounter) {
                    ticketCounter = ticket.ticketNumber;
                }
            });
            
            logger.success(`${parsed.length} tiket dimuat dari database`);
        } catch (error) {
            logger.error('Error memuat tiket: ' + error.message);
        }
    }
}

function saveTickets() {
    try {
        const ticketsArray = Array.from(tickets.values());
        fs.writeFileSync(ticketsDB, JSON.stringify(ticketsArray, null, 2));
        logger.debug('Tiket tersimpan');
    } catch (error) {
        logger.error('Error menyimpan tiket: ' + error.message);
    }
}

function generateTicketId() {
    return 'T' + Date.now().toString().slice(-6);
}

function getNextTicketNumber() {
    return ticketCounter++;
}

function createEmbed(title, description, color) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Jasa Rekber JX Market' });
}

// ========== BOT READY ==========
client.once('ready', () => {
    console.clear();
    console.log('\x1b[36m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
    console.log('\x1b[36m%s\x1b[0m', '║                    BOT REKBER V2.0                        ║');
    console.log('\x1b[36m%s\x1b[0m', '║                    [ PAYMENT SYSTEM ]                      ║');
    console.log('\x1b[36m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
    console.log('');
    
    logger.success(`Bot ${client.user.tag} siap!`);
    logger.separator();
    logger.info(`Server: ${client.guilds.cache.size} guild`);
    logger.info(`Counter ticket: ${ticketCounter}`);
    logger.info(`Debug mode: ${config.debugMode ? 'ON' : 'OFF'}`);
    logger.info(`Payment Image: ${config.paymentImageUrl.substring(0, 50)}...`);
    logger.separator();
    
    client.user.setActivity('!ticket | !payment', { type: 'PLAYING' });
});

// ========== REKONEKSI OTOMATIS ==========
client.on('disconnect', () => {
    logger.warn('Bot terputus dari Discord! Mencoba reconnect dalam 5 detik...');
    setTimeout(() => {
        client.login(config.token).catch(err => {
            logger.error('Gagal reconnect: ' + err.message);
        });
    }, 5000);
});

client.on('reconnecting', () => {
    logger.info('Bot sedang mencoba reconnect...');
});

client.on('resume', () => {
    logger.success('Berhasil reconnect ke Discord!');
});

// ========== INTERACTION HANDLER ==========
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isButton()) {
            logger.debug(`Button clicked: ${interaction.customId} by ${interaction.user.tag}`);
            
            if (interaction.customId === 'create_ticket') {
                await handleCreateTicketModal(interaction);
            } else if (interaction.customId === 'close_ticket') {
                await handleCloseTicket(interaction);
            } else if (interaction.customId === 'confirm_close') {
                await handleConfirmClose(interaction);
            } else if (interaction.customId === 'cancel_close') {
                await handleCancelClose(interaction);
            } else if (interaction.customId.startsWith('add_user_')) {
                await handleAddUser(interaction);
            }
        }
        
        if (interaction.isModalSubmit()) {
            logger.debug(`Modal submitted: ${interaction.customId} by ${interaction.user.tag}`);
            
            if (interaction.customId === 'ticket_modal') {
                await handleTicketForm(interaction);
            } else if (interaction.customId.startsWith('add_user_modal_')) {
                await handleAddUserModal(interaction);
            }
        }
    } catch (error) {
        logger.error('Error handling interaksi: ' + error.message);
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: '❌ Error memproses perintah.',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// ========== MESSAGE COMMAND ==========
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    if (message.content.toLowerCase() === '!ticket') {
        logger.info(`Perintah !ticket dari ${message.author.tag}`);
        
        const embed = createEmbed(
            '🎫 TICKET REKBER',
            'Klik tombol dibawah untuk membuat ticket rekber.\n\n' +
            '**Format Input User:**\n' +
            '• Mention: @username\n' +
            '• ID: 123456789012345678\n' +
            '• Username: username atau username#0000\n' +
            '• Username saja: username (tanpa #0000)\n\n' +
            'Bot akan mencoba mencari user dengan berbagai metode!',
            0x8600c3
        );
        
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Buat Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫')
        );
        
        await message.reply({ embeds: [embed], components: [button] });
    }
    
    // ========== COMMAND PAYMENT ==========
    if (message.content.toLowerCase() === '!payment') {
        logger.payment(`Perintah !payment dari ${message.author.tag}`);
        await showPaymentInfo(message);
    }
    
    // ========== COMMAND SET PAYMENT (ADMIN ONLY) ==========
    if (message.content.toLowerCase().startsWith('!setpayment ') && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const imageUrl = message.content.slice(11).trim();
        logger.payment(`Update payment image oleh ${message.author.tag}`);
        await updatePaymentImage(message, imageUrl);
    }
    
    if (message.content.toLowerCase() === '!setup' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        logger.info(`Setup by ${message.author.tag}`);
        await setupBot(message);
    }
    
    if (message.content.toLowerCase() === '!resetcounter' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        ticketCounter = 1;
        await message.reply(`✅ Counter ticket direset ke 1`);
        logger.info(`Counter direset oleh ${message.author.tag}`);
    }
    
    if (message.content.toLowerCase().startsWith('!finduser ') && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const username = message.content.slice(10).trim();
        logger.info(`Pencarian user: ${username} oleh ${message.author.tag}`);
        await findAndListUsers(message, username);
    }
});

// ========== FUNGSI PAYMENT ==========
async function showPaymentInfo(message) {
    try {
        const startTime = Date.now();
        
        // Cek apakah di channel yang tepat
        const paymentChannel = message.guild.channels.cache.find(
            c => c.name === config.paymentChannel && c.type === ChannelType.GuildText
        );

        // Buat embed untuk payment info
        const paymentEmbed = new EmbedBuilder()
            .setTitle('💳 INFORMASI PEMBAYARAN')
            .setColor(0x8600c3)
            .setImage(config.paymentImageUrl)
             .setDescription(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
               
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                '**⚠️ PENTING!**\n' +
                '• Selalu konfirmasi pembayaran ke admin\n' +
                '• Kirim bukti transfer di channel ticket\n' +
                '• Jangan transfer sebelum ada kesepakatan\n\n' +
                
                '**📌 CARA KONFIRMASI**\n' +
                '1️⃣ Screenshot bukti transfer\n' +
                '2️⃣ Upload di channel ticket\n' +
                '3️⃣ Tag admin untuk verifikasi\n\n' +
                
                '**🔄 UPDATE GAMBAR**\n' +
                '`!setpayment [image_url]` - Admin only\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )
            .setTimestamp()
            .setFooter({ 
                text: `Diminta oleh ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL() 
            });

        // Kirim ke channel yang sama
        await message.reply({ 
            embeds: [paymentEmbed],
            content: `💰 **Informasi Pembayaran**\n${message.author}`
        });

        // Jika ada channel payment khusus, kirim juga ke sana
        if (paymentChannel && paymentChannel.id !== message.channel.id) {
            await paymentChannel.send({
                embeds: [paymentEmbed],
                content: '📢 **Informasi Pembayaran Terbaru**'
            });
            logger.payment(`Payment info juga dikirim ke #${config.paymentChannel}`);
        }

        const responseTime = Date.now() - startTime;
        logger.payment(`Payment info ditampilkan untuk ${message.author.tag} (${responseTime}ms)`);

    } catch (error) {
        logger.error('Error menampilkan payment: ' + error.message);
        await message.reply({
            content: '❌ Gagal menampilkan informasi pembayaran.'
        });
    }
}

async function updatePaymentImage(message, imageUrl) {
    try {
        const startTime = Date.now();
        
        // Validasi URL gambar
        const isValidUrl = imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
                          imageUrl.includes('cdn.discordapp.com') ||
                          imageUrl.includes('media.discordapp.net') ||
                          imageUrl.includes('i.imgur.com');

        if (!isValidUrl) {
            return message.reply({
                content: '❌ URL tidak valid. Gunakan URL gambar (jpg, png, gif, webp)\n' +
                        'Contoh: https://i.imgur.com/xxxxxxx.jpg'
            });
        }

        // Update config
        const oldImageUrl = config.paymentImageUrl;
        config.paymentImageUrl = imageUrl;

        // Buat embed preview
        const previewEmbed = new EmbedBuilder()
            .setTitle('✅ GAMBAR PAYMENT DIUPDATE')
            .setDescription(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '**Gambar payment berhasil diupdate!**\n\n' +
                '**📊 INFORMASI UPDATE**\n' +
                '```\n' +
                `• Admin      : ${message.author.tag}\n` +
                `• URL Lama   : ${oldImageUrl.substring(0, 30)}...\n` +
                `• URL Baru   : ${imageUrl.substring(0, 30)}...\n` +
                '```\n\n' +
                '**📸 PREVIEW GAMBAR BARU**\n' +
                'Lihat di bawah untuk preview\n\n' +
                '**📝 CARA MENGGUNAKAN**\n' +
                '• Ketik `!payment` untuk melihat hasil\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )
            .setColor(0xd300ff)
            .setImage(imageUrl)
            .setTimestamp()
            .setFooter({ 
                text: `Diupdate oleh ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL() 
            });

        await message.reply({ embeds: [previewEmbed] });

        // Update di channel payment jika ada
        const paymentChannel = message.guild.channels.cache.find(
            c => c.name === config.paymentChannel && c.type === ChannelType.GuildText
        );

        if (paymentChannel) {
            const updateEmbed = new EmbedBuilder()
                .setTitle('🔄 GAMBAR PAYMENT DIUPDATE')
                .setDescription(
                    `**Gambar metode pembayaran telah diperbarui!**\n\n` +
                    `**Diupdate oleh:** ${message.author}\n` +
                    `**Waktu:** <t:${Math.floor(Date.now()/1000)}:F>\n\n` +
                    `Ketik \`!payment\` untuk melihat informasi lengkap.`
                )
                .setColor(0x0099FF)
                .setTimestamp();

            await paymentChannel.send({ embeds: [updateEmbed] });
        }

        // Simpan ke file .env
        try {
            const envPath = path.join(__dirname, '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            if (envContent.includes('PAYMENT_IMAGE_URL=')) {
                envContent = envContent.replace(
                    /PAYMENT_IMAGE_URL=.*/,
                    `PAYMENT_IMAGE_URL=${imageUrl}`
                );
            } else {
                envContent += `\nPAYMENT_IMAGE_URL=${imageUrl}`;
            }
            
            fs.writeFileSync(envPath, envContent);
            logger.payment('PAYMENT_IMAGE_URL disimpan ke .env');
        } catch (error) {
            logger.debug('Gagal menyimpan ke .env: ' + error.message);
        }

        const responseTime = Date.now() - startTime;
        logger.payment(`Payment image diupdate oleh ${message.author.tag} (${responseTime}ms)`);

    } catch (error) {
        logger.error('Error update payment: ' + error.message);
        await message.reply({
            content: `❌ Gagal update gambar: ${error.message}`
        });
    }
}

// ========== FUNGSI TICKET (SISANYA TETAP SAMA) ==========
async function handleCreateTicketModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('Form Ticket Rekber');
    
    const buyerInput = new TextInputBuilder()
        .setCustomId('buyer_username')
        .setLabel('Pembeli (mention/ID/username)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Contoh: @user, 123456789, atau username')
        .setMaxLength(100);
    
    const sellerInput = new TextInputBuilder()
        .setCustomId('seller_username')
        .setLabel('Penjual (mention/ID/username)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Contoh: @user, 123456789, atau username')
        .setMaxLength(100);
    
    const amountInput = new TextInputBuilder()
        .setCustomId('transaction_amount')
        .setLabel('Nominal (Rp)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Contoh: 50000')
        .setMaxLength(20);
    
    const detailInput = new TextInputBuilder()
        .setCustomId('transaction_detail')
        .setLabel('Detail Transaksi')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('Jelaskan detail transaksi...')
        .setMaxLength(500);
    
    modal.addComponents(
        new ActionRowBuilder().addComponents(buyerInput),
        new ActionRowBuilder().addComponents(sellerInput),
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(detailInput)
    );
    
    await interaction.showModal(modal);
}

async function handleTicketForm(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const buyerInput = interaction.fields.getTextInputValue('buyer_username');
        const sellerInput = interaction.fields.getTextInputValue('seller_username');
        const amount = interaction.fields.getTextInputValue('transaction_amount');
        const detail = interaction.fields.getTextInputValue('transaction_detail');
        
        const ticketId = generateTicketId();
        const ticketNumber = getNextTicketNumber();
        
        logger.ticket(`Membuat ticket #${ticketNumber} oleh ${interaction.user.tag}`);
        
        const buyerResult = await findUserByInput(interaction.guild, buyerInput);
        const sellerResult = await findUserByInput(interaction.guild, sellerInput);
        
        const buyerId = buyerResult.id;
        const sellerId = sellerResult.id;
        const buyerUsername = buyerResult.username;
        const sellerUsername = sellerResult.username;
        const buyerMember = buyerResult.member;
        const sellerMember = sellerResult.member;
        
        let category = interaction.guild.channels.cache.find(
            c => c.name.toUpperCase() === config.ticketCategory.toUpperCase() && c.type === ChannelType.GuildCategory
        );
        
        if (!category) {
            category = await interaction.guild.channels.create({
                name: config.ticketCategory,
                type: ChannelType.GuildCategory,
                reason: 'Kategori untuk ticket rekber'
            });
            logger.info(`Kategori ${config.ticketCategory} dibuat`);
        }
        
        const roleName = `${config.rolePrefix} #${ticketNumber}`;
        let ticketRole = null;
        
        try {
            ticketRole = await interaction.guild.roles.create({
                name: roleName,
                color: 0x871F78,
                reason: `Role untuk ticket rekber ${ticketId}`,
                mentionable: true,
                hoist: true
            });
            logger.role(`Role "${roleName}" berhasil dibuat`);
        } catch (error) {
            logger.error(`Gagal membuat role: ${error.message}`);
        }
        
        const usersWithRole = [];
        const failedUsers = [];
        
        if (buyerMember && ticketRole) {
            try {
                await buyerMember.roles.add(ticketRole);
                usersWithRole.push(`Pembeli: ${buyerMember.user.tag}`);
                logger.role(`Role diberikan ke pembeli: ${buyerMember.user.tag}`);
            } catch (error) {
                failedUsers.push(`Pembeli: ${buyerInput}`);
                logger.debug(`Gagal role pembeli: ${error.message}`);
            }
        }
        
        if (sellerMember && ticketRole) {
            try {
                await sellerMember.roles.add(ticketRole);
                usersWithRole.push(`Penjual: ${sellerMember.user.tag}`);
                logger.role(`Role diberikan ke penjual: ${sellerMember.user.tag}`);
            } catch (error) {
                failedUsers.push(`Penjual: ${sellerInput}`);
                logger.debug(`Gagal role penjual: ${error.message}`);
            }
        }
        
        const permissionOverwrites = [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            }
        ];
        
        if (ticketRole) {
            permissionOverwrites.push({
                id: ticketRole.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            });
        }
        
        if (buyerMember && !ticketRole) {
            permissionOverwrites.push({
                id: buyerMember.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            });
        }
        
        if (sellerMember && !ticketRole) {
            permissionOverwrites.push({
                id: sellerMember.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            });
        }
        
        const adminRole = interaction.guild.roles.cache.find(r => r.name === config.adminRole);
        if (adminRole) {
            permissionOverwrites.push({
                id: adminRole.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            });
        }
        
        const channelName = `REKBER #${ticketNumber}`;
        const ticketChannel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Ticket ${ticketId} | Rekber #${ticketNumber} | ${roleName || 'Tanpa Role'}`,
            permissionOverwrites: permissionOverwrites,
            reason: `Ticket rekber oleh ${interaction.user.tag}`
        });
        
        logger.ticket(`Channel dibuat: ${ticketChannel.name}`);
        
        const ticketData = {
            id: ticketId,
            ticketNumber: ticketNumber,
            channelId: ticketChannel.id,
            channelName: channelName,
            buyer: buyerInput,
            seller: sellerInput,
            buyerId: buyerId,
            sellerId: sellerId,
            buyerUsername: buyerUsername,
            sellerUsername: sellerUsername,
            amount: amount,
            detail: detail,
            createdBy: interaction.user.id,
            createdByTag: interaction.user.tag,
            createdAt: new Date().toISOString(),
            status: 'open',
            roleId: ticketRole ? ticketRole.id : null,
            roleName: ticketRole ? ticketRole.name : null
        };
        
        tickets.set(ticketId, ticketData);
        saveTickets();
        
        let mentions = '';
        let addedUsers = [];
        
        if (buyerMember) {
            mentions += `**Pembeli:** ${buyerMember}\n`;
            addedUsers.push(buyerMember.toString());
        } else if (buyerId) {
            mentions += `**Pembeli:** <@${buyerId}>\n`;
            addedUsers.push(`<@${buyerId}>`);
        } else if (buyerUsername) {
            mentions += `**Pembeli:** ${buyerUsername} (User tidak ditemukan di server)\n`;
        } else {
            mentions += `**Pembeli:** ${buyerInput}\n`;
        }
        
        if (sellerMember) {
            mentions += `**Penjual:** ${sellerMember}\n`;
            addedUsers.push(sellerMember.toString());
        } else if (sellerId) {
            mentions += `**Penjual:** <@${sellerId}>\n`;
            addedUsers.push(`<@${sellerId}>`);
        } else if (sellerUsername) {
            mentions += `**Penjual:** ${sellerUsername} (User tidak ditemukan di server)\n`;
        } else {
            mentions += `**Penjual:** ${sellerInput}\n`;
        }
        
        if (ticketRole) {
            mentions += `**Role:** ${ticketRole}\n`;
        }
        
        const ticketEmbed = createEmbed(
            `🎫 TICKET REKBER #${ticketNumber}`,
            `**ID Ticket:** ${ticketId}\n` +
            `**Dibuat oleh:** ${interaction.user}\n` +
            `**Tanggal:** <t:${Math.floor(Date.now()/1000)}:F>\n\n` +
            `${mentions}` +
            `**Nominal:** Rp ${formatCurrency(amount)}\n` +
            `**Detail:** ${detail}\n\n` +
            `**Status:** 🟢 OPEN\n` +
            `*User telah ditambahkan ke channel ini dan mendapat role khusus*`,
            0x8600c3
        );
        
        const buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Tutup Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒'),
            new ButtonBuilder()
                .setCustomId(`add_user_${ticketId}`)
                .setLabel('Tambah User')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('➕')
        );
        
        let mentionText = '';
        if (addedUsers.length > 0) {
            mentionText = `${addedUsers.join(' ')}\n`;
        }
        if (ticketRole) {
            mentionText += `${ticketRole}\n`;
        }
        
        await ticketChannel.send({
            content: `${mentionText}🎉 **TICKET REKBER #${ticketNumber} TELAH DIBUAT!**\nSilakan mulai komunikasi transaksi di sini.`,
            embeds: [ticketEmbed],
            components: [buttonsRow]
        });
        
        const instructionEmbed = createEmbed(
            '📋 INSTRUKSI',
            '**Untuk semua pihak:**\n' +
            '1. Diskusikan transaksi dengan jelas\n' +
            '2. Sertakan bukti jika diperlukan\n' +
            '3. Konfirmasi setelah selesai\n\n' +
            '**Fitur Tambahan:**\n' +
            '• Klik "Tambah User" untuk menambahkan user lain\n' +
            `• Role ${ticketRole ? ticketRole.name : 'khusus'} diberikan otomatis\n` +
            '• Role dihapus saat ticket ditutup\n\n' +
            '**Untuk admin:**\n' +
            'Klik "Tutup Ticket" setelah transaksi selesai',
            0x8600c3
        );
        
        await ticketChannel.send({ embeds: [instructionEmbed] });
        
        let responseMsg = `✅ **Ticket REKBER #${ticketNumber} berhasil dibuat!**\n`;
        responseMsg += `**Channel:** ${ticketChannel}\n`;
        responseMsg += `**ID Ticket:** ${ticketId}\n\n`;
        
        if (ticketRole) {
            responseMsg += `**Role dibuat:** ${ticketRole.name}\n`;
        }
        
        if (usersWithRole.length > 0) {
            responseMsg += `**User dengan role:**\n`;
            usersWithRole.forEach(user => {
                responseMsg += `• ${user}\n`;
            });
        }
        
        if (failedUsers.length > 0) {
            responseMsg += `\n⚠️ **Gagal memberikan role:**\n`;
            failedUsers.forEach(user => {
                responseMsg += `• ${user}\n`;
            });
        }
        
        if (!buyerId && !sellerId) {
            responseMsg += `\n⚠️ **Perhatian:** User tidak ditemukan di server.\n`;
            responseMsg += `Gunakan tombol "Tambah User" di channel untuk menambahkan user nanti.`;
        }
        
        await interaction.editReply({
            content: responseMsg,
            ephemeral: true
        });
        
        logger.success(`Ticket #${ticketNumber} berhasil dibuat`);
        
    } catch (error) {
        logger.error('Membuat ticket: ' + error.message);
        await interaction.editReply({
            content: `❌ **Gagal membuat ticket:**\n${error.message}`,
            ephemeral: true
        });
    }
}

async function handleAddUser(interaction) {
    const ticketId = interaction.customId.replace('add_user_', '');
    const ticketData = tickets.get(ticketId);
    
    if (!ticketData) {
        return interaction.reply({
            content: '❌ Ticket tidak ditemukan.',
            ephemeral: true
        });
    }
    
    const isCreator = interaction.user.id === ticketData.createdBy;
    const hasAdminRole = interaction.member.roles.cache.some(role => role.name === config.adminRole);
    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    
    if (!isCreator && !hasAdminRole && !isAdmin) {
        return interaction.reply({
            content: '❌ Hanya pembuat ticket atau admin yang bisa menambahkan user.',
            ephemeral: true
        });
    }
    
    logger.debug(`Tambah user ke ticket #${ticketData.ticketNumber} oleh ${interaction.user.tag}`);
    
    const modal = new ModalBuilder()
        .setCustomId(`add_user_modal_${ticketId}`)
        .setTitle('Tambah User ke Ticket');
    
    const userInput = new TextInputBuilder()
        .setCustomId('user_to_add')
        .setLabel('Username/ID/Mention')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Masukkan username, ID, atau mention user')
        .setMaxLength(100);
    
    const reasonInput = new TextInputBuilder()
        .setCustomId('add_reason')
        .setLabel('Alasan (opsional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('Contoh: Admin, Moderator, atau Saksi')
        .setMaxLength(50);
    
    modal.addComponents(
        new ActionRowBuilder().addComponents(userInput),
        new ActionRowBuilder().addComponents(reasonInput)
    );
    
    await interaction.showModal(modal);
}

async function handleAddUserModal(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const ticketId = interaction.customId.replace('add_user_modal_', '');
    const ticketData = tickets.get(ticketId);
    
    if (!ticketData) {
        return interaction.editReply({
            content: '❌ Ticket tidak ditemukan.'
        });
    }
    
    const userInput = interaction.fields.getTextInputValue('user_to_add');
    const reason = interaction.fields.getTextInputValue('add_reason') || 'Tambahan';
    
    try {
        const userResult = await findUserByInput(interaction.guild, userInput);
        
        if (!userResult.id) {
            return interaction.editReply({
                content: `❌ User **${userInput}** tidak ditemukan.\n` +
                        `Gunakan format:\n` +
                        `• Mention: @username\n` +
                        `• ID: 123456789012345678\n` +
                        `• Username: username#0000\n` +
                        `• Username saja: username`
            });
        }
        
        const ticketChannel = interaction.guild.channels.cache.get(ticketData.channelId);
        if (!ticketChannel) {
            return interaction.editReply({
                content: '❌ Channel ticket tidak ditemukan.'
            });
        }
        
        await ticketChannel.permissionOverwrites.edit(userResult.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true,
            EmbedLinks: true
        });
        
        if (ticketData.roleId) {
            try {
                const member = await interaction.guild.members.fetch(userResult.id);
                const role = await interaction.guild.roles.fetch(ticketData.roleId);
                if (member && role) {
                    await member.roles.add(role);
                }
            } catch (error) {
                logger.debug(`Gagal memberikan role: ${error.message}`);
            }
        }
        
        const addedUser = userResult.member || userResult.id;
        const notificationEmbed = createEmbed(
            '👤 USER DITAMBAHKAN',
            `**User:** ${addedUser}\n` +
            `**Ditambahkan oleh:** ${interaction.user}\n` +
            `**Alasan:** ${reason}\n` +
            `**Waktu:** <t:${Math.floor(Date.now()/1000)}:R>`,
            0x0099FF
        );
        
        await ticketChannel.send({
            content: `${addedUser}`,
            embeds: [notificationEmbed]
        });
        
        await interaction.editReply({
            content: `✅ **Berhasil menambahkan user!**\n` +
                    `**User:** ${userResult.username || userResult.id}\n` +
                    `**Ticket:** REKBER #${ticketData.ticketNumber}\n` +
                    `**Channel:** ${ticketChannel}`
        });
        
        logger.success(`User ${userResult.username} ditambahkan ke ticket #${ticketData.ticketNumber}`);
        
    } catch (error) {
        logger.error('Menambahkan user: ' + error.message);
        await interaction.editReply({
            content: `❌ **Gagal menambahkan user:**\n${error.message}`
        });
    }
}

async function findUserByInput(guild, input) {
    if (!input || typeof input !== 'string') {
        return { id: null, username: null, member: null };
    }
    
    input = input.trim();
    logger.debug(`Mencari user: "${input}"`);
    
    const mentionMatch = input.match(/<@!?(\d{17,19})>/);
    if (mentionMatch) {
        const userId = mentionMatch[1];
        try {
            const member = await guild.members.fetch(userId);
            return {
                id: userId,
                username: member.user.tag,
                member: member
            };
        } catch (error) {
            return {
                id: userId,
                username: `User (ID: ${userId})`,
                member: null
            };
        }
    }
    
    if (/^\d{17,19}$/.test(input)) {
        try {
            const member = await guild.members.fetch(input);
            return {
                id: input,
                username: member.user.tag,
                member: member
            };
        } catch (error) {
            return {
                id: input,
                username: `User (ID: ${input})`,
                member: null
            };
        }
    }
    
    if (input.includes('#')) {
        const member = guild.members.cache.find(m => 
            m.user.tag.toLowerCase() === input.toLowerCase()
        );
        
        if (member) {
            return {
                id: member.id,
                username: member.user.tag,
                member: member
            };
        }
    }
    
    const members = guild.members.cache.filter(member => {
        const username = member.user.username.toLowerCase();
        const displayName = member.displayName.toLowerCase();
        const inputLower = input.toLowerCase();
        
        return username.includes(inputLower) || 
               displayName.includes(inputLower) ||
               member.user.tag.toLowerCase().includes(inputLower);
    });
    
    if (members.size > 0) {
        const member = members.first();
        return {
            id: member.id,
            username: member.user.tag,
            member: member
        };
    }
    
    try {
        const fetchedMembers = await guild.members.search({
            query: input,
            limit: 1
        });
        
        if (fetchedMembers.size > 0) {
            const member = fetchedMembers.first();
            return {
                id: member.id,
                username: member.user.tag,
                member: member
            };
        }
    } catch (error) {
        logger.debug(`Search error: ${error.message}`);
    }
    
    return {
        id: null,
        username: input,
        member: null
    };
}

async function findAndListUsers(message, input) {
    if (!input) {
        return message.reply('❌ Masukkan username untuk dicari.');
    }
    
    await message.channel.send(`🔍 **Mencari user: "${input}"**`);
    
    const guild = message.guild;
    
    const members = guild.members.cache.filter(member => {
        const username = member.user.username.toLowerCase();
        const displayName = member.displayName.toLowerCase();
        const tag = member.user.tag.toLowerCase();
        const inputLower = input.toLowerCase();
        
        return username.includes(inputLower) || 
               displayName.includes(inputLower) ||
               tag.includes(inputLower);
    });
    
    if (members.size === 0) {
        return message.channel.send('❌ Tidak ada user yang ditemukan.');
    }
    
    const embed = createEmbed(
        `🔍 HASIL PENCARIAN: "${input}"`,
        `Ditemukan **${members.size}** user yang cocok:\n\n` +
        Array.from(members.values())
            .slice(0, 10)
            .map((member, index) => {
                return `**${index + 1}. ${member.user.tag}**\n` +
                       `• ID: ${member.id}\n` +
                       `• Nickname: ${member.displayName || 'Tidak ada'}\n` +
                       `• Mention: ${member}\n`;
            })
            .join('\n') +
        (members.size > 10 ? `\n...dan ${members.size - 10} user lainnya` : ''),
        0x0099FF
    );
    
    await message.channel.send({ embeds: [embed] });
}

async function handleCloseTicket(interaction) {
    try {
        const member = interaction.member;
        const hasAdminRole = member.roles.cache.some(role => role.name === config.adminRole);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        
        if (!hasAdminRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Hanya admin yang bisa menutup ticket.',
                ephemeral: true
            });
        }
        
        const confirmEmbed = createEmbed(
            '⚠️ KONFIRMASI',
            'Yakin ingin menutup ticket ini?\n' +
            '• Channel akan dihapus otomatis\n' +
            '• Role khusus akan dihapus\n' +
            '• User kehilangan akses',
            0x8600c3
        );
        
        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_close')
                .setLabel('Ya, Tutup')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_close')
                .setLabel('Batal')
                .setStyle(ButtonStyle.Secondary)
        );
        
        await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], ephemeral: true });
    } catch (error) {
        logger.error('Error menutup ticket: ' + error.message);
        await interaction.reply({
            content: '❌ Error memproses.',
            ephemeral: true
        });
    }
}

async function handleConfirmClose(interaction) {
    await interaction.deferUpdate();
    
    try {
        const channel = interaction.channel;
        let ticketData = null;
        
        for (const [ticketId, data] of tickets) {
            if (data.channelId === channel.id) {
                ticketData = data;
                break;
            }
        }
        
        if (!ticketData) {
            const channelName = channel.name;
            const match = channelName.match(/REKBER #(\d+)/);
            if (match) {
                const ticketNumber = parseInt(match[1]);
                for (const [ticketId, data] of tickets) {
                    if (data.ticketNumber === ticketNumber) {
                        ticketData = data;
                        break;
                    }
                }
            }
        }
        
        if (!ticketData) {
            return interaction.followUp({
                content: '❌ Data ticket tidak ditemukan.',
                ephemeral: true
            });
        }
        
        logger.ticket(`Menutup ticket #${ticketData.ticketNumber} oleh ${interaction.user.tag}`);
        
        ticketData.status = 'MC/Rekber Berhasil';
        ticketData.closedAt = new Date().toISOString();
        ticketData.closedBy = interaction.user.id;
        ticketData.closedByTag = interaction.user.tag;
        saveTickets();
        
        if (ticketData.roleId) {
            try {
                const role = await interaction.guild.roles.fetch(ticketData.roleId);
                if (role) {
                    await role.delete(`Ticket ${ticketData.id} ditutup oleh ${interaction.user.tag}`);
                    logger.role(`Role "${ticketData.roleName}" dihapus`);
                }
            } catch (error) {
                logger.error(`Gagal menghapus role: ${error.message}`);
            }
        }
        
        await createTicketLog(ticketData, interaction.guild);
        
        const closedEmbed = createEmbed(
            `🔒 TICKET REKBER #${ticketData.ticketNumber} DITUTUP`,
            `**Ticket ID:** ${ticketData.id}\n` +
            `**Ditutup oleh:** ${interaction.user}\n` +
            `**Waktu:** <t:${Math.floor(Date.now()/1000)}:F>\n\n` +
            `**Status:**\n` +
            `• Role dihapus ✓\n` +
            `• Channel dihapus dalam ${config.deleteDelay} detik ✓\n\n` +
            `*Transaksi selesai*`,
            0xFF0000
        );
        
        await channel.send({ embeds: [closedEmbed] });
        
        await channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: false
        });
        
        await channel.setName(`closed-rekber-${ticketData.ticketNumber}`);
        
        await interaction.followUp({
            content: `✅ Ticket REKBER #${ticketData.ticketNumber} ditutup.\nRole telah dihapus otomatis.`,
            ephemeral: true
        });
        
        logger.success(`Ticket #${ticketData.ticketNumber} ditutup`);
        
        if (config.deleteClosedTickets) {
            setTimeout(async () => {
                try {
                    await channel.delete('Ticket selesai - auto delete');
                    logger.ticket(`Channel REKBER #${ticketData.ticketNumber} dihapus`);
                } catch (error) {
                    logger.error('Error menghapus channel: ' + error.message);
                }
            }, config.deleteDelay * 1000);
        }
        
    } catch (error) {
        logger.error('Error menutup ticket: ' + error.message);
        await interaction.followUp({
            content: `❌ Gagal menutup ticket.`,
            ephemeral: true
        });
    }
}

async function handleCancelClose(interaction) {
    await interaction.update({
        content: '✅ Penutupan dibatalkan.',
        embeds: [],
        components: []
    });
}

async function createTicketLog(ticketData, guild) {
    try {
        let logChannel = guild.channels.cache.find(
            c => c.name === config.logChannel && c.type === ChannelType.GuildText
        );
        
        if (!logChannel) {
            logChannel = await guild.channels.create({
                name: config.logChannel,
                type: ChannelType.GuildText,
                reason: 'Log ticket'
            });
            logger.info(`Channel log ${config.logChannel} dibuat`);
        }
        
        const logEmbed = createEmbed(
            `📋 LOG TICKET REKBER #${ticketData.ticketNumber}`,
            `**📌 Rekber ID:** ${ticketData.id}\n` +
            `**✅ Status:** ${ticketData.status.toUpperCase()}\n` +
            `**👤 Creator:** ${ticketData.createdByTag}\n` +
            `**👤 Closer:** ${ticketData.closedByTag || '-'}\n` +
            `**🌟 Role:** ${ticketData.roleName || 'Tidak ada'}\n\n` +
            `**🤝 Pembeli:** ${ticketData.buyerUsername || ticketData.buyer}\n` +
            `**🤝 Penjual:** ${ticketData.sellerUsername || ticketData.seller}\n` +
            `**💸 Nominal:** Rp ${formatCurrency(ticketData.amount)}\n` +
            `**📝 Detail:** ${ticketData.detail}\n` +
            `**🌐 Source:** ${ticketData.channelName}`,
            ticketData.status === 'MC/Rekber Berhasil' ? 0x8600c3 : 0x8600c3
        );
        
        await logChannel.send({ embeds: [logEmbed] });
        logger.debug(`Log dibuat untuk ticket #${ticketData.ticketNumber}`);
        
    } catch (error) {
        logger.error('Error membuat log: ' + error.message);
    }
}

async function setupBot(message) {
    try {
        let adminRole = message.guild.roles.cache.find(r => r.name === config.adminRole);
        if (!adminRole) {
            adminRole = await message.guild.roles.create({
                name: config.adminRole,
                color: 0x8600c3,
                reason: 'Role admin rekber'
            });
            logger.info(`Role ${config.adminRole} dibuat`);
        }
        
        await message.member.roles.add(adminRole);
        
        let category = message.guild.channels.cache.find(
            c => c.name.toUpperCase() === config.ticketCategory.toUpperCase() && c.type === ChannelType.GuildCategory
        );
        
        if (!category) {
            category = await message.guild.channels.create({
                name: config.ticketCategory,
                type: ChannelType.GuildCategory,
                reason: 'Kategori ticket'
            });
            logger.info(`Kategori ${config.ticketCategory} dibuat`);
        }
        
        let logChannel = message.guild.channels.cache.find(
            c => c.name === config.logChannel && c.type === ChannelType.GuildText
        );
        
        if (!logChannel) {
            logChannel = await message.guild.channels.create({
                name: config.logChannel,
                type: ChannelType.GuildText,
                reason: 'Log ticket'
            });
            logger.info(`Channel log ${config.logChannel} dibuat`);
        }

        // Setup payment channel
        let paymentChannel = message.guild.channels.cache.find(
            c => c.name === config.paymentChannel && c.type === ChannelType.GuildText
        );
        
        if (!paymentChannel) {
            paymentChannel = await message.guild.channels.create({
                name: config.paymentChannel,
                type: ChannelType.GuildText,
                reason: 'Channel informasi pembayaran',
                topic: 'Informasi metode pembayaran - ketik !payment untuk melihat'
            });
            logger.payment(`Channel ${config.paymentChannel} dibuat`);
        }
        
        const embed = createEmbed(
            '✅ SETUP SELESAI',
            `**Role Admin:** ${adminRole}\n` +
            `**Kategori Ticket:** ${category}\n` +
            `**Channel Log:** ${logChannel}\n` +
            `**Channel Payment:** ${paymentChannel}\n` +
            `**Prefix Role:** ${config.rolePrefix}\n` +
            `**Payment Image:** [Lihat Gambar](${config.paymentImageUrl})\n` +
            `**Counter Saat Ini:** ${ticketCounter}\n\n` +
            `**Fitur Payment:**\n` +
            `• \`!payment\` - Lihat info pembayaran\n` +
            `• \`!setpayment [url]\` - Update gambar (admin)\n\n` +
            `**Bot siap digunakan!**`,
            0x8600c3
        );
        
        await message.reply({ embeds: [embed] });
        logger.success(`Setup selesai oleh ${message.author.tag}`);
        
    } catch (error) {
        logger.error('Error setup: ' + error.message);
        await message.reply({
            content: `❌ Gagal setup: ${error.message}`
        });
    }
}

function formatCurrency(amount) {
    try {
        const num = parseInt(amount.replace(/\D/g, ''));
        if (isNaN(num)) return amount;
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } catch {
        return amount;
    }
}

// ========== KEEP ALIVE ==========
setInterval(() => {
    if (client && client.isReady()) {
        logger.debug('Bot heartbeat - masih hidup');
    } else {
        logger.warn('Bot tidak terhubung, mencoba login ulang...');
        client.login(config.token).catch(err => {
            logger.error('Gagal login ulang: ' + err.message);
        });
    }
}, 60000);

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGINT', () => {
    console.log('\n📥 Menerima sinyal interrupt, menyimpan data...');
    saveTickets();
    console.log('✅ Data tersimpan, bot dimatikan');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n📥 Menerima sinyal terminate, menyimpan data...');
    saveTickets();
    console.log('✅ Data tersimpan, bot dimatikan');
    process.exit(0);
});

// ========== START BOT ==========
console.log('\x1b[36m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
console.log('\x1b[36m%s\x1b[0m', '║               BOT REKBER - STARTING...                    ║');
console.log('\x1b[36m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
console.log('');

if (!config.token) {
    console.error('\x1b[41m%s\x1b[0m', '❌ Token tidak ditemukan di .env!');
    console.log('\n📝 Cara setup:');
    console.log('1. Buat file .env di folder yang sama dengan index.js');
    console.log('2. Isi dengan konfigurasi berikut:');
    console.log('\x1b[33m%s\x1b[0m', 'DISCORD_TOKEN=token_bot_anda_disini');
    console.log('\x1b[33m%s\x1b[0m', 'PREFIX=!');
    console.log('\x1b[33m%s\x1b[0m', 'TICKET_CATEGORY=TICKETS');
    console.log('\x1b[33m%s\x1b[0m', 'ADMIN_ROLE=Admin');
    console.log('\x1b[33m%s\x1b[0m', 'LOG_CHANNEL=ticket-log');
    console.log('\x1b[33m%s\x1b[0m', 'PAYMENT_IMAGE_URL=https://i.imgur.com/your-image.jpg');
    console.log('\x1b[33m%s\x1b[0m', 'PAYMENT_CHANNEL=payment-info');
    console.log('\n⏳ Bot akan mencoba login setiap 30 detik...');
    
    setInterval(() => {
        console.log('🔄 Mencoba login ulang...');
        require('dotenv').config();
        if (process.env.DISCORD_TOKEN) {
            config.token = process.env.DISCORD_TOKEN;
            client.login(config.token).catch(() => {});
        }
    }, 30000);
} else {
    loadTickets();
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Konfigurasi terload:');
    console.log('\x1b[90m%s\x1b[0m', `   Token: ${config.token.substring(0, 20)}...`);
    console.log('\x1b[90m%s\x1b[0m', `   Payment Image: ${config.paymentImageUrl}`);
    console.log('');
    
    client.login(config.token)
        .then(() => {
            console.log('\x1b[32m%s\x1b[0m', '✅ Login berhasil, menunggu event ready...');
        })
        .catch(error => {
            console.error('\x1b[41m%s\x1b[0m', '❌ Gagal login: ' + error.message);
            console.log('\n⏳ Mencoba ulang dalam 30 detik...');
            setTimeout(() => {
                console.log('🔄 Mencoba login ulang...');
                client.login(config.token).catch(() => {});
            }, 30000);
        });
}