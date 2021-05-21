# Chat Leaderboard
### A leaderboard to show off your most active chatters! 💝

![Preview of the Chat Leaderboard with the Melon Theme](https://preview.redd.it/jcsula4bg1071.png?width=401&format=png&auto=webp&s=02c48fa1437dccf14bdc4246b94b02a6bd24029f)

## How does it work?
Similar to Discord bot leveling, the Chat Leaderboard widget awards XP to any user in chat who sends a message. Users can level up after earning enough XP, and users with the highest levels of XP are showcased on the leaderboard!

> **Note:** This is a per-stream leaderboard. It does not save any of the data, so it **resets every stream**. However, this works out great, because any new chatters will have a chance of making it on the leaderboard!

## Overlay Link
[Click here to get it!](https://strms.net/chat_leaderboard_by_zaytri)

It will automatically create a new overlay for you to use! You can add this as a browser source to any streaming software, check the FAQ down below for a tutorial!

## Tutorial

I have made an [in-depth YouTube tutorial](https://youtu.be/dz9_clq6Hjg) that goes over all of the various features and customizations!

## Features
### Appearance Customization 🎨
- You have complete control over all of the styling! You can even change the word "Level" to whatever you want, including other languages, or removing the word entirely! This is configurable from the **General Styles** and all of the **Style** settings!

- There's even a **theme import/export system**, and I've made several [pre-built themes](themes) that you can build off of!

- You can also set how many users can show up on the leaderboard from the **Basic** Settings!

- And of course, you could always put in some custom CSS as well!

### Level Scaling 📈
- You can set how much XP users gain from each message, how much XP it takes to level up, and how much more XP is needed to level up in subsequent levels! This is all configurable from the **Leveling** settings!

### Emote Avatars 🥰
- The image for each user on the leaderboard will change depending on the last emote they used! This includes emotes from Twitch, BTTV, FFZ, and even emojis inputted through the Twitch chat emoji selector! You can set a default image that will be there until they use an emote, or remove showing any image entirely, up to you! You can configure this from the **General Styles** settings!

### Anti-Spam 🛡️
- There are 2 ways to prevent users from just spamming for XP, configurable from the **Leveling** settings.

  - You can set max messages per minute, so that users can only gain XP from X messages per minute.

  - You can also set a character minimum, so that users must send messages above a specific character count to gain XP. For this, **emotes count as 1 character each**, rather than the character count of the full emote name.

### Bot Ignore 🤖
- By default, any bot command is ignored (any message that starts with !). You can disable this if you want. You can also add your bots to an ignore list so that your bots never take up leaderboard slots. These are both configurable from the **Leveling** settings!

### Commands ❗
- There are 2 commands you can configure. One is **!deleterank** from the **Basic** settings, and the other is **!rank** from the **Advanced** settings.

  - **!deleterank** can be used to remove users from the leaderboard. This can only be used by you or your mods. For example, if you banned someone but notice that they're on the leaderboard, use `!deleterank theirusername` to yeet them out!

  - **!rank** can be used by anyone in chat to check their rank, even if they're not on the leaderboard! This uses the StreamElements bot to respond in chat, so it requires extra set up, hence why it is in **Advanced**. To use it, you will need to enable the advanced settings and then grab an [API Token with the botMsg scope](https://jebaited.net/). You can set a per-user cooldown for this command, so that users can't just spam it.

## Frequently Asked Questions
### How do I add this to OBS / Streamlabs OBS / XSplit / etc?
- Any streaming software that can add a browser source can use this.
- For OBS and Streamlabs OBS, [I made a quick tutorial](https://vm.tiktok.com/ZMethBcak/).

### How can I have it displayed in a line (horizontally)?
- With 2 lines of custom CSS! [Here is a quick tutorial](https://vm.tiktok.com/ZMethMmw7/).

### The leaderboard resets when I change scenes!
- In the browser source settings of OBS / Streamlabs OBS, make sure that both "**Shutdown source when not visible**" and "**Refresh browser when scene becomes active**" are both **disabled**.

### I get double messages when using the !rank command!
- You probably have it open in both OBS and the overlay editor, so it's running in both.

Hope you all enjoy it! 💖


