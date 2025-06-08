import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoggingService } from './logging.service';
import { ModelService } from './model.service';

import { AzureOpenAI } from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index";

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

  public resetParams(options?: { includeTimeFilter?: boolean }): void {
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

  public async parsePrompt() {
    if (this.promptType === PromptType.Classic) {
      this.parsePromptClassic();
    }
    else {
      await this.parsePromptChatGpt();
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

      var currentString = formatDate(timestamp, 'yyyy-MM-ddTHH:mm', 'en_US');
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
      this.isThinking = true;

      this.loggingService.logTrace("parsePromptChatGpt: " + this.prompt);


      const callRequest = `/api/chat?message=${this.prompt}&context=${JSON.stringify(this.searchParams)}`;
      const response = await fetch(callRequest);
      const responseText = await response.text();
      this.loggingService.logTrace("answer: " + responseText);

      if (response.status !== 200) {
        this.loggingService.logTrace(response.status + " parsePromptChatGpt - error: " + responseText);
        this.promptAnswer += responseText;
        this.isThinking = false;
        return;
      } 

      if (this.isJsonString(responseText)) {
        const jsonResponse = JSON.parse(responseText);

        if (this.isJsonString(jsonResponse.json)) {
          this.searchParams = JSON.parse(jsonResponse.json);

          if (this.searchParams.startdate.length > 0) {
            this.searchParams.startdate = this.parseHourMinuteSecondsStart(this.searchParams.startdate).toISOString();
          }

          if (this.searchParams.enddate.length > 0) {
            this.searchParams.enddate = this.parseHourMinuteSecondsEnd(this.searchParams.enddate).toISOString();
          }

          this.promptAnswer = jsonResponse.message;
        }

        this.promptAnswer = jsonResponse.message;
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

