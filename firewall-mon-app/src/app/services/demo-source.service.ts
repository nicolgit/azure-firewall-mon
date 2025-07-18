import { Injectable } from '@angular/core';

import { LoggingService } from './logging.service';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DemoSourceService implements IFirewallSource {
  
  private startingRows: number = 50000;
  private moreRows: number = 2000;
  private intervalBetweenMoreRows: number = 5000; // millisenconds

  constructor( private model:ModelService,
    private logginService: LoggingService,
    ) { 
    
    this.DATA = [];

    for (let i = 0; i < this.startingRows; i++) {
      
      var currentTime = new Date();
      currentTime.setSeconds(currentTime.getSeconds() - i);

      var time = JSON.stringify({'now': currentTime}).replace("{\"now\":\"","").replace("\"}",""); //2022-10-18T10:19:05.9886250Z
      //var time = JSON.stringify({'now': new Date()}).replace("{\"now\":\"","").replace("\"}",""); //2022-10-18T10:19:05.9886250Z
      
      var row = {
        rowid: this.getRowID(),

        time: time,
        category: this.categories[Math.floor(Math.random() * this.categories.length)],
        protocol: this.protocolsArray[Math.floor(Math.random() * this.protocolsArray.length)],
        sourceip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
        srcport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
        targetip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
        targetport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
        action: this.actionsArray[Math.floor(Math.random() * this.actionsArray.length)],
        policy: this.policies[Math.floor(Math.random() * this.policies.length)],
        dataRow: this.buildDatarow(time)
      } as FirewallDataRow;

      this.DATA.push(row);
    }
  }

  private queueLength: number = 0;
  private intervalId: any=null;
  private protocolsArray: Array<string> = ["TCP", "UDP"];
  private actionsArray: Array<string> = ["Allow", "Deny", "Request", "Alert", "Drop"];
  private portsArray: Array<string> = ["80", "443", "8080", "8443","22","21","23","25","53","110","143","389","443","445","993","995","1723","3306","3389","5900","8080","8443"];
  private categories: Array<string> = ["NetworkRule", "ApplicationRule", "NatRule"];
  private policies: Array<string> = ["Category01>Group01>Policy01", "Category02>Group02>Policy02", "Category03>Group03>Policy03", "Category04>Group04>Policy04" ];
  private DATA: Array<FirewallDataRow> = [];

  public skippedRows: number = 0;
  public onDataArrived?: (data: Array<FirewallDataRow>) => void;
  public onRowSkipped?: (skipped: number) => void;
  public onMessageArrived?: ((message: string) => void);

  public async start() {
    await this.randomQuote();
    await this.randomQuote();
    await this.randomQuote();
    
    this.queueLength = await this.getQueueLenght();

    this.outputMessage("");

    this.onDataArrived?.(this.DATA);

    this.intervalId = setInterval(() => {
      const moreRows: number = Math.floor(Math.random() * this.moreRows);
      for (let i = 0; i < moreRows; i++) {       
        if (Math.random() > 0.2) {
          var time = JSON.stringify({'now': new Date()}).replace("{\"now\":\"","").replace("\"}",""); //2022-10-18T10:19:05.9886250Z
          var row = {
            rowid: this.getRowID(),

            time: time,
            category: this.categories[Math.floor(Math.random() * this.categories.length)],
            protocol: this.protocolsArray[Math.floor(Math.random() * this.protocolsArray.length)],
            sourceip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
            srcport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
            targetip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
            targetport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
            action: this.actionsArray[Math.floor(Math.random() * this.actionsArray.length)],
            policy: this.policies[Math.floor(Math.random() * this.policies.length)],
            dataRow: this.buildDatarow(time)
          } as FirewallDataRow;

          if (Math.random() > 0.8) {
            row.moreInfo = "https://www." + this.randomQuotes[Math.floor(Math.random() * this.randomQuotes.length)].replace(/ /g,".") + ".com";
          }
        }
        else {
          var time = JSON.stringify({'now': new Date()}).replace("{\"now\":\"","").replace("\"}",""); //2022-10-18T10:19:05.9886250Z
          row = {
            rowid: this.getRowID(),
            
            time: time,
            category: "SKIPPED",
            action: "unmanaged row type",
            dataRow: this.buildDatarow(time)
          } as FirewallDataRow;

          this.skippedRows++;
          this.onRowSkipped?.(this.skippedRows); 
        }
      this.DATA.unshift(row);

      while (this.DATA.length > this.queueLength) {
        this.DATA.pop();
      }

      }

      this.onDataArrived?.(this.DATA);
      this.outputMessage( moreRows + " more events received as of " + new Date().toLocaleString());
      
      this.logginService.logEvent ("DEMO Source heartbit");
    }, this.intervalBetweenMoreRows);
  }

  private async getQueueLenght(): Promise<number> {
    try {
      const response = await fetch('/api/settings/local_queuelength');
      
      if (!response.ok) {
        console.error('queue lenght API endpoint returned error:', response.status);
        return 10;
      }      
      
      // Parse the response as text and convert to number
      const text = await response.text();
      return Number(text);
    } catch (error) {
      console.error('Error fetching queue lenght endpoint:', error);
      return 10;
    }
  }

  public async pause() {
    clearInterval(this.intervalId);
    this.logginService.logEvent("demo source paused");
  }

  public async stop() {
    clearInterval(this.intervalId);
    this.logginService.logEvent("demo source stopped");
  }

  public async clear() {
    this.DATA = [];
    this.onDataArrived?.(this.DATA);
    this.outputMessage("logs successfully deleted!");
  }

  private outputMessage (text:string): void {
    this.onMessageArrived?.(text);
    this.logginService.logTrace(text);
  }

  private buildDatarow(time:string):any {
    const datarow:string = `{
      "category": "AzureFirewallNetworkRule",
      "time": "` + time + `",
      "resourceId": "/SUBSCRIPTIONS/` + crypto.randomUUID() + `",
      "operationName": "AzureFirewallNatRuleLog",
      "properties": {
        "Protocol": "HTTP",
        "SourceIp": "10.13.1.4",
        "SourcePort": 51674,
        "DestinationIp": "",
        "DestinationPort": 80,
        "Fqdn": "testmaliciousdomain.eastus.cloudapp.azure.com",
        "TargetUrl": "",
        "Action": "Alert",
        "ThreatDescription": "This is a test indicator for a Microsoft owned domain.",
        "IsTlsInspected": "false",
        "msg": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      }}`
    return JSON.parse(datarow);
  }

  private async randomQuote() {
    this.outputMessage(this.randomQuotes[Math.floor(Math.random() * this.randomQuotes.length)]);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private lastRowID: number = 0;
  private getRowID(): string {
    this.lastRowID++;
    return this.lastRowID.toString();
  }

  private randomQuotes:Array<string> = [
    "Reticulating splines...",
    "Generating witty dialog...",
    "Swapping time and space...",
    "Spinning violently around the y-axis...",
    "Tokenizing real life...",
    "Bending the spoon...",
    "Filtering morale...",
    "Don't think of purple hippos...",
    "We need a new fuse...",
    "Have a good day.",
    "Upgrading Windows, your PC will restart several times. Sit back and relax.",
    "640K ought to be enough for anybody",
    "The architects are still drafting",
    "The bits are breeding",
    "We're building the buildings as fast as we can",
    "Would you prefer chicken, steak, or tofu?",
    "(Pay no attention to the man behind the curtain)",
    "...and enjoy the elevator music...",
    "Please wait while the little elves draw your map",
    "Don't worry - a few bits tried to escape, but we caught them",
    "Would you like fries with that?",
    "Checking the gravitational constant in your locale...",
    "Go ahead -- hold your breath!",
    "...at least you're not on hold...",
    "Hum something loud while others stare",
    "You're not in Kansas any more",
    "The server is powered by a lemon and two electrodes.",
    "Please wait while a larger software vendor in Seattle takes over the world",
    "We're testing your patience",
    "As if you had any other choice",
    "Follow the white rabbit",
    "Why don't you order a sandwich?",
    "While the satellite moves into position",
    "keep calm and npm install",
    "The bits are flowing slowly today",
    "Dig on the 'X' for buried treasure... ARRR!",
    "It's still faster than you could draw it",
    "The last time I tried this the monkey didn't survive. Let's hope it works better this time.",
    "I should have had a V8 this morning.",
    "My other loading screen is much faster.",
    "Testing on Timmy... We're going to need another Timmy.",
    "Reconfoobling energymotron...",
    "(Insert quarter)",
    "Are we there yet?",
    "Have you lost weight?",
    "Just count to 10",
    "Why so serious?",
    "It's not you. It's me.",
    "Counting backwards from Infinity",
    "Don't panic...",
    "Embiggening Prototypes",
    "Do not run! We are your friends!",
    "Do you come here often?",
    "Warning: Don't set yourself on fire.",
    "We're making you a cookie.",
    "Creating time-loop inversion field",
    "Spinning the wheel of fortune...",
    "Loading the enchanted bunny...",
    "Computing chance of success",
    "I'm sorry Dave, I can't do that.",
    "Looking for exact change",
    "All your web browser are belong to us",
    "All I really need is a kilobit.",
    "I feel like im supposed to be loading something. . .",
    "What do you call 8 Hobbits? A Hobbyte.",
    "Should have used a compiled language...",
    "Is this Windows?",
    "Adjusting flux capacitor...",
    "Please wait until the sloth starts moving.",
    "Don't break your screen yet!",
    "I swear it's almost done.",
    "Let's take a mindfulness minute...",
    "Unicorns are at the end of this road, I promise.",
    "Listening for the sound of one hand clapping...",
    "Keeping all the 1's and removing all the 0's...",
    "Putting the icing on the cake. The cake is not a lie...",
    "Cleaning off the cobwebs...",
    "Making sure all the i's have dots...",
    "We need more dilithium crystals",
    "Where did all the internets go",
    "Connecting Neurotoxin Storage Tank...",
    "Granting wishes...",
    "Time flies when you’re having fun.",
    "Get some coffee and come back in ten minutes..",
    "Spinning the hamster…",
    "99 bottles of beer on the wall..",
    "Stay awhile and listen..",
    "Be careful not to step in the git-gui",
    "You edhall not pass! yet..",
    "Load it and they will come",
    "Convincing AI not to turn evil..",
    "There is no spoon. Because we are not done loading it",
    "Your left thumb points to the right and your right thumb points to the left.",
    "How did you get here?",
    "Wait, do you smell something burning?",
    "Computing the secret to life, the universe, and everything.",
    "When nothing is going right, go left!!...",
    "I love my job only when I'm on vacation...",
    "i'm not lazy, I'm just relaxed!!",
    "Never steal. The government hates competition....",
    "Why are they called apartments if they are all stuck together?",
    "Life is Short – Talk Fast!!!!",
    "Optimism – is a lack of information.....",
    "Save water and shower together",
    "Whenever I find the key to success, someone changes the lock.",
    "Sometimes I think war is God’s way of teaching us geography.",
    "I’ve got problem for your solution…..",
    "Where there’s a will, there’s a relative.",
    "User: the word computer professionals use when they mean !!idiot!!",
    "Adults are just kids with money.",
    "I think I am, therefore, I am. I think.",
    "A kiss is like a fight, with mouths.",
    "You don’t pay taxes—they take taxes.",
    "Coffee, Chocolate, Men. The richer the better!",
    "I am free of all prejudices. I hate everyone equally.",
    "git happens",
    "May the forks be with you",
    "A commit a day keeps the mobs away",
    "This is not a joke, it's a commit.",
    "Constructing additional pylons...",
    "Roping some seaturtles...",
    "Locating Jebediah Kerman...",
    "We are not liable for any broken screens as a result of waiting.",
    "Hello IT, have you tried turning it off and on again?",
    "If you type Google into Google you can break the internet",
    "Well, this is embarrassing.",
    "What is the airspeed velocity of an unladen swallow?",
    "Hello, IT... Have you tried forcing an unexpected reboot?",
    "They just toss us away like yesterday's jam.",
    "They're fairly regular, the beatings, yes. I'd say we're on a bi-weekly beating.",
    "The Elders of the Internet would never stand for it.",
    "Space is invisible mind dust, and stars are but wishes.",
    "Didn't know paint dried so quickly.",
    "Everything sounds the same",
    "I'm going to walk the dog",
    "I didn't choose the engineering life. The engineering life chose me.",
    "Dividing by zero...",
    "Spawn more Overlord!",
    "If I’m not back in five minutes, just wait longer.",
    "Some days, you just can’t get rid of a bug!",
    "We’re going to need a bigger boat.",
    "Chuck Norris never git push. The repo pulls before.",
    "Web developers do it with <style>",
    "I need to git pull --my-life-together",
    "Java developers never RIP. They just get Garbage Collected.",
    "Cracking military-grade encryption...",
    "Simulating traveling salesman...",
    "Proving P=NP...",
    "Entangling superstrings...",
    "Twiddling thumbs...",
    "Searching for plot device...",
    "Trying to sort in O(n)...",
    "Laughing at your pictures-i mean, loading...",
    "Sending data to NS-i mean, our servers.",
    "Looking for sense of humour, please hold on.",
    "Please wait while the intern refills his coffee.",
    "A different error message? Finally, some progress!",
    "Hold on while we wrap up our git together...sorry",
    "Please hold on as we reheat our coffee",
    "Kindly hold on as we convert this bug to a feature...",
    "Kindly hold on as our intern quits vim...",
    "Winter is coming...",
    "Installing dependencies",
    "Switching to the latest JS framework...",
    "Distracted by cat gifs",
    "Finding someone to hold my beer",
    "BRB, working on my side project",
    "@todo Insert witty loading message",
    "Let's hope it's worth the wait",
    "Aw, snap! Not..",
    "Ordering 1s and 0s...",
    "Updating dependencies...",
    "Whatever you do, don't look behind you...",
    "Please wait... Consulting the manual...",
    "It is dark. You're likely to be eaten by a grue.",
    "Loading funny message...",
    "It's 10:00pm. Do you know where your children are?",
    "Waiting Daenerys say all her titles...",
    "Feel free to spin in your chair",
    "What the what?",
    "format C: ...",
    "Forget you saw that password I just typed into the IM ...",
    "What's under there?",
    "Your computer has a virus, its name is Windows!",
    "Go ahead, hold your breath and do an ironman plank till loading complete",
    "Bored of slow loading spinner, buy more RAM!",
    "Help, I'm trapped in a loader!",
    "What is the difference btwn a hippo and a zippo? One is really heavy, the other is a little lighter",
    "Please wait, while we purge the Decepticons for you. Yes, You can thanks us later!",
    "Chuck Norris once urinated in a semi truck's gas tank as a joke....that truck is now known as Optimus Prime.",
    "Chuck Norris doesn’t wear a watch. HE decides what time it is.",
    "Mining some bitcoins...",
    "Downloading more RAM..",
    "Updating to Windows Vista...",
    "Deleting System32 folder",
    "Hiding all ;'s in your code",
    "Alt-F4 speeds things up.",
    "Initializing the initializer...",
    "When was the last time you dusted around here?",
    "Optimizing the optimizer...",
    "Last call for the data bus! All aboard!",
    "Running swag sticker detection...",
    "Never let a computer know you're in a hurry.",
    "A computer will do what you tell it to do, but that may be much different from what you had in mind.",
    "Some things man was never meant to know. For everything else, there's Google.",
    "Unix is user-friendly. It's just very selective about who its friends are.",
    "Shovelling coal into the server",
    "Pushing pixels...",
    "How about this weather, eh?",
    "Building a wall...",
    "Everything in this universe is either a potato or not a potato",
    "The severity of your issue is always lower than you expected.",
    "Updating Updater...",
    "Downloading Downloader...",
    "Debugging Debugger...",
    "Reading Terms and Conditions for you.",
    "Digested cookies being baked again.",
    "Live long and prosper.",
    "There is no cow level, but there's a goat one!",
    "Deleting all your hidden porn...",
    "Running with scissors...",
    "Definitely not a virus...",
    "You may call me Steve.",
    "You seem like a nice person...",
    "Coffee at my place, tommorow at 10A.M. - don't be late!",
    "Work, work...",
    "Patience! This is difficult, you know...",
    "Discovering new ways of making you wait...",
    "Your time is very important to us. Please wait while we ignore you...",
    "Time flies like an arrow; fruit flies like a banana",
    "Two men walked into a bar; the third ducked...",
    "Sooooo... Have you seen my vacation photos yet?",
    "Sorry we are busy catching em' all, we're done soon",
    "TODO: Insert elevator music",
    "Still faster than Windows update",
    "Composer hack: Waiting for reqs to be fetched is less frustrating if you add -vvv to your command.",
    "Please wait while the minions do their work",
    "Grabbing extra minions",
    "Doing the heavy lifting",
    "We're working very Hard .... Really",
    "Waking up the minions",
    "You are number 2843684714 in the queue",
    "Please wait while we serve other customers...",
    "Our premium plan is faster",
    "Feeding unicorns...",
    "Rupturing the subspace barrier",
    "Creating an anti-time reaction",
    "Converging tachyon pulses",
    "Bypassing control of the matter-antimatter integrator",
    "Adjusting the dilithium crystal converter assembly",
    "Reversing the shield polarity",
    "Disrupting warp fields with an inverse graviton burst",
    "Up, Up, Down, Down, Left, Right, Left, Right, B, A.",
    "Do you like my loading animation? I made it myself",
    "Whoah, look at it go!",
    "No, I'm awake. I was just resting my eyes.",
    "One mississippi, two mississippi...",
    "Don't panic... AHHHHH!",
    "Ensuring Gnomes are still short.",
    "Baking ice cream...",
  ];
}
