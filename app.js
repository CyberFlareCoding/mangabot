///////////////Discord.js///////////////
const DiscordJS = require('discord.js');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = DiscordJS;
const { TOKEN, PREFIX } = require('./config.json') || process.env;

const client = new Client({
    intents:[
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
    ]
})

const helpEmbed = (guildCount)=> new MessageEmbed()
    .setColor('#0000ff')
    .setTitle("Leave It To Me!")
    //.setURL(`https://mangadex.org`)
    .setAuthor('MangaBot', 'https://mangaplanet.com/wp-content/uploads/2018/09/A06BEF4A-FD84-4452-8A8F-62731FA7046D.jpeg', 'https://mangadex.org/')
    .setDescription(`Use ${PREFIX}help to see this again`)
    .addFields(
        { name: '\u200B', value: '\u200B' },
        { name: 'Server Count:', value: guildCount + " Servers", inline: true },
        { name: 'Command List', value:`${PREFIX}manga - search for manga\n${PREFIX}nhentai - only works in nsfw channels\n${PREFIX}help - see this again`, inline: true },
        { name: 'To-Do List', value:"-allow u to login to mangadex account\n-let you save to reading list after logging in", inline: true },
        { name: 'About MangaBot', value: 'MangaBot uses a variety of api\'s (mangadex-full, mongodb, discord.js, etc) to allow its users to search for and display manga to the rest of a server.\nIts Goal: To show others the greatness of manga!' },
    )
    .setFooter('an unoffical bot made with unoffical api\'s');
///////////////nHentai///////////////
const nhentai = require('nhentai');
const api = new nhentai.API();

