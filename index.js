const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, PermissionsBitField, ButtonBuilder, 
    ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle,
    REST, Routes 
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});
// Ambil variabel dari .env
const { 
    DISCORD_TOKEN, 
    ADMIN_ROLE_ID, 
    TICKET_CATEGORY_ID, 
    TICKET_LOG_CHANNEL_ID, 
    BANNER_URL, 
    PAYMENT_IMAGE_URL,
    THUMBNAIL_URL 
} = process.env;

const DARK_WHITE = "#807d7d"; 
// Fungsi Font Bold Serif (Tetap ada jika ingin digunakan di tempat lain)
function toBoldSerif(text) {
    if (!text) return "";
    return text.toString().replace(/[A-Za-z0-9]/g, (char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(code + 119743);
        if (code >= 97 && code <= 122) return String.fromCodePoint(code + 119737);
        if (code >= 48 && code <= 57) return String.fromCodePoint(code + 120744);
        return char;
    });
}
// Konfigurasi ID Role (Sesuaikan ID ini)
const ROLES_GAME = {
    roblox: '1486386514660167711',
    ml: '1486387012998135879',
    ff: '1486387597680050366',
    pubg: '1486387820766429317',
    blood_strike: '1486388323286122627',
    tiktok_ig: '1493813258115879042',
    sparing: '1493820202163634327'
};   
// DATABASE PRODUK
const db = {
    "delta_perm": { name: "Delta Lite Permanent", price: 18000 },
    "delta_prem": { name: "Delta Lite Premium", price: 8000 },
    "delta_basic": { name: "Delta Lite Basic", price: 4000 },
    "panel_vvip": { name: "Panel Private VVIP", price: 0 }, 
    "panel_biasa": { name: "Panel Private Biasa", price: 0 },
    "panel_basic": { name: "Panel Basic", price: 0 },
    "reseller_vvip": { name: "Res, Admin, Patner, Own, dan Tngn Kanan Panel Pterodactyl", price: 0 },
    "jasa_suntik_sosmed": { name: "Jasa Suntik All Sosmed", price: 0 },
    "apk_bug_target": { name: "Apk Bug Target", price: 0 },
    "nokos_jxmarket": { name: "Nokos_JX Market", price: 0 },
    "jasa_gig": { name: "Jasa Gig Server ×8 Booster", price: 0 },
    "kode_redfinger": { name: "Kode Redfinger", price: 0 },
    "redfinger_nowar": { name: "Kode Redfinger No War", price: 0 },
    "fish_it": { name: "Stock Fish it Admin", price: 0 },
    "boost_discord": { name: "Server Boost Discord", price: 0 },
    "jasa_desain_full": { name: "Jasa Design Discord ( Pembuatan )", price: 0 },
    "custom_bot": { name: "Jasa Custom Bot Discord", price: 0 },
    "capcut_prem": { name: "Apps Capcut Prem", price: 21000 },
    "canva_pro": { name: "Canva Pro", price: 0 },
    "spotify_premium": { name: "Spotify Premium", price: 0 },
    "netflix_premium": { name: "Netflix Premium", price: 0 },
    "bstation_premium": { name: "Bstation Prem", price: 0 },
    "vidio_premium": { name: "Video.Com Prem", price: 0 }
};

if (!fs.existsSync('./counter.json')) {
    fs.writeFileSync('./counter.json', JSON.stringify({ lastId: 0 }));
}

function getNextOrderId() {
    const data = JSON.parse(fs.readFileSync('./counter.json', 'utf8'));
    data.lastId += 1;
    fs.writeFileSync('./counter.json', JSON.stringify(data));
    return `#JX${String(data.lastId).padStart(4, '0')}`;
}

// Fungsi untuk mengambil nomor urut dan langsung mengupdatenya ke database JSON
function getAndIncrementOrderId() {
    const data = JSON.parse(fs.readFileSync('./counter.json', 'utf8'));
    data.lastId += 1; // Tambah 1 setiap kali dipanggil
    fs.writeFileSync('./counter.json', JSON.stringify(data));
    return String(data.lastId).padStart(4, '0');
}

