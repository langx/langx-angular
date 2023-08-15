import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public _uid = new BehaviorSubject<any>(null);
  currentUser: any;

  constructor(
    private fireAuth: Auth,
    private apiService: ApiService
  ) { }

  async login(email: string, password: string): Promise<any> {
    try {
      const response = await signInWithEmailAndPassword(
        this.fireAuth,
        email,
        password
      );
      console.log(response);
      if(response?.user) {
        this.setUserData(response.user.uid);
        await this.apiService.setDocument(`users/${response.user.uid}`, {lastLogin: new Date()}, {merge: true});
      }
    } catch(e) {
      throw(e);
    }
  }

  getId() {
    const auth = getAuth();
    this.currentUser = auth.currentUser;
    // console.log('getId() in auth.service ', this.currentUser, this.currentUser.uid);
    return this.currentUser?.uid;
  }

  setUserData(uid) {
    this._uid.next(uid);
  }

  randomIntFromInterval = (min: number,max: number) => { return Math.floor(Math.random() * (max-min+1) +min) }

  async register(formValue) {
    try {
      const registeredUser = await createUserWithEmailAndPassword(
        this.fireAuth,
        formValue?.email,
        formValue?.password
      );
      console.log('registredUser:', registeredUser);
      const data = {
        email: formValue?.email,
        name: formValue?.name,
        uid: registeredUser.user.uid,
        photo: 'https://i.pravatar.cc/' + this.randomIntFromInterval(200,400),
        lastLogin: new Date(),
        lastSeen: new Date(),
        online: true,
      }
      await this.apiService.setDocument(`users/${registeredUser.user.uid}`, data);
      const userData = {
        id: registeredUser.user.uid
      };
      // set user data while registering
      this.setUserData(registeredUser.user.uid);
      return userData;
    } catch(e) {
      throw(e);
    }
  }

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.fireAuth, email);
    } catch(e) {
      throw(e);
    }
  }

  async logout() {
    try {
      await this.fireAuth.signOut();
      this.setUserData(null);
      this.currentUser = null;
      return true;
    } catch(e) {
      throw(e);
    }
  }

  checkAuth(): Promise<any> {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this.fireAuth, user => {
        // console.log('auth user:', user);
        resolve(user);
        return true;
      })
    })
  }

  async getUserData(id) {
    const docSnap: any = await this.apiService.getDocById(`users/${id}`);
    if(docSnap?.exists()) {
      return docSnap.data();
    } else {
      throw('No such document');
    }
  }
  
  async updateUserData(formValue) {
    let id = this.getId();
    //console.log('id:', id, 'formValue:', formValue);
    try {
      const data = {
        birthdate: formValue?.birthdate,
        gender: formValue?.gender,
        country: {
          name: formValue?.country,
          code: formValue?.countryCode
        }
      }
      await this.apiService.updateDocument(`users/${id}`, data);
    } catch(e) {
      throw(e);
    }
  }
}