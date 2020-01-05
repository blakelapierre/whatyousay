import { h, render } from 'preact-cycle';

const ws = new WebSocket(`ws:\\${location.hostname}:7331`);

const commonWords = {
  'the': true, 
  'i': true, 
  'to': true, 
  'they': true,
  'this': true, 
  'and': true, 
  'of': true, 
  'a': true, 
  'in': true,
  'is': true,
  'our': true,
  'on': true,
  'or': true,
  'all': true,
  'my': true,
  'we': true,
  'it': true,
  'has': true,
  'that': true,
  'from': true,
  'was': true,
  'are': true,
  'will': true,
  'have': true, 
  'be': true,
  'by': true,
  'as': true, 
  'at': true, 
  'for': true,
  ' ': true,
  '&': true
 };

const nSkipWordPairCounts = {0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
const wordCounts = {};
const tweetCounts = {};
const tweets = [];
let NOTIFY_TWEETS, NOTIFY_NEW_TWEET;

const textDecoder = document.createElement('span');

ws.addEventListener('message', event => {
  console.log('message', event);

  const data = JSON.parse(event.data),
        [type, msg] = data;

  if (type === 'tweets' && NOTIFY_TWEETS) NOTIFY_TWEETS(msg);
  else if (type === 'tweet' && NOTIFY_NEW_TWEET) NOTIFY_NEW_TWEET(msg);
});

function logWords (text) {
  textDecoder.innerHTML = text;
  const words = textDecoder.innerText.split(' '); // may be other kinds of words, should maybe check for

  words.forEach(word => (wordCounts[word] = (wordCounts[word] || 0) + 1));

  for (let i = 0; i <= 5; i++) logNSkipWordPairs(words, i);
}

function logNSkipWordPairs (words, n) {
  for (let i = 0; i < words.length; i += 2 + n) {
    const first = nSkipWordPairCounts[n][words[i]] = nSkipWordPairCounts[n][words[i]] || {};
    const second = first[words[i+n+1]] = (first[words[i+n+1]] || 0) + 1;
  }
}

const INIT = (_, mutation) => {
  _.inited = true;
  _.mutation = mutation;

  _.tweets = tweets;
  _.wordCounts = wordCounts;
  _.tweetCounts = tweetCounts;
  _.nSkipWordPairCounts = nSkipWordPairCounts;

  _.orderedWordCounts = [];

  NOTIFY_TWEETS = tweets => {
    mutation(() => {
      _.tweets = tweets;

      tweets.forEach(tweet => logWords(tweet.text));

      orderWordCounts();

      return _;
    })();
  };

  NOTIFY_NEW_TWEET = tweet => {
    mutation(() => {
      _.tweets.push(tweet);
      logWords(tweet.text);
      
      orderWordCounts();
      return _;
    })();
  };

  function orderWordCounts() {
    _.orderedWordCounts = Object.keys(_.wordCounts).filter(word => !commonWords[word.toLowerCase()]).map(word => ({word, count: _.wordCounts[word]})).sort((a, b) => a.count > b.count ? -1 : 1);
  }

  return _;
};

const INIT_GUI = ({}, {inited, mutation}) => inited ? <GUI /> : mutation(INIT)(mutation); 
 

const GUI = ({}) => (
  <gui> 
    <WordCounts />
    <tweet-container>
      <Tweets />
    </tweet-container>
  </gui>
);

const WordCounts = ({}, {orderedWordCounts}) => (
  <word-counts>
    <table>
      {orderedWordCounts.map(({word, count}) => <word-count><count>{count}</count><word>{word}</word></word-count>)}
    </table>
  </word-counts>
);

const Tweets = ({}, {tweets}) => (
  <tweets style={`height: ${tweets.length === 0 ? 0 : ((new Date().getTime() - tweets[0].logTime) / 5000)}px;`}>
    {tweets.map(t => <Tweet tweet={t} />).reverse()}
  </tweets>
);

const Tweet = ({tweet: {author, text, logTime}}) => (
  <tweet style={`top: ${(new Date().getTime() - logTime)/5000}px;`}>
    <text>{text}</text>
    <author>{author}</author>
  </tweet>
);

render(
  INIT_GUI, {}, document.body
);