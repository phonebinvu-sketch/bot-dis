const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Discord Free Fire đang chạy 24/7!'));
app.listen(process.env.PORT || 3000);
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ButtonStyle,
  ButtonBuilder
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// 1. Thông tin cấu hình
const DISCORD_TOKEN = 'MTU1MTUxNzYwMTUwOTkzMzA3Ng.GScyTu.bIAv9RE2Dhz1ehO08g0P2RT-ifhOxiylojeiCY';
const CLIENT_ID = '1551517601509933076';
const SUPABASE_URL = 'https://ihljsolyzvjzsjwrbyuq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CUeTKp5-Yu9qq0N3sGcJhg_3CpArKOe';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 2. Đăng ký Slash Command /hud với Discord API
const commands = [
  new SlashCommandBuilder()
    .setName('hud')
    .setDescription('Mở menu chọn gói HUD Free Fire (2, 3, 4 ngón)')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('⏳ Đang đăng ký lệnh Slash /hud...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Đã đăng ký lệnh /hud thành công!');
  } catch (error) {
    console.error('Lỗi đăng ký lệnh:', error);
  }
}

// 3. Sự kiện khi Bot Online
client.once('ready', () => {
  console.log(`🤖 Bot Discord ${client.user.tag} đã hoạt động!`);
  registerCommands();
});

// 4. Xử lý khi người dùng gõ lệnh /hud hoặc tương tác với Menu
client.on('interactionCreate', async (interaction) => {
  
  // A. Xử lý lệnh /hud
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'hud') {
      
      // Tạo Menu Chọn (Select Menu)
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_hud_type')
        .setPlaceholder('👉 Bấm vào đây để chọn Gói Ngón HUD...')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('⚡ Gói 2 Ngón')
            .setDescription('Các layout 2 ngón kéo tâm nhanh & linh hoạt')
            .setValue('2')
            .setEmoji('✌️'),
          new StringSelectMenuOptionBuilder()
            .setLabel('⚡ Gói 3 Ngón')
            .setDescription('Các layout 3 ngón tối ưu giật keo & đổi súng')
            .setValue('3')
            .setEmoji('🤟'),
          new StringSelectMenuOptionBuilder()
            .setLabel('⚡ Gói 4 Ngón')
            .setDescription('Các layout 4 ngón Claw Pro tốc độ cao')
            .setValue('4')
            .setEmoji('🖐️')
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setTitle('🔥 HUD FREE FIRE SHARING HUB')
        .setColor('#EAB308')
        .setDescription('Vui lòng chọn danh mục gói **2 Ngón**, **3 Ngón** hoặc **4 Ngón** ở danh sách bên dưới để xem mã HUD chi tiết:')
        .setThumbnail('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80')
        .setFooter({ text: 'Website: ffsitehud.vercel.app' });

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    }
  }

  // B. Xử lý khi người dùng chọn tab trong Menu
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_hud_type') {
      const selectedFingers = parseInt(interaction.values[0]);

      // Hoãn phản hồi để lấy dữ liệu từ Supabase
      await interaction.deferReply({ ephemeral: true });

      // Lấy danh sách HUD từ Supabase theo số ngón đã chọn
      const { data: huds, error } = await supabase
        .from('huds')
        .select('*')
        .eq('fingers', selectedFingers)
        .order('id', { ascending: true });

      if (error || !huds || huds.length === 0) {
        return interaction.editReply({ content: '❌ Không tìm thấy dữ liệu HUD cho lựa chọn này!' });
      }

      // Tạo các thẻ Embed danh sách HUD
      const embeds = huds.map(hud => {
        return new EmbedBuilder()
          .setTitle(`🔥 ${hud.title}`)
          .setColor(selectedFingers === 2 ? '#10B981' : selectedFingers === 3 ? '#3B82F6' : '#EF4444')
          .setDescription(`${hud.description || hud.desc}\n\n💡 **Chỉnh nhanh:** ${hud.tip}`)
          .addFields(
            { name: '🎮 Trò chơi', value: hud.game || 'Free Fire', inline: true },
            { name: '🖐️ Phân loại', value: `${hud.fingers} Ngón`, inline: true },
            { name: '🔑 Mã HUD Code', value: `\`\`\`${hud.hud_code}\`\`\`` }
          )
          .setThumbnail(hud.image_url)
          .setFooter({ text: 'Sao chép mã dán trực tiếp vào game Free Fire' });
      });

      const webButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🌐 Xem giao diện Web')
          .setStyle(ButtonStyle.Link)
          .setURL('https://ffsitehud.vercel.app')
      );

      await interaction.editReply({ 
        content: `✅ Dưới đây là danh sách **Gói ${selectedFingers} Ngón** được lấy từ Database:`, 
        embeds: embeds.slice(0, 10), // Giới hạn tối đa 10 thẻ trong 1 tin nhắn
        components: [webButton] 
      });
    }
  }
});

client.login(DISCORD_TOKEN);
