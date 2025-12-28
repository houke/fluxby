1 developer, 2.5 weeks, 4 LLM models, ~375 prompts, 0 lines of code, 30$ total costs.

This post will be the only human written piece of content on this whole project. Everything else you see came to be with prompting from visuals, content, docs, code.

I am a frontend developer and love to code. However, during this year AI has been taking a critical part in the development that I am doing and my interest started shifting towards leveraging it. When I got access to Claude Opus4.5 at the beginning of December 2025 I was immediately blown away by the output of the model. So far I worked with decent models, but we needed 'instructions' like the [Beast mode](https://github.com/github/awesome-copilot/blob/main/agents/4.1-Beast.agent.md) to make sure the models would work on a proper level. Obviously I am offloading the simple, dull, boring tasks but that is because they're easy. The actual hard task needed my attention most of the time. This changed with Claude Opus for me. With just a couple of well formed prompts it would behave as a very capable developer, able to perform complex tasks in an mind blowing speed.

During my Christmas break i decided to take the modal for a 'extensive spin'. I have a Copilot license so I used VS Code with the build in models. If I wouldn't have the license I would probably opt for Google's Antigravity due to their current pricing promotion.

The idea was simple, I wanted to build a small app that would actually provide helpful for me and my wife, without doing any coding (I am on a break after all). So I would be vibe coding the complete app, I would not care about how the code looked, but would care about the visual state of the interface and it's behaviour. The type of app was very easy, me and my wife wanted to have some structured insights into our spending. How much do we spend on groceries, takeaway, eating out etc. Preferably comparing year on year to see if habits change. So I used Gemini pro 3 (cheaper than Opus) with the plan mode in Vs code to come up with a plan for the app. I created a new folder, added the plan as prompt in the .GitHub/prompts folder and that was it. I handed the prompt to Opus and let it's do it's magic. I quickly had to increase the number of uninterrupted prompts from 15 to 50 and eventually to 100. I enabled all actions in the session and walked away from my computer. When I came back, I had an app in which I could upload my transactions (CSV) could add categories and could see nice graphs. Good enough for what we needed,.a couple of follow up prompts to tweak the output a bit but pretty cool overall.

But then the real fun started, now that I had this small app I could think of so many new things to add, a budget view, an address book, more filtering/ analysing, smarter logic and eventually I thought about making it an actual app with a landing page, help center, developer docs, api docs. So the goal became to make a professional looking app, that actually works, we will use it, without writing any line of code myself.

So here we are, around 600 prompts later. I reachedy 100% premium request limit of vs code (Opus has a x3 multiplier) So to continue this experiment i allowed additional spending up to 30$ and decided to be a bit smarter on when to use what model. Small refactors or content changes would be handed to the free models (normally these would be the changes I would do myself as fixing this would probably be quicker than writing prompts). The bigger changes in existing code would be given to Gemini and the complex changes, or the prompts that Gemini failed to deliver would be given to Opus. The rule still was that I would not write or fix code myself. In fact, I have not even looked at the code at all, I just used the chat view and accepted every change.

So I asked it to come up with a nice category structure with subcategories for a personal finance app, I asked it to implement it in the transactions filter, to make graphs and lists. Then I asked to analyse actual data to see if we could auto apply categories while still.giving control to the user. It came.up with a rule basef.system.where.you.could add keywords, transactions with those names in it would automatically be categorised. I asked it to create seeds and come up with a set of tags for each categories. I uploaded my data and a lot of transactions would automatically get a key.

It suggested to add the type of transaction, it added badges for payment providers and automatically showed repeating transactions.A red line thorug all of this was the inconsistent UI that Claude would add. I would get 3 different types of badges, I would get different buttons and hover styles and even though from a quick look it was all the same, given the fact that I work with design systems a lot, this would definitely not pass our design rules. In hindsight, I could have specified a specific design system in my prompt. I didn't because I wanted to test the UI capablities of the LLM. It did cost me around 100 prompts though at the end to make each view correct.

After this category and transactio logic I asked it for an address book feature again with smart tracking. If it was able to connect a IBAN to a name it would automatically add it to the address book. It noticed that payment providers would be in transaction names (via Mollie, by Buckaroo) so it suggested to introduce smart rules that would strip out this data from transactions and account names,.which I allowed. Now this address book posed some.challenges. apparently payment processors use a shared IBAN and then take care of making sure money ends up by the right merchant. So suddenly we had both Lidl and H&M for the same IBAN. So after my prompt about this it suggested a shared IBAN interface where the user could either merge or split these ibans. Sometimes a shared IBAN was just the same merchant but different writings, so a merge would make sense (user could decide the address book name) sometimes a split would make more sense. At the same time a merchant could have multiple ibans over the year, sominprompt it to come up with a nice visual indicator for these addresses, with the option to split.

This was a hard challenge for it, I kept seeing bugs while using the feature, I think I spend up to 50-70 prompts on this feature and still can not guarantee that it is 100% bug free, but now it would be mostly in edge cases.

After all these struggles I came up with the next feature, allowing the user to track different kind of accounts, multi tenancy do to speak. For example to track your own account, a shared account, a business account, etc. I created a new plan with Gemini and Opus went ahead. it nicely added this new feature, but I had to spend a couple of prompts to make sure it would update existing views and endpoints to always include a profile id. I also had to.ask it to update the settings in app settings and profile settings, but within 20 prompts the feature was built.

Then I asked it for some smarter charts, optimisations and an updated date picker with loads of options. After that, it felt like the app was in a place where it would actually have much more than I hoped for but again have everything that we needed.

So I decided to try something new, a complete onboarding experience where each feature would be explained. A new plan with Gemini and Opus could work. It build an amazing onboarding flow that worked really great. I prompted to make sure progress could be tracked, and to make the onboarding restart from the profile.

So now I had a really nice app, but no identity for it yet. I started brainstorming with gppt4o about a name and we decided on Fluxby. Then I asked it to create a mascotte with the goal to make the app fluffy, approachable and cute. finance can be boring after all. It created a nice avatar and I followed up to bring it to life. Make it breath, follow the users mouse with its eyes and introduce some nice animations. Then I asked to incorporate it in the onboarding flow and in any upcoming features we would build.

Now that the branding was created I asked it to create a nice landing page. A couple of prompts later and we had an incredible looking one pager.

Then I asked it to create swagger docs for all endpoints and based in those docs create a developer environment like the stripe had. (I did some discussion with Gemini pro about what popular company developer docs there where, stripe was one of them and the one I really liked). With 1 prompt it created awesome looking docs and with a couple of follow up prompts it added my additional changes.

Next I planned for a help center in the same style as the developer docs. Again the UI was a bit off, I had to steer it more than I wanted to, but technically it was all there.

By now I had a landing page, awesome developer docs, help center and the actual app

Next things I asked it was to add a dark mode to all those features. That was a bit too broadd so I had to redo this prompt per section. It had a hard time applying it correctly to the dev docs and help center. It kept repeating that everything was in place, technically it was indeed, but as a ouder i would see no change when toggling. Eventually I had to start this from scratch to make it work correctly.

And then I asked to make everything multi language. This took a lot of work and I had to actually press continue during the progress, meaning it had reached 100 iterations. In the follow up days I kept seeing strings in the wrong language, but now I can offload this to a free model and tell it to fix the hard coded string

So I used quite some prompts to get everything the way I want, optimise UI features, optimise charts, data analyses, UX feature etc and then it felt done.

Next step was to.publish it using GitHub. Next plan I made, and instructed Opus to put it all in place.

The came the cleanup/security plan. We had been adding and refactoring quite some work, the LLM adds quite some functions to solve problems, those might have just one function and could be no longer relevant at this point so this plan was to go over all code and to clean up.

The next feature was the demo mode. In order for users to actually use it I wanted a mode for them to test things out. So I planned for an approach where we would have seeds.for a demo environment with budgets transactions categories and accounts. The user needed to be able to remove the account, but also to re-seed the account when it was removed.

The final feature was to plan for a proper release strategy, with human readable changelogs. And to release the app as an actual windows, Linux, apple, osx, android app

Room voor improvement:

- accessibility lots of improvements to make here
- ui consistenty
- shared db logic
