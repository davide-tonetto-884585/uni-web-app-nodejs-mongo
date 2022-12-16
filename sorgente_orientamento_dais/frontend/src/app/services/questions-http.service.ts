import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

import {Course, Lesson, courseSchedule, Classroom, Question, Answer} from '../models';
import { BACKEND_URL, FRONTEND_URL } from '../globals';
import { UserHttpService } from './user-http.service';


@Injectable({
  providedIn: 'root'
})
export class QuestionsHttpService {
  constructor(
    private http: HttpClient,
    private user_http: UserHttpService,
  ) { }

  private createOptions(params = {}) {
    return {
      headers: new HttpHeaders({
        'authorization': 'Bearer ' + this.user_http.getToken(),
        'cache-control': 'no-cache',
      }),
      params: new HttpParams({ fromObject: params })
    };
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      return throwError(() => error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        'body was: ' + JSON.stringify(error.error));

      return throwError(() => error.error.errormessage);
    }
  }

  getDomandeCorso(id_corso: string, testo: string | null, chiusa: boolean | null,
    skip: number | null, limit: number | null, order_by: string | null): Observable<any> {
    let params = { limit: limit, skip: skip, text: testo, isClosed: chiusa, orderBy: order_by };

    return this.http.get<any>(
      `${BACKEND_URL}/courses/${id_corso}/questions`,
      this.createOptions(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)))
    ).pipe(catchError(this.handleError));
  }

  getRisposteDomanda(id_corso: string, id_domanda: string): Observable<Answer[]> {
    return this.http.get<Answer[]>(
      `${BACKEND_URL}/courses/${id_corso}/questions/${id_domanda}/answers`,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  addDomandaCorso(id_corso: string, id_utente: string, text: string): Observable<any> {
    const question: any = {
      text: text,
      userId: id_utente,
    }
    const form_data = new FormData();
    Object.keys(question).forEach((key) => {
      form_data.append(key, question[key]);
    });

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/questions`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError)
    );
  }

  addRispostaCorso(id_corso: string, id_utente: string, id_domanda: string, text: string): Observable<any> {
    const question: any = {
      text: text,
      userId: id_utente,
    }
    const form_data = new FormData();
    Object.keys(question).forEach((key) => {
      form_data.append(key, question[key]);
    });

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/questions/${id_domanda}/answers`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError)
    );
  }

  // ritorna i like di una domanda
  getLikeDomanda(id_corso: string, id_domanda: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${BACKEND_URL}/courses/${id_corso}/questions/${id_domanda}/likes`,
      this.createOptions()
    ).pipe(catchError(this.handleError))
  }

  // aggiunge un like ad una domanda
  addLikeDomanda(id_corso: string, id_domanda: string): Observable<any> {
    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/questions/${id_domanda}/likes`,
      new FormData(),
      this.createOptions()
    ).pipe(catchError(this.handleError))
  }

  // chiude una domanda esistente aperta
  closeDomanda(id_corso: string, id_domanda: string): Observable<any> {
    let form_data = new FormData();
    form_data.append('isClosed', 'true');

    return this.http.put(
      `${BACKEND_URL}/courses/${id_corso}/questions/${id_domanda}`,
      form_data,
      this.createOptions()
    )
  }
}
