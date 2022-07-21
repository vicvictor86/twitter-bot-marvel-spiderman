import 'dotenv/config';
import { TwitterApi, TwitterApiv2 } from 'twitter-api-v2';
import { differenceInDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

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
    const releaseDay = new Date(2022, 7, 12);
    const daysToRelease = differenceInDays(releaseDay, new Date());
    
    const dayInMinutes = 1440;
    const { data: createdTweet } = await clientV2.tweet(`Faltam ${daysToRelease} dias para o lançamento de Marvel's Spider-Man Remastered!`, {
        poll: { duration_minutes: dayInMinutes, options: ['Meu deus que tristeza', 'Meu deus que felicidade'] },
    });

    console.log('Tweet', createdTweet.id, ':', createdTweet.text);
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

setTimeout(() => {
    tweet();
    setInterval(tweet, oneDayInMili);
}, millisToNoon);