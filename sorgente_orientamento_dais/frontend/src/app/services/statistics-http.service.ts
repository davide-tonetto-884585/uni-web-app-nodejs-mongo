import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';
import {BACKEND_URL} from '../globals';
import {UserHttpService} from './user-http.service';
import {Statistics} from "../models";

@Injectable({
  providedIn: 'root'
})
export class StatisticsHttpService {
  constructor(
    private http: HttpClient,
    private user_http: UserHttpService,
  ) {
  }

  // crea le informazioni di base per le richieste http
  private createOptions(params = {}) {
    return {
      headers: new HttpHeaders({
        'authorization': 'Bearer ' + this.user_http.getToken(),
        'cache-control': 'no-cache',
      }),
      params: new HttpParams({fromObject: params})
    };
  }

  // da informazioni sugli errori delle richieste HTTP
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

  // ritorna un Observable con le statistiche del corso indicato
  getCourseStatistics(id_corso: string): Observable<Statistics> {
    return this.http.get<Statistics>(
      `${BACKEND_URL}/courses/${id_corso}/statistics`,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }
}
