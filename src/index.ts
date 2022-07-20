import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';

function userLogin() {
    const userClient = new TwitterApi({
        appKey: process.env.API_KEY || '',
        appSecret: process.env.API_KEY_SECRET || '',
        accessToken: process.env.ACESS_TOKEN || '',
        accessSecret: process.env.ACESS_TOKEN_SECRET || '',
    });

    return userClient.v2;
}

async function tweet() {
    const { data: createdTweet } = await clientV2.tweet('Hello World3', {
        poll: { duration_minutes: 120, options: ['Absolutely', 'For sure!'] },
    });
    console.log('Tweet', createdTweet.id, ':', createdTweet.text);
}

const clientV2 = userLogin();
const now = new Date();
setTimeout(tweet, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 25, 0, 0).getTime() - Date.now());
setInterval(tweet, 10000);