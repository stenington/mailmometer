     ,-.
     | |- Know what's on fire...
     | |
     | |       __  __       _ _                                _             
     | |      |  \/  | __ _(_) |_ __ ___   ___  _ __ ___   ___| |_  ___ _ __ 
     |#|      | |\/| |/ _` | | | '_ ` _ \ / _ \| '_ ` _ \ / _ \ __|/ _ \ '__|
     |#|      | |  | | (_| | | | | | | | | (_) | | | | | |  __/ |_|  __/ |   
     |#|      |_|  |_|\__,_|_|_|_| |_| |_|\___/|_| |_| |_|\___|\__|\___|_|   
     |#|      
     |#|      
     |#|- and what can wait!
    (###)
     `-'

# Synopsis

`Mailmometer` is an experiment in reorganizing inboxes based on
the little clues we leave ourselves as to what we intend to do with all
the mail we get. 

With `mailmometer`, there are two kinds of mail: mail that's **warming up**,
and mail that's **cooling off**. Mail that's warming up typically has a
deadline, and the longer you let it sit, the more important it becomes to
*do something* about it. Mail that's cooling off has no deadline, and becomes
less and less important to attend to the longer you manage to put it off, until
at some point it becomes useless. 

Here's how this looks in **v0.0.1**:

From your Gmail inbox...

    ++ Older starred emails
     + Newer starred emails
     - Newer unstarred emails
    -- Older unstarred emails (up to 30 days old)
       and unstarred emails over 30 days old don't even show!

# Usage

Basic usage:
    $ ./mailmometer.js    (for interactive username and password prompting)
    $ ./mailmometer.js -u myemail@gmail.com -p mypass  

Further help:
    $ ./mailmometer.js -h 

