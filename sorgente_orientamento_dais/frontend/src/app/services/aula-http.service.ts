import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

import {Classroom} from '../models';
import {BACKEND_URL} from '../globals';
import {UserHttpService} from './user-http.service';

@Injectable({
  providedIn: 'root'
})
export class AulaHttpService {
  constructor(
    private http: HttpClient,
    private user_http: UserHttpService,
  ) {
  }

  // restituisce un'aula
  getAula(id_aula: string): Observable<Classroom> {
    return this.http.get<Classroom>(
      `${BACKEND_URL}/classrooms/${id_aula}`
    ).pipe(catchError(this.handleError));
  }

  // restituisce tutte le aule presenti nel database
  getAule(): Observable<Classroom[]> {
    return this.http.get<Classroom[]>(
      `${BACKEND_URL}/classrooms`
    ).pipe(catchError(this.handleError));
  }

  // aggiunge un'aula con le informazioni passate
  addAula(aula: Classroom | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(aula).forEach((key) => {
      form_data.append(key, aula[key]);
    });

    return this.http.post(
      `${BACKEND_URL}/classrooms`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  private createOptions(params = {}) {
    return {
      headers: new HttpHeaders({
        'authorization': 'Bearer ' + this.user_http.getToken(),
        'cache-control': 'no-cache',
      }),
      params: new HttpParams({fromObject: params})
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
}
