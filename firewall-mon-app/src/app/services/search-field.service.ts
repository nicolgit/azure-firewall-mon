import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const { AzureOpenAI } = require("openai");

@Injectable({
  providedIn: 'root'
})
export class SearchFieldService {

  public promptType: PromptType = PromptType.Classic;

  private prompt: string = "";
  public promptAnswer: string = "";
  public searchParams: ISearchParams = {} as ISearchParams;

  private aoaiEndpoint: string = "";
  private aoaiDeploymentId: string = "";
  private aoaiAccessKey: string = "";


  constructor() {
    this.resetParams();

    this.aoaiEndpoint = environment.OpenAIEndpoint;
    this.aoaiDeploymentId = environment.OpenAIDeploymentId;
    this.aoaiAccessKey = environment.OpenAIAccessKey;
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

  private async parsePromptChatGpt(prompt: string) {
    this.resetParams();

    var client = new AzureOpenAI({ endpoint:this.aoaiEndpoint, apiKey:this.aoaiAccessKey, apiVersion:"2024-05-01-preview", deployment:this.aoaiDeploymentId });

    const result = await client.chat.completions.create({
      messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Does Azure OpenAI support customer managed keys?" },
      { role: "assistant", content: "Yes, customer managed keys are supported by Azure OpenAI?" },
      { role: "user", content: "Do other Azure AI services support this too?" },
      ],
      model: "",
    });
    
    /*const client = new OpenAIClient(this.aoaiEndpoint, new AzureKeyCredential(this.aoaiAccessKey));
    const deploymentId = this.aoaiDeploymentId;
    const events = await client.streamChatCompletions(
    deploymentId,
      [
        { role: "system", content: "You are a helpful assistant. You will talk like a pirate." },
        { role: "user", content: "Can you help me?" },
        { role: "assistant", content: "Arrrr! Of course, me hearty! What can I do for ye?" },
        { role: "user", content: "What's the best way to train a parrot?" },
      ],
      { maxTokens: 128 },
    );
    */

    for await (const event of result.choice) {
      for (const choice of event.choices) {
        console.log(choice.delta?.content);
      }
    }

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

