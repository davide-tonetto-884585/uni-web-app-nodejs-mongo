import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

import {Course, courseSchedule, Lesson} from '../models';
import {BACKEND_URL} from '../globals';
import {UserHttpService} from './user-http.service';

@Injectable({
  providedIn: 'root'
})
export class CourseHttpService {

  constructor(
    private http: HttpClient,
    private user_http: UserHttpService,
  ) {
  }

  // ritorna i corsi aplicando eventuali filtri resi disponbili dal backend
  getCourses(limit = 10, skip = 0, title: string | null = null, lingua: string | null = null, scheduled: boolean | null = null, popular: boolean | null = null)
    : Observable<{ courses: Course[], count: number }> {
    let params = {
      limit: limit,
      skip: skip,
      title: title,
      language: lingua,
      scheduled: scheduled,
      popular: popular
    }

    return this.http.get<{ courses: Course[], count: number }>(
      `${BACKEND_URL}/courses`,
      this.createOptions(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)))
    ).pipe(catchError(this.handleError));
  }

  // reperisce un corso
  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(
      `${BACKEND_URL}/courses/${id}`
    ).pipe(catchError(this.handleError));
  }

  // richiede gli iscritti ad una specifica programmazione del corso
  getIscrittiProgCorso(id_corso: string, id_prog_corso: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/inscriptions`
    ).pipe(catchError(this.handleError));
  }

  // restituisce le lezioni di una programmazione di un corso
  getLezioniProgCorso(id_corso: string, id_prog_corso: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/lessons`,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // richiede le programmazioni di un corso con possibile filtro in_corso che permette di reperire solo i courses con schedulazioni attive
  getProgrammazioniCorso(id_corso: string, in_corso: boolean | null = null, currentOrNull: boolean | null = null): Observable<courseSchedule[]> {
    return this.http.get<courseSchedule[]>(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules`,
      this.createOptions(Object.fromEntries(Object.entries({
        current: in_corso,
        currentOrNull: currentOrNull
      }).filter(([_, v]) => v != null)))
    ).pipe(catchError(this.handleError));
  }

  getProgrammazioneCorso(id_corso: string, id_prog_corso: string): Observable<courseSchedule> {
    return this.http.get<courseSchedule>(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}`,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // iscrive uno studente ad un programmazione di un corso
  enrollStudent(id_corso: string, id_prog_corso: string, id_stud: string, in_presenza: boolean): Observable<any> {
    const form_data = new FormData();
    form_data.append('studentId', id_stud.toString())
    form_data.append('isInPresence', in_presenza.toString())

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/inscriptions`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // restituisce i corsi appartenenti al docente indicato
  getCorsiDocente(id_docente: string): Observable<Course[]> {
    return this.http.get<Course[]>(
      `${BACKEND_URL}/users/teachers/${id_docente}/courses`
    ).pipe(catchError(this.handleError));
  }

  // restituisce le iscrizioni di uno studente
  getInscriptionsStudent(id_studente: string): Observable<any> {
    return this.http.get(
      `${BACKEND_URL}/users/students/${id_studente}/inscriptions`,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // disiscrive uno studente dalla programmazione indicata
  unsubscribeStudent(id_corso: string, id_prog_corso: string, id_stud: string): Observable<any> {
    return this.http.delete(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/inscriptions/${id_stud}`,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // aggiunge un nuovo corso
  addCourse(course: Course | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(course).forEach((key) => {
      form_data.append(key, course[key]);
    });

    return this.http.post(BACKEND_URL + '/courses', form_data, this.createOptions()).pipe(
      catchError(this.handleError)
    );
  }

  // aggiorna le informazioni di un corso
  updateCourse(course: Course | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(course).forEach((key) => {
      if (course[key] != null)
        form_data.append(key, course[key]);
    });

    return this.http.put(BACKEND_URL + '/courses/' + course._id, form_data, this.createOptions()).pipe(
      catchError(this.handleError)
    );
  }

  // aggiunge una programmazione corso ad un corso
  addProgCorso(id_corso: string, prog_corso: courseSchedule | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(prog_corso).forEach((key) => {
      form_data.append(key, prog_corso[key]);
    });

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // aggiorna le informazioni di una programmazione corso
  updateProgCorso(id_corso: string, prog_corso: courseSchedule | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(prog_corso).forEach((key) => {
      form_data.append(key, prog_corso[key]);
    });

    return this.http.put(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${prog_corso._id}`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // aggiunge una lezione ad una programmazione corso
  addLezioneProg(id_corso: string, id_prog_corso: string, lezione: Lesson | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(lezione).forEach((key) => {
      form_data.append(key, lezione[key]);
    });

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/lessons`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // aggiorna le informazioni di una lezione corso
  updateLezioneProg(id_corso: string, id_prog_corso: string, lezione: Lesson | any): Observable<any> {
    const form_data = new FormData();
    Object.keys(lezione).forEach((key) => {
      form_data.append(key, lezione[key]);
    });

    return this.http.put(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/lessons/${lezione._id}`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError));
  }

  // aggiunge una presenza al corso indicato per lo studente indicato
  addPresenzaCorso(id_corso: string, id_prog_corso: string, id_lezione: string, id_studente: string, passcode: string): Observable<any> {
    const form_data = new FormData();
    form_data.append('studentId', id_studente.toString())
    form_data.append('presencePasscode', passcode)

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/lessons/${id_lezione}/attendances`,
      form_data,
      this.createOptions()
    ).pipe(catchError(this.handleError))
  }

  // invia la richiesta per il download del certificato di partecipazione
  getCertificate(id_corso: string, id_prog_corso: string, certificatePassword: string): Observable<any> {
    const form_data = new FormData();
    form_data.append('certificatePassword', certificatePassword)

    return this.http.post(
      `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/certificate`,
      form_data,
      {observe: 'response', responseType: 'blob', ...this.createOptions()}
    ).pipe(catchError(() => {
      // se la prima richiesta va in errore ne eseguo un'altra per sapere il motivo dell'errore
      return this.http.post(
        `${BACKEND_URL}/courses/${id_corso}/courseSchedules/${id_prog_corso}/certificate`,
        form_data,
        this.createOptions()
      )
    }))
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
