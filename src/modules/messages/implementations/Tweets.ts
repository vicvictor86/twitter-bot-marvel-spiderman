import { calculateDaysToRelease, calculateHoursToRelease, formatDateToISO } from '../../dates/implementations/CalculateDates';
import { TwitterApiv2 } from 'twitter-api-v2';
import getGuest from './SpecialGuests';

function messageToMention(releaseDay: Date, timezone: string, specialMessage?: string): string {
    const daysToRelease = calculateDaysToRelease(releaseDay, timezone);

    if (!specialMessage) {
        specialMessage = "";
    }

    if (daysToRelease === 0) {
        const hoursToRelease = calculateHoursToRelease(releaseDay, timezone);
        if (hoursToRelease <= 0) {
            return specialMessage + `LANÇOU, FINALMENTE MARVELS'S SPIDER-MAN REMASTERED LANÇOU AAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
        }

        return specialMessage + `HOJE, DAQUI A ${hoursToRelease} HORAS LANÇA MARVELS'S SPIDER-MAN REMASTERED MEU DEUS QUE FELICIDADE!! VAMO COMEMORAR!!`;
    }

    if (daysToRelease < 0) {
        const daysAfterRelease = Math.abs(daysToRelease);
        return specialMessage + `Fazem ${daysAfterRelease} dias que Marvel's Spider-Man Remastered foi lançado!`;
    }

    return specialMessage + `Faltam ${daysToRelease} dias para o lançamento de Marvel's Spider-Man Remastered!`
}

async function tweet(releaseDay: Date, timezone: string, clientV2: TwitterApiv2): Promise<void> {
    const dayInMinutes = 1440;
    const daysToRelease = calculateDaysToRelease(releaseDay, timezone);

    let options = ['Meu deus que tristeza', 'Meu deus que felicidade'];
    if (daysToRelease <= 0) {
        options = ['MEU DEUS QUE FELICIDADE', 'MEU DEUS QUE FELICIDADE'];
    }

    const { data: createdTweet } = await clientV2.tweet(messageToMention(releaseDay, timezone), {
        poll: { duration_minutes: dayInMinutes, options },
    });

    console.log('Tweet', createdTweet.id, ':', createdTweet.text);
}

async function replyTweets(releaseDay: Date, timezone: string, clientV2: TwitterApiv2): Promise<void> {
    const botInformations = await clientV2.me();
    const botId = botInformations.data.id;
    const start_time = formatDateToISO();
    const tweetsMentionedBot = await clientV2.userMentionTimeline(botId, { expansions: ["in_reply_to_user_id", "referenced_tweets.id.author_id"], max_results: 30, "tweet.fields": "conversation_id", start_time });

    // console.log(tweetsMentionedBot.meta.result_count);

    for await (const tweet of tweetsMentionedBot.tweets) {
        const conversation_id = tweet.conversation_id;
        const mentionBotFirst = tweet.in_reply_to_user_id === botId;

        if (mentionBotFirst && conversation_id) {
            const conversation = await clientV2.get(`tweets/search/recent?query=conversation_id:${conversation_id}&tweet.fields=in_reply_to_user_id,author_id`)
            let botAlreadyReply = false;

            if (conversation.data) {
                for (const conversationTweets of conversation.data) {
                    if (conversationTweets.author_id === botId) {
                        botAlreadyReply = true;
                        break;
                    }
                }
            }

            if (!botAlreadyReply) {
                let message = "";
                if (tweet.author_id) {
                    const guest = getGuest(tweet.author_id);
                    if (guest) {
                        message = guest.message;
                    }
                }

                const tweetId = tweet.id;
                await clientV2.reply(messageToMention(releaseDay, timezone, message), tweetId);
                console.log(`Reply to ${tweetId} with message ${messageToMention(releaseDay, timezone, message)}`);
            }
        }
    }
}

export { messageToMention, replyTweets, tweet };