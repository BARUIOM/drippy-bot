import Command from './modules/command'

import play from './commands/play-command'
import skip from './commands/skip-command'

const commands: {
    [name: string]: Command
} = { play, skip };

export default commands;