const commands = [
    {
        name: 'rating',
        description: 'Berikan rating & ulasan kepada penjual',
        options: [
            // Opsi penjual dihapus dari sini
            { name: 'rating', description: 'Pilih bintang (1-5)', type: 3, required: true, 
                choices: [
                    { name: '⭐⭐⭐⭐⭐ (5/5)', value: '5' },
                    { name: '⭐⭐⭐⭐ (4/5)', value: '4' },
                    { name: '⭐⭐⭐ (3/5)', value: '3' },
                    { name: '⭐⭐ (2/5)', value: '2' },
                    { name: '⭐ (1/5)', value: '1' }
                ] 
            },
            { name: 'ulasan', description: 'Tulis ulasan pembeli (Opsional)', type: 3, required: false }
        ]
    }
];

client.once('ready', async () => {
    console.clear();
    console.log('\x1b[36m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
console.log('\x1b[36m%s\x1b[0m', '║                      BOT ORDER V29.0                     ║');
console.log('\x1b[36m%s\x1b[0m', '║               [ JX MARKET PREMIUM HOSTING ]              ║');
console.log('\x1b[36m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
    console.log('');
console.log(`\x1b[36m%s\x1b[0m`, `

               ⠀ ⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀  ⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
               ⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
               ⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
               ⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
               ⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
               ⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
                ⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
               ⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
               ⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
               ⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
               ⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
               ⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
               ⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
               ⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
               ⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
               ⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
               ⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀         ⠀       ⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀               ⠀⠀⠀⠙⠆⠀⠀⠐⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`);
// ========== START BOT ==========
console.log('\x1b[36m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
console.log('\x1b[36m%s\x1b[0m', '║                  BOT ORDER - STARTING...                 ║');
console.log('\x1b[36m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
console.log('');

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('\x1b[32m%s\x1b[0m', '[SYSTEM] Slash Commands Registered');
    } catch (error) {
        console.error('[ERROR]', error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- FITUR UPDATE STOCK ---
    if (message.content.trim().toLowerCase() === '!update') {
    
    // Hapus pesan perintah agar chat bersih
        setTimeout(() => message.delete().catch(() => {}), 1000);
            
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Kamu tidak memiliki izin (Administrator) untuk menggunakan perintah ini!");
        }
        // Embed Utama (Daftar Produk)
        const embedProducts = new EmbedBuilder()
    .setAuthor({ 
        name: 'JX MARKET | STOCK UPDATE', 
        iconURL: THUMBNAIL_URL 
    })
    .setTitle('PRODUCTS JX MARKET <:admin1:1477120114880020582>')
    .setColor(DARK_WHITE)
    .setDescription(
        `<:hijau_jx:1488357558090469466> **APK DELTA LITE** = READY\n` +
        `<:hijau_jx:1488357558090469466> **PANEL PTERODACTYL** = READY\n` +
        `<:hijau_jx:1488357558090469466> **PANEL REVIACTYL** = READY\n` +
        `<:hijau_jx:1488357558090469466> **PANEL RESELLER/CEO** = READY\n` +
        `──────────────────\n` +
        `<:hijau_jx:1488357558090469466> **JASA SUNTIK SOSMED** = READY\n` +
        `<:hijau_jx:1488357558090469466> **NOKOS JX MARKET** = READY\n` +
        `<:hijau_jx:1488357558090469466> **APK BUG TARGET** = READY\n` +
        `──────────────────\n` +
        `<:hijau_jx:1488357558090469466> **JASA GIG SERVER ×8 BOOSTER** = READY\n` +
        `<:hijau_jx:1488357558090469466> **KODE REDFINGER** = READY\n` +
        `<:hijau_jx:1488357558090469466> **KODE REDFINGER NOWAR** = READY\n` +
        `<:hijau_jx:1488357558090469466> **JASA SPLIT RF** = READY\n` +
        `<:hijau_jx:1488357558090469466> **STOCK FISH IT/ ACC ALL GAME** = READY\n` +
        `──────────────────\n` +
        `<:hijau_jx:1488357558090469466> **CUSTOM BOT WA/DC/TELE** = READY \n` +
        `<:hijau_jx:1488357558090469466> **JASA DESAIN DISCORD** = READY\n` +
        `<:hijau_jx:1488357558090469466> **S3RV3R B00ST DC** = READY\n` +
        `──────────────────\n` +
        `<:hijau_jx:1488357558090469466> **CAPCUT PREM** = READY\n` +
        `<:hijau_jx:1488357558090469466> **SPOTIFY PREM** = READY\n` +
        `<:hijau_jx:1488357558090469466> **NETFLIX PREM** = READY\n` +
        `<:hijau_jx:1488357558090469466> **BSATATION PREM** = READY\n` +
        `<:hijau_jx:1488357558090469466> **CANVA PREM** = READY\n` +
        `<:hijau_jx:1488357558090469466> **VIDEO PREM** = READY\n`
    );
    
    const embedFooterInfo = new EmbedBuilder()
    .setColor(DARK_WHITE)
    .setDescription(
        `<:hijau_jx:1488357558090469466> = **STOCK BANYAK**\n` +
        `<:merah_jx:1488358291812778106> = **STOCK HABIS**\n\n` +
        `**ONLY TICKET ORDER :** <#1476912548832874558>\n\n` +
        `**Untuk tanyakan lebih lanjut disini :** <#1480391981397049486>\n\n`
    )
    .setFooter({ 
        text: "JX Market Trusted", 
        iconURL: client.user.displayAvatarURL() 
    })
    .setTimestamp();
    
    await message.channel.send({ 
    content: `🔔 **Update Stock Products ** || @everyone ||`,
    embeds: [embedProducts, embedFooterInfo] 
        });
    }

    if (message.content.trim().toLowerCase() === '!order') {
        // Hapus pesan perintah "!order" dari user agar channel tetap bersih
        setTimeout(() => message.delete().catch(() => {}), 1000);

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !message.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return message.reply("❌ Kamu tidak memiliki izin.").then(msg => {
                setTimeout(() => msg.delete(), 3000);
            });
        }
        // --- FITUR AUTO CLEANUP ---
        const messages = await message.channel.messages.fetch({ limit: 50 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        if (botMessages.size > 0) {
            await message.channel.bulkDelete(botMessages).catch(() => {});
        }

        const options = Object.keys(db).map(key => ({
            label: db[key].name,
            description: db[key].price > 0 
                ? `Harga: Rp ${db[key].price.toLocaleString('id-ID')}` 
                : 'Tanyakan Pada admin',
            value: key
        }));

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'JX MARKET', iconURL: THUMBNAIL_URL })
            .setTitle('🛒 JX MARKET | TRUSTED')
            .setDescription(`Silakan pilih produk yang ingin Anda beli dari menu di bawah.\n\n` +
                            `🛡 **Admin:** <@&${ADMIN_ROLE_ID}>\n` +
                            `📢 **Catatan:** Harap tag admin setelah ticket terbuka!`)
            .setImage(BANNER_URL || null)
            .setThumbnail(THUMBNAIL_URL || null)
            .setColor(DARK_WHITE);

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('open_ticket_select')
                .setPlaceholder('--- Pilih Produk JX Market ---')
                .addOptions(options)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
    // Perbaikan untuk !confirm agar lebih rapi
    if (['!d',].includes(message.content.toLowerCase())) {
        if (!message.channel.name.startsWith('ticket-')) return;
        if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) return;

        await message.delete().catch(() => {});

        const buyerPermission = message.channel.permissionOverwrites.cache.find(p => 
            p.type === 1 && p.id !== message.guild.id && p.id !== ADMIN_ROLE_ID
        );
        const buyerId = buyerPermission ? buyerPermission.id : message.author.id;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`done_${buyerId}_manual`).setLabel('Order Sukses').setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId(`fail_${buyerId}_manual`).setLabel('Order Gagal').setStyle(ButtonStyle.Danger).setEmoji('❌')
        );

        await message.channel.send({ 
            content: `🛡️ **KONFIRMASI TRANSAKSI**\nStatus pesanan untuk <@${buyerId}>:`, 
            components: [row]
        });
    }
    // Perbaikan untuk !role agar lebih rapi
        if (message.content.toLowerCase() === '!setuprole') {
        try {
            // Hapus pesan perintah agar chat bersih
            setTimeout(() => message.delete().catch(() => {}), 1000);

            const thumbnail = process.env.THUMBNAIL_URL || "https://img2.pixhost.to/images/7144/714605677_media.jpg";
            const banner = "https://cdn.discordapp.com/attachments/1486551611873558642/1487296154910593174/7347192ae9916c177229ba972ccf8a68.gif";

            const embedGame = new EmbedBuilder()
                .setAuthor({ name: 'JX MARKET ROLES RESSELER', iconURL: thumbnail })
                .setTitle('<:admin1:1477120114880020582> SELF ROLES RESSELER')
                .setDescription(
                    'Silakan pilih game yang Anda mainkan untuk mendapatkan role khusus Resseler.\n\n' +
                    '**Manfaat Role:**\n' +
                    '* Mendapatkan notifikasi update stok game tersebut.\n' +
                    '* Akses ke channel khusus Resseler game.\n' +
                    '* Menunjukkan identitas Anda di server!'
                )
                .setColor('#807d7d')
                .setThumbnail(thumbnail) 
                .setImage(banner)   
                .setTimestamp()
                .setFooter({ text: "JX Market Auto Role", iconURL: client.user.displayAvatarURL() });

            const rowGame = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_game')
                    .setPlaceholder('Pilih Game Anda di Sini...')
                    .addOptions([
                        { label: 'Roblox', value: 'roblox', emoji: '🧩', description: 'Ambil role khusus Resseler Roblox' },
                        { label: 'Mobile Legends', value: 'ml', emoji: '💎', description: 'Ambil role khusus Resseler MLBB' },
                        { label: 'Free Fire', value: 'ff', emoji: '⚔️', description: 'Ambil role khusus Resseler Free Fire' },
                        { label: 'PUBG Mobile', value: 'pubg', emoji: '🔥', description: 'Ambil role khusus Resseler PUBG' },
                        { label: 'Blood Strike', value: 'blood_strike', emoji: '🎮', description: 'Ambil role khusus Resseler Blood Strike' },
                        { label: 'Tiktok IG & Dll', value: 'tiktok_ig', emoji: '🌐', description: 'Ambil role khusus Resseler Tiktok IG & Dll' },
                        { label: 'Sparing FF & ML', value: 'sparing', emoji: '🎯', description: 'Ambil role khusus pemain Sparing ML & FF' }
                    ])
            );

            await message.channel.send({ 
                embeds: [embedGame], 
                components: [rowGame] 
            });

        } catch (err) {
            console.error("❌ Error Role Setup:", err);
            message.channel.send("Terjadi kesalahan saat menyetel role.");
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    // 1. Handler Slash Command Rating
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'rating') {
            try {
                const skor = interaction.options.getString('rating');
                const ulasan = interaction.options.getString('ulasan') || "Tidak ada ulasan yang diberikan.";

                const stars = "⭐".repeat(parseInt(skor));
                const now = new Date();
                const formattedDate = now.toLocaleDateString('id-ID', { month: '2-digit', day: '2-digit', year: 'numeric' }) + 
                                      " " + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

                const ratingEmbed = new EmbedBuilder()
                    .setColor("#2f3136")
                    .setAuthor({ 
                        name: `JX MARKET | Customer Trusted Feedback`, 
                        iconURL: interaction.guild.iconURL() 
                    })
                    .setThumbnail(THUMBNAIL_URL || "https://files.catbox.moe/3wfgaz.jpg")
                    .setDescription(
                        `「 **Customer Review** 」\n` +
                        `**› Admin**\n<@&${ADMIN_ROLE_ID}>\n\n` + 
                        `**› Pembeli**\n<@${interaction.user.id}>\n\n` +
                        `**› Penilaian**\n${stars} (${skor}/5)\n\n` +
                        `**› Ulasan Pembeli:**\n\`\`\`${ulasan}\`\`\`\n`
                    )
                    .setImage("https://files.catbox.moe/ex4ah2.gif")
                    .setFooter({ 
                        text: `JX MARKET ID • Trusted Feedback • ${formattedDate}`, 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTimestamp();

                return await interaction.reply({ embeds: [ratingEmbed] });
            } catch (err) {
                console.error("Error pada command rating:", err);
            }
        }
    }
        // 2. Logika Ticket Select Menu
    if (interaction.isStringSelectMenu() && interaction.customId === 'open_ticket_select') {
        await interaction.deferReply({ ephemeral: true });
        
        const existingTicket = interaction.guild.channels.cache.find(c => 
            c.parentId === TICKET_CATEGORY_ID && 
            c.name.includes(interaction.user.username.toLowerCase())
        );

        if (existingTicket) {
            return interaction.editReply(`❌ Kamu sudah memiliki tiket yang terbuka: ${existingTicket}`);
        }

        const productKey = interaction.values[0];
        const product = db[productKey];
        const num = getAndIncrementOrderId(); 
        const buyerId = interaction.user.id;
        const priceLabel = product.price > 0 
            ? `Rp. ${product.price.toLocaleString('id-ID')}` 
            : "Tanyakan Pada Admin";
            
        try {
            const channel = await interaction.guild.channels.create({

                name: `ticket-${num}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: buyerId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: ADMIN_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                ]
            });

            const payEmbed = new EmbedBuilder()
                .setTitle('💳 PROSES PEMBAYARAN')
                .setColor(DARK_WHITE) 
                .setDescription(`Halo <@${buyerId}>, silakan lakukan pembayaran.\n\n` +
                    `📦 **Produk:** ${product.name}\n` +
                    `💰 **Total Harga:** ${priceLabel}\n\n` +
                    `**CARA BAYAR:**\n1. Scan **QRIS** di bawah.\n2. Kirim **Bukti Transfer**.\n3. Tunggu admin memproses pesanan Anda.`)
                .setImage(process.env.PAYMENT_IMAGE_URL || null);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`confirm_${buyerId}_${productKey}`).setLabel('Konfirmasi Admin').setStyle(ButtonStyle.Success)
            );

            await channel.send({ content: `Halo <@${buyerId}> | Admin <@&${ADMIN_ROLE_ID}>`, embeds: [payEmbed], components: [row] });
            await interaction.editReply(`✅ Ticket dibuat: ${channel}`);
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Gagal membuat ticket.");
        }
    }
    
    // Pastikan huruf "i" kecil: if
if (interaction.isStringSelectMenu() && interaction.customId === 'select_game') {
    await interaction.deferReply({ ephemeral: true });

    try {
        const roleId = ROLES_GAME[interaction.values[0]];
        
        if (!roleId) {
            return await interaction.editReply({ content: '❌ Konfigurasi Role untuk game ini tidak ditemukan.' });
        }

        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return await interaction.editReply({ content: '❌ Role tidak ditemukan di server ini. Silakan hubungi admin.' });
        }

        const hasRole = interaction.member.roles.cache.has(roleId);

        if (hasRole) {
            await interaction.member.roles.remove(roleId);
            await interaction.editReply({ content: `❎ Role **${role.name}** telah dihapus dari profil Anda.` });
        } else {
            await interaction.member.roles.add(roleId);
            await interaction.editReply({ content: `✅ Role **${role.name}** berhasil ditambahkan!` });
        }
    } catch (error) {
        console.error("Error pada Select Role Game:", error);
        await interaction.editReply({ 
            content: '❌ Gagal mengubah role. Pastikan posisi role bot berada di **atas** role yang ingin diberikan.' 
        });
    }
}
    // 3. Logika Tombol
    if (interaction.isButton()) {
        const parts = interaction.customId.split('_');
        const action = parts[0];
        const buyerId = parts[1];
        const pKey = parts[2];

        if (['confirm', 'done', 'fail'].includes(action)) {
            if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
                return interaction.reply({ content: '❌ Khusus Admin!', ephemeral: true });
            }
        }

        if (action === 'confirm') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`done_${buyerId}_${pKey}`).setLabel('Order Sukses').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`fail_${buyerId}_${pKey}`).setLabel('Order Gagal').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );
            await interaction.reply({ content: `Konfirmasi transaksi untuk <@${buyerId}>:`, components: [row], ephemeral: true });
        }

        if (action === 'done') {
            const product = db[pKey] || { name: "", price: 0 };
            const modal = new ModalBuilder()
                .setCustomId(`modal_done_${buyerId}`)
                .setTitle('Input Data Pesanan Selesai');

            const productNameInput = new TextInputBuilder()
                .setCustomId('modal_product_name')
                .setLabel('NAMA PRODUK')
                .setStyle(TextInputStyle.Short)
                .setValue(product.name || "")
                .setRequired(true);

            const productPriceInput = new TextInputBuilder()
                .setCustomId('modal_product_price')
                .setLabel('HARGA (CONTOH: 10.000)')
                .setStyle(TextInputStyle.Short)
                .setValue(product.price > 0 ? `Rp ${product.price.toLocaleString('id-ID')}` : "")
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(productNameInput);
            const secondRow = new ActionRowBuilder().addComponents(productPriceInput);

            modal.addComponents(firstRow, secondRow);
            await interaction.showModal(modal);
        }
        if (action === 'fail') {
            const buyer = await client.users.fetch(buyerId).catch(() => null);
            const thumb = THUMBNAIL_URL || "https://img2.pixhost.to/images/7144/714605677_media.jpg";
            const banner = BANNER_URL || null;
            
            if (buyer) {
                const dmFailEmbed = new EmbedBuilder()
                    .setTitle('❌ PESANAN DIBATALKAN!!')
                    .setColor("#807d7d")
                    .setThumbnail(thumb)
                    .setImage(banner) // Menampilkan banner saat gagal
                    .setDescription(`Halo <@${buyerId}>,\n\nMohon maaf, pesanan Anda di **JX Market** telah **Dibatalkan/Gagal** oleh admin.\n\n` +
                        `Silakan hubungi admin di server jika menurut Anda ini adalah kesalahan atau Anda ingin Order lagi silahkan buat ticket ulang.\n\n` +
                        `Jika Anda Butuh Bantuan Buat Ticket Disini <#1478775488070684854>`)
                    .setTimestamp()
                    .setFooter({ text: "JX Market Automation" });

                await buyer.send({ embeds: [dmFailEmbed] }).catch(() => {});
            }
            await interaction.reply({ content: `❌ Order Gagal/Dibatalkan. Channel akan dihapus.`, ephemeral: true });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
        // 4. HANDLER MODAL SUBMIT
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_done_')) {
            await interaction.deferReply({ ephemeral: true }); 

            try {
                const buyerId = interaction.customId.split('_')[2];
                const finalProduct = interaction.fields.getTextInputValue('modal_product_name');
                const finalPrice = interaction.fields.getTextInputValue('modal_product_price');

                const orderId = typeof getNextOrderId === 'function' ? getNextOrderId() : "N/A";
                const buyer = await client.users.fetch(buyerId).catch(() => null);
                const logChannel = interaction.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
                const thumb = THUMBNAIL_URL || "https://img2.pixhost.to/images/7144/714605677_media.jpg";
                const banner = (typeof BANNER_URL !== 'undefined') ? BANNER_URL : null;

                const logEmbed = new EmbedBuilder()
                    .setTitle(' ✅ ORDER SUKSES')
                    .setColor("#807d7d")
                    .setThumbnail(thumb)
                    .setDescription(
                        `**› Order ID:** ${orderId}\n` +
                        `**› Produk:** ${finalProduct}\n` +
                        `**› Harga:** Rp ${finalPrice}\n` +
                        `**› Buyer:** <@${buyerId}>\n` +
                        `**› Admin:** ${interaction.user}\n` +
                        `**› Status:** SUCCESS 🟢`
                    )
                    .setTimestamp()
                    .setFooter({ text: "JX Market Trusted" });

                if (logChannel) {
                    await logChannel.send({ content: `🔔 Update Tiket <@${buyerId}>`, embeds: [logEmbed] });
                }

                if (buyer) {
                    const dmSuccessEmbed = new EmbedBuilder()
                        .setTitle('✅ PESANAN TELAH DIKIRIM!')
                        .setColor("#807d7d")
                        .setThumbnail(thumb)
                        .setImage(banner)
                        .setDescription(`Halo <@${buyerId}>,\n\nTerima kasih telah berbelanja di **JX Market**!\n\n` +
                            `* **Order ID:** ${orderId}\n` +
                            `* **Product:** ${finalProduct}\n` +
                            `* **Price:** Rp ${finalPrice}\n\n` +
                            `Mohon berikan Rating Anda <#1476912553203601451> pada di server kami.\n\n` +
                            `Jika Anda Butuh Bantuan Buat Ticket Disini <#1478775488070684854>.\n\n` +
                            `Sampai jumpa di orderan berikutnya 🩶\n`
                            )
                        .setTimestamp()
                        .setFooter({ text: "JX Market Trusted" });
                    
                    await buyer.send({ embeds: [dmSuccessEmbed] }).catch(() => console.log(`DM gagal ke ${buyerId}`));
                }

                await interaction.editReply({ content: `✅ Berhasil dicatat (${orderId}). Menghapus channel dalam 3 detik...` });
                setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);

            } catch (error) {
                console.error("Error saat submit modal:", error);
                await interaction.editReply({ content: "❌ Terjadi kesalahan internal." });
            }
        }
    }   
});

client.login(DISCORD_TOKEN);