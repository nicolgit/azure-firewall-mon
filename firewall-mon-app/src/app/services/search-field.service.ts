import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchFieldService {

  public promptType: PromptType = PromptType.Classic;

  private prompt: string = "";
  public promptAnswer: string = "";
  public searchParams: ISearchParams = {} as ISearchParams;

  constructor() {
    this.resetParams();
   }

  public resetParams(): void {  
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
  }
  public getPrompt(): string {
    return this.prompt;
  }

  public setPrompt(prompt: string): void {
    this.prompt = prompt;

    if (this.promptType === PromptType.Classic) {
      this.parsePromptClassic(prompt);
    }
    else {
      this.parsePromptChatGpt(prompt);
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

  private parsePromptClassic(prompt: string) {
    this.resetParams();

    var words = prompt.toLowerCase().split(" ");
    for (var word of words) {
      if (word.length > 0) {
        this.searchParams.fulltext.push(word);
      }
    }
  }

  private parsePromptChatGpt(prompt: string) {
    this.resetParams();

    
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
}

export enum PromptType {
  Classic = 'classic',
  Chatgpt = 'chat'
}

