import Command from './modules/command'

import play from './commands/play-command'
import skip from './commands/skip-command'
import queue from './commands/queue-command'

import pause from './commands/pause-command'
import resume from './commands/resume-command'

const commands: {
    [name: string]: Command
} = { play, skip, queue, pause, resume };

export default commands;