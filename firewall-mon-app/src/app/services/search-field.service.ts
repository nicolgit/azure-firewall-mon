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

  constructor() { }

  public getPrompt(): string {
    return this.prompt;
  }

  public setPrompt(prompt: string): void {
    this.prompt = prompt;

    if (this.promptType === PromptType.Classic) {
      this.searchParams = this.parseprompt(prompt);
    }
  }

  public setDatesInterval(startdate: string, enddate: string): void {
    this.searchParams.startdate = startdate;
    this.searchParams.enddate = enddate;
  }

  public setDatesIntervalFromMinuter(minutes: number): void {
    var enddate = new Date();
    var startdate = new Date(enddate.getTime() - minutes * 60000);

    this.searchParams.enddate = formatDate(enddate.getTime(), 'yyyy-MM-ddTHH:mm', 'en_US');
    this.searchParams.startdate = formatDate(startdate.getTime(), 'yyyy-MM-ddTHH:mm', 'en_US');
  }

  private parseprompt(prompt: string): ISearchParams {
    var searchParams = {} as ISearchParams;

    var words = prompt.toLowerCase().split(" ");
    for (var word of words) {
      if (word.length > 0) {
        searchParams.fulltext.push(word);
      }
    }

    return searchParams;
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

