import { Injectable } from '@angular/core';
import CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})

export class EncryptionService {
    private SECRET_KEY:string = 'ff5665cd-c5fb-4801-8a8e-344ad426d6a2';

    constructor() { }

    // Encrypt the localstorage data
    encrypt(data:any): string {
        return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
    }

    // Decrypt the encrypted data
    decrypt(data:string): string {
        return CryptoJS.AES.decrypt(data, this.SECRET_KEY).toString(CryptoJS.enc.Utf8);
    }
}