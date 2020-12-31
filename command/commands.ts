import Command from './command'

const play = new Command('play', async (client, message, args) => {

});

const commands: {
    [name: string]: Command
} = { play };

export default commands