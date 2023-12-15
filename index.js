//基礎プログラムのインポート
const express = require("express");
const app = express();
const fs = require("node:fs");
const path = require("node:path");
const app_root = require("app-root-path");

//botのIdとトークンのインポート（コマンドを使う際に必須）
const tokens = process.env.DISCORD_BOT_TOKEN;
const { clientId, token } = require("./config.json");

//discord.jsから使う機能をインポート
const {
  Collection,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  REST,
  Routes,
} = require("discord.js");

//必要なIntentsを取得。これにより該当する情報を取得することが出来る
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

//ボタン作成
var buttonsample = new ButtonBuilder()
  .setStyle(ButtonStyle.Primary)//詳しくはbutton-intro.txtを参照
  .setLabel("thisisbutton")//Discordでの表示名
  .setCustomId(`buttonsample`);//変数と同じ名前にするのを推奨

//コマンドのインポート
//難しいので理解しなくてもOK。コピペすれば動く！いずれは理解しよう。
client.commands = new Collection(); //Collectionのインスタンスを生成　client.commandsのプロパティに代入

const commandsPath = path.join(__dirname, "commands"); //commandsというフォルダのファイルを読み込み
const commands = []; //コマンドを定数にするための配列
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js")); //commandsフォルダの中から.jsで終わるファイルの検索

//コマンドが書かれたjsファイルをjson化←これやらないとその後の動作に支障をきたす
for (const file of commandFiles) {
  //commandFilesから反復処理で一つずつ読み込む
  const command = require(`./commands/${file}`); //commandsフォルダの中の.jsで終わるファイルをインポート
  commands.push(command.data.toJSON()); //json化
}

const rest = new REST({ version: "10" }).setToken(token); //RESTクライアントの初期化。

//コマンド情報の一時保
(async () => {
  try {
    console.log(`${commandFiles}`); //コマンドの一覧
    console.log(
      `${commands.length} 個のアプリケーションコマンドを登録します。`,
    ); //インポート開始ログ

    //コマンドのIdと処理の保存
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(`${data.length} 個のアプリケーションコマンドを登録しました。`); //インポート終了ログ
  } catch (error) {
    //エラー取得
    console.error(error); //エラーを書く
  }
})();

//コマンドをdiscordに適応
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file); //commandsPathとfileを結合filePathを生成
  const command = require(filePath); //生成したfilePathを読み込み
  //jsをjsonにしてないと、この辺でエラーが出ちゃう
  if ("data" in command && "execute" in command) {
    //もしコマンドにdataかつexcuteがあるなら
    client.commands.set(command.data.name, command);
    //コマンドをクライアントにセットする。
  } else {
    //どちらか一方でもない場合
    console.log(`${filePath} に必要な "data" か "execute" がありません。`);
  }
}

try {
  app.get("/", (req, res) => {
    res.send("Bot起動");
  });

  app.listen(3000, () => {});

  client.on("ready", (message) => {
    console.log("起動完了。");
  });
  if (tokens == undefined) {
    console.log("DISCORD_BOT_TOKENが設定されていません。");
    process.exit(0);
  }

  client.login(tokens);
} catch (e) {
  console.log(`エラーが発生しました。\nエラー\n${e}`);
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`${interaction.commandName} が見つかりませんでした。`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "エラーが発生しました。", ephemeral: true });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "deletemaketeam") {
      console.log("ボタンが押されました。");
    }
  }
});
