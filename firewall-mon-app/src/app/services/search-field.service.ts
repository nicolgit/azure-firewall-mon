import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoggingService } from './logging.service';
import { ModelService } from './model.service';

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

@Injectable({
  providedIn: 'root'
})
export class SearchFieldService {

  public promptType: PromptType = PromptType.Classic;
  public isThinking: boolean = false;

  private prompt: string = "";
  private promptAnswer: string = "";
  public searchParams: ISearchParams = {} as ISearchParams;

  constructor(private loggingService: LoggingService, private model: ModelService) {
    this.searchParams.startdate = ""; 
    this.searchParams.enddate = ""; 
    this.searchParams.lastminutes = 0;
    this.resetParams();
   }

  public resetParams(options?: { includeTimeFilter?: boolean}): void {  
    this.promptAnswer = "";

    if (options != null && options.includeTimeFilter != null && options.includeTimeFilter == true) {
      this.searchParams.startdate = "";
      this.searchParams.enddate = "";
      this.searchParams.lastminutes = 0;
    }

    this.searchParams.fulltext = [];
    this.searchParams.category = [];
    this.searchParams.protocol = [];
    this.searchParams.source = [];
    this.searchParams.target = [];
    this.searchParams.action = [];
    this.searchParams.policy = [];
    this.searchParams.moreinfo = [];
  }
  public getPrompt(): string {
    return this.prompt;
  }

  public getPromptAnswer(): string {
    return this.promptAnswer;
  }

  public setPrompt(prompt: string): void {
    this.prompt = prompt;

    if (this.promptType === PromptType.Classic) {
      this.parsePromptClassic();
    }
    else {
      //this.parsePromptChatGpt(prompt);
    }
  } 

  public parsePrompt(): void {
    if (this.promptType === PromptType.Classic) {
      this.parsePromptClassic();
    }
    else {
      this.parsePromptChatGpt();
    }
  }

  public setDatesInterval(startdate: string, enddate: string): void {
    this.searchParams.lastminutes = 0;
    this.searchParams.startdate = startdate;
    this.searchParams.enddate = enddate;
  }

  public setLastMinutes(minutes: number): void {
    this.searchParams.lastminutes = minutes;
    this.searchParams.enddate = "";
    this.searchParams.startdate = "";
  }

  public isTimestampWithinFilter(timestamp: string): boolean {

    if (this.searchParams.lastminutes > 0) {
      if (timestamp == null || timestamp.length == 0)
        return false;

      var now = new Date();
      var date = new Date(timestamp);

      var diff = now.getTime() - date.getTime();
      var minutes = diff / 60000;
      if (minutes > this.searchParams.lastminutes)
        return false;
    } else {
      var startdate = this.searchParams.startdate;
      var enddate = this.searchParams.enddate;

      var currentString =  formatDate(timestamp, 'yyyy-MM-ddTHH:mm', 'en_US');
      if (startdate.length > 0 && currentString < startdate)
        return false;

      if (enddate.length > 0 && currentString > enddate)
        return false;
    }

    return true;
  }


  private parsePromptClassic() {
    this.resetParams();

    var words = this.prompt.toLowerCase().split(" ");
    for (var word of words) {
      if (word.length > 0) {
        this.searchParams.fulltext.push(word);
      }
    }
  }

  private async parsePromptChatGpt() {
    try {
      var aoaiEndpoint = this.model.aoaiEndpoint
      var aoaiDeploymentId = this.model.aoaiDeploymentId;
      var aoaiAccessKey = this.model.aoaiAccessKey;

      this.isThinking = true;

      this.loggingService.logTrace ("parsePromptChatGpt: " + this.prompt);

      const client = new OpenAIClient(
        aoaiEndpoint, 
        new AzureKeyCredential(aoaiAccessKey)
      );
      
      var messages = [
        { role: "system", content: `
You are an AI assistant that 
converts user requests to a JSON (not JSON5) message to use as filters for a web console that filters flow logs coming from an Azure Firewall. 

Allowed fields are: timestamp, lastminutes, category, protocol, source, target, action, policy, moreinfo 
All values must be converted to lowercase.

timestamp is a string in the format "HH:mm" or "HH:mm:ss", representing the local time of the day, no gmt. 

lastminutes is a number of minutes in the past to show starting from the current time.
lastminutes and timestamp are mutually exclusive, if both are present, lastminutes is used.
lastminutes = 0 means no lastminutes filter.

the request can be generic, search the text on all fields, or specific to one or more fields.

by default, the request adds parameters to the current json message, but it is also possible to replace the JSON message with a new one.

if you want to show how to use this agent, just show sample requests and not the JSON output, and begins the sentence with 'here some examples query you can use:'

some examples:
user: show me events from last 12 minutes
answer:{"fulltext":[],"startdate":"","enddate":"", "lastminutes": 12, "category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}


user: search pippo pluto paperino
answer:{"fulltext":["pippo","pluto","paperino"],"startdate":"","enddate":"","lastminutes": O,"category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}

user: filter rows with category containing "NetworkRule"
answer: {"fulltext":[],"startdate":"","enddate":"","lastminutes": O,"category":["NetworkRule"],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}

user: filter event between 10:30 and 10:45
answer: {"fulltext":[],"startdate":"10:30","enddate":"10:45","lastminutes": O,"category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}

user: clear all filters
answer: {"fulltext":[],"startdate":"","enddate":"","lastminutes": O,"category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}

current json message is: ${JSON.stringify(this.searchParams)}
`},
        { role: "user", content: this.prompt },
      ];

      const events = await client.getChatCompletions(aoaiDeploymentId, messages);

      this.loggingService.logTrace("Event: " + JSON.stringify(events));
      
      if (this.isJsonString(events.choices[0].message.content)) {
        this.searchParams = JSON.parse(events.choices[0].message.content);

        if (this.searchParams.startdate.length > 0 ) {
          this.searchParams.startdate =this.parseHourMinuteSecondsStart(this.searchParams.startdate).toISOString();
        }

        if (this.searchParams.enddate.length > 0) {
          this.searchParams.enddate = this.parseHourMinuteSecondsEnd(this.searchParams.enddate).toISOString();
        }

        messages[1] = { role: "user", content: `convert following JSON message in a human readable text. omit empty fields. start the answer with 'I am currently showing ...': ${JSON.stringify(this.searchParams)}`};
        const events2 = await client.getChatCompletions(aoaiDeploymentId, messages);
        this.promptAnswer = events2.choices[0].message.content;
      }
      else {
        this.promptAnswer = events.choices[0].message.content;
      }

    } catch (error) {
      this.loggingService.logTrace("parsePromptChatGpt: " + error);
      this.promptAnswer = "Unexpected error, please be sure that aoaiEndpoint, deployment and key are valid.<br/>";
      this.promptAnswer += error;
  }
    this.isThinking = false;
  }

  private parseHourMinuteSecondsStart(time: string): Date {
    const [hour, minute, second] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(second || 0);
    date.setMilliseconds(0);
    return date;
  }

  private parseHourMinuteSecondsEnd(time: string): Date {
    const [hour, minute, second] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(second || 59);
    date.setMilliseconds(999);
    return date;
  }

  private isJsonString(myString: string): boolean {
     try {
        var o = JSON.parse(myString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
  }
}

export interface ISearchParams {
  fulltext: string[];

  startdate: string; 
  enddate: string;
  lastminutes: number;

  category: string[];
  protocol: string[];
  source: string[];
  target: string[];
  action: string[];
  policy: string[];
  moreinfo: string[];
}

export enum PromptType {
  Classic = 'classic',
  Chatgpt = 'chat'
}

