import Command from './modules/command'

import play from './commands/play-command'
import skip from './commands/skip-command'
import queue from './commands/queue-command'

const commands: {
    [name: string]: Command
} = { play, skip, queue };

export default commands;