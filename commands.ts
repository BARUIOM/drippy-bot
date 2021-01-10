import Command from './modules/command'

import help from './commands/help-command'

import play from './commands/play-command'
import stop from './commands/stop-command'
import skip from './commands/skip-command'
import queue from './commands/queue-command'

import pause from './commands/pause-command'
import resume from './commands/resume-command'

const commands: {
    [name: string]: Command
} = { help, play, stop, skip, queue, pause, resume };

export default commands;