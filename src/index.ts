import 'dotenv/config';
import { TwitterApi, TwitterApiv2 } from 'twitter-api-v2';
import { differenceInDays, formatISO, sub } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import getGuest from './SpecialGuests';

function calculateDaysToRelease(): number {
    const releaseDay = new Date(2022, 7, 12, 12);
	const now = new Date()
	const dateInUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const daysToRelease = differenceInDays(releaseDay, dateInUTC);

    return daysToRelease;
}

function messageToMention(message?: string): string {
    const daysToRelease = calculateDaysToRelease();
	if(!message){
		message = "";
	}
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

async function replyTweets(): Promise<void> {
    const botInformations = await clientV2.me();
    const botId = botInformations.data.id;
    const start_time = formatISO(sub(new Date(), {minutes: 2}));
    const tweetsMentionedBot = await clientV2.userMentionTimeline(botId, {expansions: ["in_reply_to_user_id", "referenced_tweets.id.author_id"], max_results: 30, "tweet.fields": "conversation_id", start_time});
    console.log(tweetsMentionedBot.meta.result_count);
    for await (const tweet of tweetsMentionedBot.tweets) {
        const conversation_id = tweet.conversation_id;
        const mentionBotFirst = tweet.in_reply_to_user_id === botId;
        if(mentionBotFirst && conversation_id) {
            const conversation = await clientV2.get(`tweets/search/recent?query=conversation_id:${conversation_id}&tweet.fields=in_reply_to_user_id,author_id`)
            let botAlreadyReply = false;
            
            if(conversation.data){
                for(const conversationTweets of conversation.data){
                    if(conversationTweets.author_id === botId){
                        botAlreadyReply = true;
                        break;
                    }
                }
            }
            
            if(!botAlreadyReply){
                let message = "";
                if(tweet.author_id){
                    const guest = getGuest(tweet.author_id);
                    if(guest){
                        message = guest.message;
                    }
                }

                const tweetId = tweet.id;
                await clientV2.reply(messageToMention(message), tweetId);
                console.log(`Reply to ${tweetId} with message ${messageToMention(message)}`);
            }
            // else{
            //     console.log('Bot already reply this tweet');
            // }
            
        }
    } 
}

const clientV2 = userLogin();
const now = new Date();
const nowInUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
const timeZone = 'America/Sao_Paulo';

const dateToPostInUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 0, 0, 0);
const dateToPostInBrazilTimezone = utcToZonedTime(dateToPostInUTC, timeZone);

let millisToNoon = dateToPostInBrazilTimezone.getTime() - utcToZonedTime(nowInUTC, timeZone).getTime();
const oneDayInMili = 86400000;

if (millisToNoon < 0) {
    millisToNoon += oneDayInMili;
}

try {
    const halfMinuteInMili = 30000;
    setInterval(replyTweets, halfMinuteInMili);
} catch(err){
    console.log(err)
}

try {
    setTimeout(() => {
        tweet();
        setInterval(tweet, oneDayInMili);
    }, millisToNoon);
} catch(err){
    console.log(err)
}
