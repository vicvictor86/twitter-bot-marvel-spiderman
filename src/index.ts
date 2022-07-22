import 'dotenv/config';
import { TwitterApi, TwitterApiv2 } from 'twitter-api-v2';
import { differenceInDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import getGuest from './SpecialGuests';

function calculateDaysToRelease(): number {
    const releaseDay = new Date(2022, 7, 12);
    const daysToRelease = differenceInDays(releaseDay, new Date());

    return daysToRelease;
}

function messageToMention(message?: string): string {
    const daysToRelease = calculateDaysToRelease();
    return message + `Faltam ${daysToRelease} dias para o lançamento de Marvel's Spider-Man Remastered!`
}

function userLogin(): TwitterApiv2 {
    const userClient = new TwitterApi({
        appKey: process.env.API_KEY || '',
        appSecret: process.env.API_KEY_SECRET || '',
        accessToken: process.env.ACESS_TOKEN || '',
        accessSecret: process.env.ACESS_TOKEN_SECRET || '',
    });
    
    return userClient.v2;
}

async function tweet(): Promise<void> {
    const dayInMinutes = 1440;
    const { data: createdTweet } = await clientV2.tweet(messageToMention(), {
        poll: { duration_minutes: dayInMinutes, options: ['Meu deus que tristeza', 'Meu deus que felicidade'] },
    });

    console.log('Tweet', createdTweet.id, ':', createdTweet.text);
}

async function replyTweet(): Promise<void> {
    const botInformations = await clientV2.me();
    const botId = botInformations.data.id;
    const tweetsMentionedBot = await clientV2.userMentionTimeline(botId, {expansions: "referenced_tweets.id.author_id"});

    for await (const tweet of tweetsMentionedBot.tweets) {
        if(tweet.text.match('^@QuantosPara [^@]')){
            let message = "";
            if(tweet.author_id){
                const guest = getGuest(tweet.author_id);
                if(guest){
                    message = guest.message;
                }
            }

            const tweetId = tweet.id;
            await clientV2.reply(messageToMention(message), tweetId);
            console.log(`Reply to ${tweetId} with message ${message}`);
        }
    } 
}

const clientV2 = userLogin();
const now = new Date();
const timeZone = 'America/Sao_Paulo';

const dateToPostInUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 0, 0, 0);
const dateToPostInBrazilTimezone = utcToZonedTime(dateToPostInUTC, timeZone);

let millisToNoon = dateToPostInBrazilTimezone.getTime() - utcToZonedTime(now, timeZone).getTime();
const oneDayInMili = 86400000;

if (millisToNoon < 0) {
    millisToNoon += oneDayInMili;
}

replyTweet();

// setTimeout(() => {
//     tweet();
//     setInterval(tweet, oneDayInMili);
// }, millisToNoon);