///////////////MongoDB///////////////
const { MongoURI } = require("./config.json") || process.env;
const { MongoClient } = require('mongodb');
const MDBclient = new MongoClient(MongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let guildSettings;

///////////////MangaDex///////////////
const MFA = require('mangadex-full-api');

async function getChapters(id){
    vols = await MFA.Manga.get(id, true).then(async m=> await m.getAggregate(['en']))
    let chList = []
    chapters = Object.entries(vols).forEach(v=>{
        Object.entries(v[1].chapters).forEach(ch=>chList.push({"ch":ch[1].chapter, "id":ch[1].id}))
    })
    return chList
}

MDAccount = ["BotTest", "Meep1234!"]
MDAccount2 = ["BotTest2", "Meep1234!"]

// additional imports
const CommandType = DiscordJS.Constants.ApplicationCommandOptionTypes
let guildCount = 0;

SearchManga = async (command, index, mangaCache) => {
    try{
        const query = command.slice(1);
        switch(command[0].toLowerCase()){
            case "manga": 
                //account = guildSettings.find({_id:message.guildId}).toArray().then(arr=>{return arr[0].account;})
                
                
                index = index || 0;
                (index<0)?index=0:index=index;
                if(!mangaCache){
                mangaArr = (query.join("")!=="")?await MFA.Manga.search({title:query.join(" "),order:{relevance:"desc",title:"asc"}}, true): [await MFA.Manga.getRandom(true)];
                }else{
                mangaArr = mangaCache
                }
                let length = await mangaArr.length
                
                manga = (length>1)?mangaArr[index]:mangaArr[0];
                let MangaEmbed;
                if(manga){
                    const cover = (await MFA.Cover.get(manga.mainCover.id)).imageSource
                    const mangaTags = (manga.tags.length!=0)?manga.tags.map(tag=>tag.localizedName.en).join(", "): "No Tags Set";
                    const description = (manga?.description)?manga.description.substring(0,250)+"...":((manga?.localizedDescription.en)?manga?.localizedDescription.en.substring(0,250)+"...":"No Description");
                    const chapters = await getChapters(manga.id)
                    const authorList = await MFA.Author.getMultiple(manga.authors.map(({ id })=>id)).then(a=>a.map(({ name })=>name)).then(a=> (a.length != 0)?a.join(", ") + "": "failed to retrive");
                    const latestChapter = chapters[chapters.length-1]?.ch || "N/A";
                    
                    //console.log("mangaTags: "+mangaTags," latest ch: "+latestChapter, " status: "+manga?.status," authors: "+authorList," chs: "+chapters?.length.toString())
                    MangaEmbed = new MessageEmbed()
                        .setColor('#007700')
                        .setTitle(manga?.title || manga.localizedTitle.en)
                        .setURL('https://mangadex.org/title/'+manga.id)
                        .setAuthor('MangaDex.org', 'https://mangaplanet.com/wp-content/uploads/2018/09/A06BEF4A-FD84-4452-8A8F-62731FA7046D.jpeg', 'https://mangadex.org/')
                        .setDescription(description)
                        .setThumbnail(cover)
                        .addFields(
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Tags', value: mangaTags, inline: true },
                            { name: 'Author(s)', value: authorList, inline: true },
                            { name: 'Status', value: manga?.status || "N/A" , inline: true },
                            { name: 'Latest EN Chapter', value: latestChapter, inline: true },
                            { name: 'Uploaded EN Chapters', value: chapters?.length.toString() , inline: true }
                        )
                        .setImage(cover)
                        .setFooter(`result ${index+1}/${length}`+' - an unoffical bot made with unoffical api\'s');
                        
                    if(chapters[0]?.id){
                        firstUrl = 'https://mangadex.org/chapter/'+chapters[0].id,
                        lastUrl = 'https://mangadex.org/chapter/'+chapters[chapters.length-1].id;
                    }else{
                        firstUrl = 'https://mangadex.org/title/'+manga.id;
                        lastUrl = 'https://mangadex.org/title/'+manga.id;
                    }

                    components = (length>1)?[
                        new MessageButton()
                            .setCustomId('back:'+(index-1)+":manga "+query.join(" "))
                            .setLabel('<')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setURL(firstUrl)
                            .setLabel('Read First Chapter')
                            .setStyle('LINK'),
                        new MessageButton()
                            .setURL(lastUrl)
                            .setLabel('Read Last Chapter')
                            .setStyle('LINK'),
                        new MessageButton()
                            .setCustomId('next:'+(index+1)+":manga "+query.join(" "))
                            .setLabel('>')
                            .setStyle('SUCCESS')
                    ]:[
                        new MessageButton()
                            .setURL(firstUrl)
                            .setLabel('Read First Chapter')
                            .setStyle('LINK'),
                        new MessageButton()
                            .setURL(lastUrl)
                            .setLabel('Read Last Chapter')
                            .setStyle('LINK'),
                    ];
                    const row = new MessageActionRow()
                        .addComponents(...components);
                    return [{ embeds: [MangaEmbed], components: [row] }, {"length":length,"cachedmanga":mangaArr}]
            }else{
                    MangaEmbed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle("No Manga Found😓")
                        .setURL(`https://mangadex.org/titles?q=${query.join("%20")}`)
                        .setAuthor('MangaDex.org', 'https://mangaplanet.com/wp-content/uploads/2018/09/A06BEF4A-FD84-4452-8A8F-62731FA7046D.jpeg', 'https://mangadex.org/')
                        .setDescription("Your search returned no results...")
                        .setFooter('an unoffical bot made with unoffical api\'s');
                   return [{ embeds: [MangaEmbed] },[]]
                }
            case "nhentai": 
                hentai = await api.search(query.join(" ")).then(d=>d.doujins[0])
                HentaiEmbed = new MessageEmbed()
                        .setColor('#ff7700')
                        .setTitle(hentai.titles.english)
                        .setURL(hentai.url)
                        .setAuthor('nhentai.net')
                        //.setDescription(description)
                        .setThumbnail(hentai.cover.url)
                        .addFields(
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Tags', value: hentai.tags.all.map(({name})=>name).join(", "), inline: true },
                            //{ name: 'Author(s)', value: hentai.scanlator, inline: true },
                            //{ name: 'Status', value: manga?.status || "N/A" , inline: true },
                            //{ name: 'Latest EN Chapter', value: latestChapter, inline: true },
                            //{ name: 'Uploaded EN Chapters', value: chapters?.length.toString() , inline: true }
                        )
                        .setImage(hentai.cover.url)
                        //.setFooter(`result ${index+1}/${length}`+' - an unoffical bot made with unoffical api\'s');
                return [{ embeds: [HentaiEmbed] },[]]
            case "help": 
               return [{ embeds: [helpEmbed(guildCount)] },[]]
            default:
                return [{ embeds: [helpEmbed(guildCount)] },[]]
        }
    }catch(e){
        return SearchManga(command, index, mangaCache)
    }
}

client.on('messageCreate', async (message)=>{
    if(message.author.bot) return;
    if(message.content[0] === PREFIX){
        const command = message.content.substring(1).split(" ");
        if(!message.channel.nsfw && command[0]=="nhentai")return;
        
        results = await SearchManga(command)
        msg = await message.channel.send(results[0]);
        if(results[1].length>1){
            await guildSettings.updateOne({_id:message.guildId}, { $push: { session:{$each:[{"msg":await msg.id, "cachedmanga":results[1].cachedmanga}], $position: 0 } } });
        }

        //unloads assets - only deletes in same channel
        extras = await guildSettings.find({"_id":message.guildId}).toArray().then(arr=>arr[0].session.slice(5))
        if(extras.length>0){
            ex= extras.map(({msg})=>msg);
            CacheEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle("Removed Manga From Cache")
                .setDescription("We remove these to unclog our database.")
                .setFooter('an unoffical bot made with unoffical api\'s');
            ex.forEach(async el=>{
                //await message.channel.messages?.fetch(el).then(m=>m?.edit({embeds: [CacheEmbed]}))
                await guildSettings.updateOne({"_id":message.guildId},{$pull:{"session":{"msg":el}}});
            });
        }
    }   
})

client.on('guildCreate', async guild =>{
    guildCount++;
    if(guild?.systemChannel){ 
        await guild.systemChannel.send({ embeds: [helpEmbed(guildCount)] });
    } else {
        let spareChannel;
        await guild.channels.fetch(false).then(col=>col.map(obj=>{if(obj.type=="GUILD_TEXT" && !obj.deleted) spareChannel = obj}))
        await spareChannel.send({ embeds: [helpEmbed(guildCount)] });
    }
    guildSettings.insertOne({"_id":guild.id,"Name":guild.name,"session":[]});
    console.log(`Guild Added:  (${guild?.name})`)
})

client.on('guildDelete', async g =>{
    guildCount--;
    guildSettings.find({"_id":g.id}).toArray().then(arr=>{
        if(arr.length===0){
            guildSettings.deleteOne({"_id":g?.id,"Name":g?.name});
            console.log(`Guild Removed:  (${g?.name})`)
        }else(console.log(`Guild DNE:      (${g?.name})`))
    })
})

client.on('ready', async ()=>{
    console.log("Bot Online At: "+ client.user.createdAt);
    client.user.setActivity(`you read Manga💖`, { type: 3 })

    MDBclient.connect(async e => {
        guildSettings = MDBclient.db("DiscordBot").collection("GuildSettings");
        client.guilds.cache.forEach(g => {
            guildCount++;
            guildSettings.find({"_id":g.id}).toArray().then(arr=>{
                if(arr.length===0){
                    guildSettings.insertOne({"_id":g.id,"Name":g.name});
                    console.log(`Guild Added:  (${g.name})`)
                    //send !help here
                }else(console.log(`Guild Exists: (${g.name})`))
            })
        });
    });

    client.application.commands?.create({
        name: 'mdlogin',
        description: 'Login to MangaDex! (only you will see this) -global version',
        options: [{
            name: 'username',
            description: "Mangadex Username",
            required: true,
            type: CommandType.STRING
        },
        {
            name: 'password',
            description: "MangaDex Password",
            required: true,
            type: CommandType.STRING
        }
        ]
    })

    client.guilds.cache?.get("887331957783019560").commands.create({
        name: 'mdlogin',
        description: 'Login to MangaDex! (only you will see this) -guild version',
        options: [{
            name: 'username',
            description: "Mangadex Username",
            required: true,
            type: CommandType.STRING
        },
        {
            name: 'password',
            description: "MangaDex Password",
            required: true,
            type: CommandType.STRING
        }
        ]
    })
    
});

client.on('interactionCreate', async (interaction)=>{
    if(interaction.isButton){
        guildInfo = await guildSettings.find({"_id":interaction.guildId}).toArray()
        session = await guildInfo[0].session.map(({msg})=>msg)

        
        index = session.indexOf(interaction.message.id)
        
        if(index !==-1){
            session = await guildSettings.find({"_id":interaction.guildId,"session":{$elemMatch:{"msg" : interaction.message.id}}}).toArray();
            let sesmanga;
            session[0].session.forEach(s=>{if(s.msg===interaction.message.id) sesmanga = s.cachedmanga })
            let v = interaction.customId.split(':')
            let msg = await SearchManga(v[2].split(" "),parseInt(v[1]),sesmanga)
            await interaction.update(msg[0]).catch(async e=>{await interaction.update({content:"U Broke it..."})})
        }
        
    }

    if(!interaction.isCommand()){
        return
    }

    const { commandName, options } = interaction;

    if(commandName === 'mdlogin'){
        console.log("MD Login: "+options.getString('username')||"",
        options.getString('password')||"")
        interaction.reply({
            content: 'Logging In...',
            ephemeral: true, //only user running can see it
        })
        MFA.login(MDAccount[0], MDAccount[1]).then(async() => {
            guildSettings.updateOne({_id:interaction.guildId}, { $set: { "account": [options.getString('username'),options.getString('password')]} });
            await interaction.editReply('Login Successful');
        }).catch(async (err)=>{await interaction.editReply('Login Failed!'); console.error(err)});
    }
})

client.login(TOKEN);