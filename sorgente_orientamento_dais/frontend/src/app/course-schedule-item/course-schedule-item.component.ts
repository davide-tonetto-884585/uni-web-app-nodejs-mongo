import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AulaHttpService} from '../services/aula-http.service';
import {CourseHttpService} from '../services/course-http.service';
import {MessageDialogComponent} from '../message-dialog/message-dialog.component';
import {Classroom, courseSchedule, Lesson, Teacher} from '../models';
import {UserHttpService} from '../services/user-http.service';
import {FRONTEND_URL, SECRET} from '../globals';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-course-schedule-item',
  templateUrl: './course-schedule-item.component.html',
  styleUrls: ['./course-schedule-item.component.css']
})
export class CourseScheduleItemComponent implements OnInit {
  @Input() id_corso?: string;
  @Input() prog: courseSchedule | undefined;
  @Input() docente_corso: Teacher | undefined;

  QRInfo: string | null = null;

  constructor(
    private course_http: CourseHttpService,
    private aula_http: AulaHttpService,
    private dialog: MatDialog,
    private user_http: UserHttpService,
  ) {
  }

  ngOnInit(): void {
    this.loadLessons();
  }

  getId(): string | undefined {
    return this.user_http.getId();
  }

  isLogged(): boolean {
    return this.user_http.isLogged();
  }

  isStudent(): boolean {
    return this.user_http.isStudent();
  }

  enrollStudent(in_presenza: boolean) {
    let id_stud = this.user_http.getId()
    if (id_stud && this.prog && this.id_corso) {
      this.course_http.enrollStudent(this.id_corso, this.prog._id, id_stud, in_presenza).subscribe({
        next: (d) => {
          this.dialog.open(MessageDialogComponent, {
            data: {
              text: 'Successful registration',
              title: 'Done!',
              error: false
            },
          });
        },
        error: (err) => {
          this.dialog.open(MessageDialogComponent, {
            data: {
              text: err,
              title: 'Failed!',
              error: true
            },
          });
        }
      })
    }
  }

  loadLessons(): void {
    if (this.prog && this.id_corso) {
      this.course_http.getLezioniProgCorso(this.id_corso, this.prog._id).subscribe({
        next: (lezioni: Lesson[]) => {
          if (this.prog) {
            this.prog.lessons = lezioni;

            this.prog.lessons.forEach((les: Lesson) => {
              if (les.classroomId) {
                this.aula_http.getAula(les.classroomId).subscribe({
                  next: (aula: Classroom) => {
                    les.classroom = aula;
                  }
                });
              }
            });
          }
        }
      });

      this.course_http.getIscrittiProgCorso(this.id_corso, this.prog._id).subscribe({
        next: (iscritti) => {
          if (this.prog)
            this.prog.inscriptions = iscritti;
        }
      })
    }
  }

  isProgInCorso(): boolean {
    return this.prog?.lessons != undefined && this.prog.lessons.length > 0 && this.prog.lessons.every(les => new Date(les.date) >= new Date());
  }

  checkInscriptionLimit(): boolean {
    return !this.prog?.inscriptionLimit || (this.prog?.inscriptions != undefined && this.prog.inscriptions.length < this.prog?.inscriptionLimit);
  }

  isInscriptionLimitReached(): boolean {
    return this.prog != undefined && this.prog.inscriptionLimit != null && this.prog.inscriptions != undefined && this.prog.inscriptions.length >= this.prog.inscriptionLimit;
  }

  getFreeSetsCount(): number | undefined {
    if (this.prog?.inscriptionLimit == null) return undefined;
    if (this.prog.inscriptions) {
      return this.prog?.inscriptionLimit - this.prog.inscriptions.length;
    } else return undefined;
  }

  isCourseTeacher(): boolean {
    if (this.getId() == undefined) return false;
    else return this.docente_corso?._id === this.getId();
  }

  showQR(id_corso: string, id_prog_corso: string, id_lezione: string, passcode: string): void {
    this.QRInfo = `${FRONTEND_URL}/login?pres_code=${id_corso}.${id_prog_corso}.${id_lezione}.${encodeURIComponent(CryptoJS.AES.encrypt(passcode, SECRET).toString())}`;
    console.log(this.QRInfo) //TODO: togliere
  }
}
