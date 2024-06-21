import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoggingService } from './logging.service';

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

@Injectable({
  providedIn: 'root'
})
export class SearchFieldService {

  public promptType: PromptType = PromptType.Classic;

  private prompt: string = "";
  private promptAnswer: string = "";
  public searchParams: ISearchParams = {} as ISearchParams;

  private aoaiEndpoint: string = "";
  private aoaiDeploymentId: string = "";
  private aoaiAccessKey: string = "";


  constructor(private loggingService: LoggingService) {
    this.resetParams();

    this.aoaiEndpoint = environment.OpenAIEndpoint;
    this.aoaiDeploymentId = environment.OpenAIDeploymentId;
    this.aoaiAccessKey = environment.OpenAIAccessKey;
   }

  public resetParams(): void {  
    this.promptAnswer = "";

    this.searchParams = {} as ISearchParams;
    this.searchParams.fulltext = [];
    this.searchParams.startdate = ""; // formatDate(new Date(), 'yyyy-MM-ddTHH:mm', 'en_US');;
    this.searchParams.enddate = ""; //formatDate(new Date(), 'yyyy-MM-ddTHH:mm', 'en_US');;
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
    this.searchParams.startdate = startdate;
    this.searchParams.enddate = enddate;
  }

  public setDatesIntervalFromMinutes(minutes: number): void {
    var enddate = new Date();
    var startdate = new Date(enddate.getTime() - minutes * 60000);

    this.searchParams.enddate = formatDate(enddate.getTime(), 'yyyy-MM-ddTHH:mm', 'en_US');
    this.searchParams.startdate = formatDate(startdate.getTime(), 'yyyy-MM-ddTHH:mm', 'en_US');
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
    this.resetParams();

    this.loggingService.logTrace ("parsePromptChatGpt: " + this.prompt);

    const client = new OpenAIClient(
      this.aoaiEndpoint, 
      new AzureKeyCredential(this.aoaiAccessKey)
    );
    
    const messages = [
      { role: "system", content: `You are an AI assistant that 
converts user requests to a JSON (not JSON5) message to use as filters for a web console that filters flow logs coming from an Azure Firewall. 

Allowed fields are: timestamp, category, protocol, source, target, action, policy, moreinfo 

the request can be generic, search the text on all fields, or specific to one or more fields.
by default, the request adds parameters to the current json message, but it is also possible to replace the JSON message with a new one.

current json message is: ${JSON.stringify(this.searchParams)}
`},
      { role: "user", content: `search pippo pluto paperino` },
      { role: "assistant", content: `{"fulltext":["pippo","pluto","paperino"],"startdate":"","enddate":"","category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}` },
      { role: "user", content: ` filter rows with category containing "NetworkRule"` },
      { role: "assistant", content: `{"fulltext":[],"startdate":"","enddate":"","category":["NetworkRule"],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}` },
      { role: "user", content: `filter event between 10:30 and 10:45` },
      { role: "assistant", content: `{"fulltext":[],"startdate":"10:30","enddate":"10:45","category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}` },
      { role: "user", content: `clear all filters` },
      { role: "assistant", content: `{"fulltext":[],"startdate":"","enddate":"","category":[],"protocol":[],"source":[],"target":[],"action":[],"policy":[],"moreinfo":[]}` },

      { role: "user", content: this.prompt },
    ];

    const events = await client.getChatCompletions(this.aoaiDeploymentId, messages);

    this.loggingService.logTrace("Event: " + JSON.stringify(events));
    
    if (this.isJsonString(events.choices[0].message.content)) {
      this.searchParams = JSON.parse(events.choices[0].message.content);
    }
    else {
      this.promptAnswer = events.choices[0].message.content;
    }
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

