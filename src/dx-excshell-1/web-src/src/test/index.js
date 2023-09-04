const cohere = require('cohere-ai');
cohere.init('grwsJENUtKIjjUTce3uAKO4bqVfwItTYBgzRtE79')

let main = async () => {
    const response = await cohere.generate(
        {prompt: 'Write me a description for a new hiking adventure in Wollogong targeting mountain bikers'}
      );

    console.log(response.body.generations[0].text)
}

main();